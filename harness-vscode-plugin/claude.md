# Harness VS Code Extension — Context & Requirements

> Last updated: 2026-04-20

---

## Overview

A VS Code sidebar extension that surfaces Harness pipeline execution (CI, CD, STO, TI, AIDA, OPA, SSCA, CCM) directly in the editor, scoped to the developer's current git branch + commit SHA. Zero context-switching.

**GitHub repo:** `github.com/luisredda/harness-vscode-plugin`
**Entry point:** `src/extension.ts`
**Build:** `npm run compile` → esbuild produces `dist/extension.js` (CJS) + `dist/webview.js` + `dist/webview.css`

---

## Architecture

### Key files

| File | Role |
|------|------|
| `src/extension.ts` | Activation, command registration, poller wiring, approval submit |
| `src/config/configManager.ts` | Reads/writes PAT + identifiers; splits global vs workspace config |
| `src/auth/onboarding.ts` | 2-phase onboarding: global (PAT+AccountID) → workspace (Org/Project dropdowns) |
| `src/api/accountService.ts` | Fetches orgs + projects from Harness API for onboarding dropdowns |
| `src/api/approvalService.ts` | Submits approve/reject via `POST /gateway/pipeline/api/v1/.../approvals/execution/{id}` |
| `src/api/rerunService.ts` | Re-runs completed pipeline executions (API endpoint under investigation) |
| `src/api/userService.ts` | Fetches current user + checks group membership to gate approval buttons |
| `src/git/gitContext.ts` | Reads branch + SHA from `vscode.git` extension API |
| `src/api/harnessClient.ts` | Typed fetch wrapper, injects auth headers |
| `src/api/logService.ts` | Log fetch (blob/download + stream fallback), ZIP parsing |
| `src/api/aidaService.ts` | AIDA RCA call (currently 404 — needs investigation) |
| `src/pipeline/pipelinePoller.ts` | Branch/SHA match → execution detail fetch loop; tracks detail execution for history view |
| `src/pipeline/executionDispatcher.ts` | Fan-out to CI/CD/STO/TI/SSCA/OPA/CCM/AIDA/Approval modules |
| `src/ui/sidebarProvider.ts` | `WebviewViewProvider` — injects HTML, logo URI, nonce |
| `src/ui/webviewBridge.ts` | Typed message bus between extension host and webview |
| `src/ui/webview/main.ts` | All webview rendering (browser context, no vscode APIs) |
| `src/ui/webview/styles.css` | All styles — simple theme (VS Code variables) + enhanced theme (OKLCH tokens) |
| `src/fme/fmeClient.ts` | Harness Feature Management Engine (FME) client using Split.io SDK |
| `src/logs/logContentProvider.ts` | VS Code TextDocumentContentProvider for `harness-log://` scheme |
| `src/logs/logEditorTab.ts` | Opens step logs in editor tabs with formatted display |
| `src/ai/detector.ts` | Detects Claude Code CLI/Extension and checks MCP configuration status |
| `src/ai/mcpConfigurer.ts` | Writes Harness MCP server config to `~/.claude.json` |
| `src/ai/promptBuilder.ts` | Builds contextual prompts with pipeline execution data for AI queries |
| `src/ai/launcher.ts` | Launches Claude Code CLI or Extension with prompts |
| `src/ui/webview/ai-bar.css` | AI bar styles (dual-theme support) |

---

## Data Flow

```
git branch + SHA
  → POST /pipeline/api/pipelines/execution/summary (branch filter)
      → SHA match client-side (supports short/full SHA, GitHub/GitLab/Bitbucket)
          → GET /pipeline/api/pipelines/execution/v2/{planExecutionId}?renderFullBottomGraph=true
              → executionDispatcher inspects moduleInfo keys:
                  moduleInfo.ci      → log fetch (blob/download or stream)
                  moduleInfo.cd      → deployment status
                  terminal runs      → STO findings (always attempted, returns [] if none)
                  moduleInfo.ti      → test results + flaky → diagnostics
                  moduleInfo.ssca    → SBOM component flags → diagnostics
                  moduleInfo.ccm     → build cost
                  governanceMetadata → OPA policy row (embedded in execution response)
                  any stage FAILED   → AIDA RCA (currently broken — 404)
                  status=APPROVALWAITING → approval card with Approve/Reject buttons
```

---

## CI Log Fetching

Two-approach strategy in `src/api/logService.ts`:

1. **`POST /gateway/log-service/blob/download?accountID=...&prefix=<logBaseKey>`** with PAT (`x-api-key`)
   - Returns a signed URL → download ZIP → extract all files → parse NDJSON
   - Requires feature flag `SPG_LOG_SERVICE_ENABLE_DOWNLOAD_LOGS` on the account
   - ZIP uses Central Directory (not local header) for compressed sizes — streaming ZIPs have `compSize=0` in local header

2. **`GET /log-service/stream?accountID=...&key=<logBaseKey>`** with log-service token (`X-Harness-Token`)
   - Token fetched via `GET /log-service/token?accountID=...` with PAT
   - Fallback when FF not enabled or download fails

`logBaseKey` format (from `executionGraph.nodeMap[id].logBaseKey`):
```
accountId:X/orgId:Y/projectId:Z/pipelineId:P/runSequence:N/level0:pipeline/...
```

### Terminal execution log behavior

**Live mode ("This commit"):**
- Fetch logs for **all** steps in background (so clicking any step works)
- `LOG_CHUNK` messages carry `autoExpand: false` - user must click to expand steps
- No auto-expansion - gives user control over which logs to view

**Detail mode (history view):**
- Logs are fetched **on-demand** when user clicks a step to expand
- `LOG_CHUNK` messages carry `autoExpand: false` - user must manually click to view logs
- This prevents steps from auto-expanding when navigating between executions

### Log Viewer Variations (FME-gated)

The extension supports multiple log viewing experiences controlled by Harness Feature Management Engine (FME):

**Variation flag:** `vscode-log-experience`
- **`inline`** — Logs displayed in collapsible tree within sidebar
- **`expanded`** (default) — Logs open in separate editor tab (VS Code column 2) with formatted display
- **`drawer`** — Reserved for future implementation

When `expanded` is active:
- Logs open via `harness-log://` URI scheme with custom `TextDocumentContentProvider`
- Header displays pipeline → stage → step hierarchy, execution ID, duration, status
- Log lines formatted with line numbers, timestamps, and level detection (INFO/WARN/ERROR/SUCCESS/DEBUG)
- Syntax highlighting via TextMate grammar (`syntaxes/log.tmLanguage.json`):
  - ERROR/FAIL/FATAL → red (`markup.deleted`)
  - WARN/WARNING → yellow (`markup.changed`)
  - SUCCESS/PASS/DONE → green (`markup.inserted`)
  - INFO/DEBUG → muted (`comment`)
  - Line numbers → `constant.numeric`, timestamps → `string`, headers → `comment.line`
- Opens in `ViewColumn.Two` (preserves sidebar focus)
- Webview receives `STEP_LOGS_OPENED_IN_TAB` instead of `LOG_CHUNK`

Implementation: `src/logs/logEditorTab.ts` + `src/logs/logContentProvider.ts` + `syntaxes/log.tmLanguage.json`

---

## Step Traversal (executionGraph)

`layoutNodeMap` has stages only. Step-level detail is in `executionGraph.nodeMap` + `nodeAdjacencyListMap`.

```
STAGE node
  └── children[] → container nodes (NG_SECTION, FORK, liteEngineTask, etc.)
        └── children[] → leaf step nodes
              └── nextIds[] → next step in sequence (within stage)
  └── nextIds[] → NEXT STAGE (do NOT traverse)
```

**`STAGE_TYPES`** — stop traversal at these (do not descend):
`IntegrationStageStepPMS`, `DeploymentStageStepPMS`, `ApprovalStageStepPMS`, `CustomStageStepPMS`, `PIPELINE_STAGE`, `PIPELINE_ROLLBACK`, `STAGE_ROLLBACK`

**`CONTAINER_TYPES`** — drill through (not rendered as steps):
`NG_SECTION`, `NG_SECTION_WITH_ROLLBACK_INFO`, `FORK`, `NG_FORK`, `ROLLBACK_OPTIONAL_CHILD_CHAIN`, `PIPELINE`, `PIPELINE_SECTION`, `BARRIER`, `QUEUE`, `STRATEGY`, `STEP_GROUP`, `CI_STEP_GROUP`, `INFRASTRUCTURE_SECTION`, `GITOPS_CLUSTERS`, `SPEC`, `STAGES_STEP`, `NG_EXECUTION`, `liteEngineTask`, `LITEENGINE_TASK`

Seed `collectSteps` from stage's **children only** (not `nextIds` — those point to the next stage).

### Stage Filtering

`getStages()` filters the stage list to remove:
- **Parallel wrapper nodes** (`nodeType === 'parallel'`) — these are containers used to coordinate parallel execution but shouldn't be displayed
- **Untriggered rollback stages** — `PIPELINE_ROLLBACK` or `STAGE_ROLLBACK` nodes without `startTs` or with `status === 'NOT_STARTED'`

The function still traverses wrapper nodes to follow the execution chain (via `nextIds`), but excludes them from the output.

### Step Visibility Rules

Steps are shown in the webview under the following conditions:

```typescript
showSteps = isActive || ex.isTerminal || ex.status === 'APPROVALWAITING'
```

- **Active stage** (`status === 'RUNNING' || 'ASYNC_WAITING'`) — shows steps for the currently running stage
- **Terminal execution** (`SUCCESS`, `FAILED`, `ABORTED`, etc.) — shows all steps so users can review what happened
- **Approval waiting** (`status === 'APPROVALWAITING'`) — shows completed steps so users can review logs before approving

This ensures that during approval waits, users have full visibility into what executed before the approval step.

---

## Status Normalization

Harness API returns mixed-case statuses (`"Success"`, `"Failed"`). Always normalize with `.toUpperCase()` on ingestion in both extension host and webview.

Terminal statuses: `SUCCESS`, `FAILED`, `ABORTED`, `EXPIRED`, `IGNOREFAILED`, `POLICY_EVALUATION_FAILURE`

---

## Webview Message Types (`WebviewBridge`)

```typescript
| { type: 'EXECUTION_UPDATE'; execution; executionGraph?; isTerminal?; harnessUrl?; commitWebUrl? }
| { type: 'HISTORY_DETAIL';   execution; executionGraph?; harnessUrl?; commitWebUrl? }
| { type: 'LOG_CHUNK';        nodeId: string; lines: string[]; autoExpand?: boolean }
| { type: 'LOGS_UNAVAILABLE' }
| { type: 'GIT_CONTEXT';      ctx; org?: string; project?: string; defaultView?: string; logViewerVariation?: string; themeVariation?: string }
| { type: 'NO_EXECUTION';     ctx }
| { type: 'SHA_MISMATCH';     lastExecution }
| { type: 'AUTH_ERROR' }
| { type: 'STO_SUMMARY';      count; high; medium; critical }
| { type: 'TI_SUMMARY';       failed; flaky; selected; total }
| { type: 'SSCA_SUMMARY';     flagged }
| { type: 'AIDA_UPDATE';      stageId; rca }
| { type: 'OPA_UPDATE';       policy }
| { type: 'CCM_UPDATE';       cost }
| { type: 'CD_UPDATE';        deployments }
| { type: 'APPROVAL_UPDATE';  planExecutionId; approvers?; userGroups?; minimumCount?; deadline? }
| { type: 'EXTERNAL_APPROVAL_UPDATE'; planExecutionId; approvalType: 'Jira' | 'ServiceNow'; ticketId; ticketUrl?; projectKey?; issueType?; ticketType?; approvalCriteria?; rejectionCriteria? }
| { type: 'STEP_LOGS_LOADING'; nodeId: string }
| { type: 'STEP_LOGS_EMPTY';   nodeId: string }
| { type: 'STEP_LOGS_ERROR';   nodeId: string; error: string }
| { type: 'STEP_LOGS_OPENED_IN_TAB'; nodeId: string }
| { type: 'DEFAULT_VIEW_SAVED'; view: string }
```

**Host → Webview messages:**
- `GIT_CONTEXT` includes `defaultView` (user's pinned preference) + `logViewerVariation` (FME flag) + `themeVariation` (FME flag)
- `HISTORY_DETAIL` sent when viewing execution detail from history (includes approval data from earlier messages)
- `STEP_LOGS_OPENED_IN_TAB` sent instead of `LOG_CHUNK` when log viewer variation is `expanded`
- `DEFAULT_VIEW_SAVED` confirms pin preference was saved to settings

**Webview → Host messages:**
- `approval`: `{ type: 'approval', planExecutionId, action: 'APPROVE'|'REJECT' }` — approval action
- `fetchStepLogs`: `{ type: 'fetchStepLogs', nodeId, logBaseKey, stepName?, stageName?, pipelineName?, planExecutionId?, status?, durationMs? }` — on-demand log fetch
- `fetchExecutionDetail`: `{ type: 'fetchExecutionDetail', planExecutionId }` — load detail view for history execution
- `clearExecution`: `{ type: 'clearExecution' }` — exit detail view, return to history list
- `setDefaultView`: `{ type: 'setDefaultView', view: 'thisCommit'|'allExecutions' }` — pin preference change
- `openSettings`: `{ type: 'openSettings', key: string }` — open VS Code settings to specific key

Webview sends `WEBVIEW_READY` on load → bridge flushes queued messages.
HTML must be set on the webview **before** calling `bridge.setView()`.

**Queue Deduplication:** When messages are queued (webview not ready), the bridge keeps only the latest message per type. Step-related messages (`LOG_CHUNK`, `STEP_LOGS_*`) use composite key `type:nodeId` to preserve logs for each step independently.

**Approval Message Handling:** `APPROVAL_UPDATE` and `EXTERNAL_APPROVAL_UPDATE` now target specific executions by `planExecutionId` instead of updating all executions. This prevents incorrect data association when viewing history executions. If the target execution doesn't exist yet (race condition), a placeholder is created to hold the data until the execution detail arrives.

---

## UI Layout

```
┌─────────────────────────────────────┐
│ [Harness logo]  AI for Everything… ⋯│  ← .harness-header (blue gradient + 3-dots menu button)
│ default / my-project  [Switch ↓]    │  ← .project-bar (org/project + Switch button)
├─────────────────────────────────────┤
│ [This commit]  All executions  📌   │  ← .view-toggle (tabs + pin button)
├─────────────────────────────────────┤
│ ⎇ branch · commit abc1234 · just now│  ← .git-bar (only in "This commit" mode)
├─────────────────────────────────────┤
│ ● pipeline-name  [FAILED]  25s  ↗  │  ← .exec-header (dot animates, ↗ links to Harness)
│   CI  CD                            │  ← .module-badges
│   Policy Evaluations  1 warning  ↗ │  ← .opa-row (inline, with tooltip, top+bottom border)
│   ✓ build                      17s │  ← .stage-row
│     ▸ ✓ Clone codebase          3s │  ← .step-row (expandable)
│     ▸ ✓ Build App               1s │
│   ⚠ Security Scan               8s │  ← .stage-row.warning (yellow text, bold - IGNOREFAILED)
│     ▸ ⚠ OWASP Check             5s │  ← .step-row.warning (yellow text, bold)
│   × Deploy K8s Dev              5s │  ← .stage-row.failed (red text, bold)
│     ▾ × Service                 2s │  ← .step-row.failed (red text, bold)
│       [log lines...]               │  ← .log-tail
│   [red banner: failure message]    │  ← .failure-banner (on FAILED)
│   [↺ Refresh]                      │  ← .exec-footer (only on terminal status)
├─────────────────────────────────────┤
│ 📌 "This commit" opens by default   │  ← .pin-footer (only when pinned)
│    Change in settings →             │
├─────────────────────────────────────┤
│ ┌──────────────────────────────────┐│
│ │ [AI icon]  Ask Harness AI…      ││  ← .ai-footer (sticky, disabled for now)
│ └──────────────────────────────────┘│
└─────────────────────────────────────┘
```

### View Modes

- **This commit** (live mode): Shows pipeline execution for current git commit. Requires git repository. Auto-refreshes for running pipelines.
  - **Single latest execution:** When multiple executions exist for the same commit, only the most recent one is shown (`matched[0]`)
  - Prevents duplicate cards when developer manually re-runs a pipeline
- **All executions** (history mode): Shows paginated list of recent executions. Works without git repository.
  - **Filters:** All / Failed / Passed (client-side filtering for reliability)
    - Fetches 100 most recent executions from API
    - Filters by status client-side: `FAILED`/`FAILURE` or `SUCCESS`/`SUCCEEDED` (case-insensitive)
    - More reliable than server-side filtering which had API inconsistencies
  - **Pagination:** 10 executions per page with Previous/Next navigation (client-side pagination of filtered results)
- **Detail** (when clicking history item): Shows full execution detail with on-demand log fetching.
  - **Live polling for running executions:** When viewing a detail execution that's still running, PipelinePoller tracks it via `setDetailExecution(planExecutionId)` and sends `HISTORY_DETAIL` updates until terminal status
  - Polling stops when execution completes or user navigates away (`clearExecution` message)

Git context is only required for "This commit" tab. History and detail modes work independently of local git state.

**Default View Preference:**
- Pin button (📌) in view toggle bar lets you set which view opens by default
- Setting: `harness.defaultView` (thisCommit | allExecutions)
- Unpinned: gray color, tooltip "Pin [active view] as default"
- Pinned: blue color, tooltip "Remove default pin"
- Footer shows: "📌 [View name] opens by default · Change in settings"
- Stored in global VS Code settings, persists across workspaces

**Detail View State Management:**
- When entering detail view for a new execution, all previous execution state is cleared (`state.executions`, `expandedNodes`, `userCollapsed`, `loadingSteps`)
- LOG_CHUNK messages in detail mode are stored only in the execution currently being viewed (`state.detailExecId`)
- This prevents logs from being stored in the wrong execution when navigating between detail views
- **Approval data handling**: `APPROVAL_UPDATE` and `EXTERNAL_APPROVAL_UPDATE` messages target specific executions by `planExecutionId`:
  - If execution doesn't exist yet, a placeholder is created to hold approval data until `HISTORY_DETAIL` arrives
  - `HISTORY_DETAIL` preserves approval data from earlier messages via `msg.approval ?? prev?.approval`
  - This handles race conditions where module dispatch messages arrive before execution detail

---

## App Menu (Multi-Product Hub)

A slide-out drawer accessible via the 3-dots button in the header, providing product navigation and account management.

**Location:** Header top-right corner (3-dots icon)

**Structure:**
- **Header:** Harness logo + close button (X)
- **Products section:**
  - **Pipelines** — Currently active product (marked with blue accent + dot)
  - Icon: Same pipeline SVG used in view toggle tabs (connected boxes)
  - Label: "Pipelines" / Sublabel: "Execution status & logs"
- **Account section:**
  - Shows current org/project (e.g., "acme / payments")
  - Falls back to "Not connected" when not configured
  - Clicking opens native VS Code QuickPick via `harness.switchProject` command
  - User icon on left, chevron on right

**Behavior:**
- Opens/closes via 3-dots button click
- Closes on: scrim click, close button (X), or after triggering account switch
- Smooth slide-in animation from left (260px wide, 200ms cubic-bezier)
- After QuickPick selection, header + account row update via existing `GIT_CONTEXT` message

**Implementation:**
- State: `state.menuOpen` boolean in `main.ts`
- Component: `appMenu()` function (renders only when `menuOpen === true`)
- Event handlers: `toggleMenu`, `closeMenu`, `changeAccount` (fires `harness.switchProject`)
- CSS classes: `.app-menu`, `.app-menu-item`, `.menu-scrim`, `.account-item`, `.app-menu-chev`

**Design note:** Only Pipelines product is shown. Other products (Feature Flags, Builds, Deployments, Security, Test Intel) are not in scope — no "coming soon" entries.

---

## CSS Rules

### Simple Theme (default)

- **All colors** use VS Code CSS variables — never hardcode hex (exception: Harness header gradient uses brand colors `#00ADE4` / `#0052CC`)
- Font: `var(--vscode-font-family)` / `var(--vscode-font-size)`
- Hover: `var(--vscode-list-hoverBackground)`
- Active stage: `var(--vscode-list-activeSelectionBackground)` with blue left border
- Failed stages/steps: `var(--vscode-errorForeground)` with `font-weight: 600` for visibility
- Warning stages/steps (IGNOREFAILED): `var(--vscode-editorWarning-foreground)` with `font-weight: 600` for visibility
- Pin button: unpinned = `var(--vscode-disabledForeground)`, pinned = `var(--vscode-textLink-foreground)`
- Pin tooltip: `var(--vscode-editorHoverWidget-background)`, `var(--vscode-editorHoverWidget-foreground)`, `var(--vscode-editorHoverWidget-border)`
- Log tail: `var(--vscode-editor-background)`, monospace, `max-height: 120px`, scrollable

### Enhanced Theme (FME-gated)

See **Theme Variations** section below for full details.

---

## Harness Logo

Stored at `icons/harness-logo.png` (downloaded from Harness CDN, white variant).
Served via `webview.asWebviewUri()` and injected as `window.__HARNESS_LOGO__` in the HTML template.
CSS filter `brightness(0) invert(1)` ensures it stays white on the gradient header.

---

## Theme Variations

The extension supports two theme implementations controlled by Harness Feature Management Engine (FME):

**FME Flag:** `vscode-bar-experience`
- **`simple`** — Uses VS Code CSS variables, minimal styling
- **`enhanced`** (default) — Uses OKLCH color tokens, cards-based UI with light/dark theme support

### Architecture

**Theme Coexistence:**
- Both themes coexist in `src/ui/webview/styles.css`
- Simple theme: global styles (default)
- Enhanced theme: scoped under `.theme-enhanced` body class
- **Shared components:** Both themes use the same blue gradient header (`.harness-header`) and project bar (`.project-bar`)
- Theme applied via `applyTheme(variation)` in `main.ts` which sets `<body class="theme-enhanced">` or removes class

**Enhanced Theme Only:**
- Light/dark theme auto-detection:
  - `MutationObserver` watches `body.vscode-dark` / `body.vscode-light` classes
  - `prefers-color-scheme` media query listener for manual theme changes
  - Applies `.theme-light` class to body when light theme detected
- Light theme overrides scoped under `.theme-enhanced.theme-light`

### OKLCH Color System (Enhanced Theme)

Enhanced theme uses OKLCH color space for better perceptual uniformity across light/dark themes.

**Design Tokens** (defined under `.theme-enhanced`, overridden under `.theme-enhanced.theme-light`):

```css
/* Dark theme (default) */
--accent: oklch(0.70 0.20 240);  /* Blue accent */
--ok:     oklch(0.75 0.18 145);  /* Success green */
--err:    oklch(0.65 0.22 25);   /* Error red */
--warn:   oklch(0.80 0.18 85);   /* Warning amber */

/* Background layers (darkest to lightest) */
--bg-0: oklch(0.17 0.01 240);    /* Canvas */
--bg-1: oklch(0.20 0.01 240);    /* Cards */
--bg-2: oklch(0.24 0.01 240);    /* Elevated */
--bg-3: oklch(0.28 0.01 240);    /* Hover */
--bg-4: oklch(0.32 0.01 240);    /* Active */

/* Foreground layers (muted to primary) */
--fg-0: oklch(0.45 0.01 240);    /* Muted text */
--fg-1: oklch(0.60 0.01 240);    /* Secondary text */
--fg-2: oklch(0.80 0.01 240);    /* Primary text */
--fg-3: oklch(0.95 0.01 240);    /* High contrast */
```

**Light theme overrides** (`--bg-*` inverted, `--fg-*` adjusted for contrast on white background).

### Stage Collapse/Expand Behavior (Enhanced Theme)

Enhanced theme implements **§7.1 single-focus rule** from handoff spec:

**Default State:**
- First stage with running/failed/warning steps: **expanded**
- All other stages: **collapsed**
- Recomputed on every execution update via `recomputeStageDefaults()`

**User Override:**
- When user clicks stage toggle: tracked in `userToggledStages` Set (stage ID)
- Tracks whether user-toggled stage is open (`userToggledStagesOpen` Map)
- User overrides persist until execution changes (new execution → clear overrides)
- `isStageExpanded(stageId)` checks user override first, then falls back to default

**Implementation** (`main.ts`):
```typescript
const userToggledStages = new Set<string>();
const userToggledStagesOpen = new Map<string, boolean>();
const expandedStagesDefault = new Map<string, boolean>();

function recomputeStageDefaults() {
  // Single-focus: expand first stage with steps that matter
  let foundFirst = false;
  for (const stage of stages) {
    const hasInterestingSteps = /* running/failed/warning */;
    expandedStagesDefault.set(stage.id, !foundFirst && hasInterestingSteps);
    if (hasInterestingSteps) foundFirst = true;
  }
}

function isStageExpanded(stageId: string): boolean {
  if (userToggledStages.has(stageId)) {
    return userToggledStagesOpen.get(stageId) ?? false;
  }
  return expandedStagesDefault.get(stageId) ?? false;
}
```

**Note:** Simple theme does not implement this behavior — all stages remain expanded by default.

### Enhanced Theme UI Differences

Key visual/behavioral differences from simple theme:

- **Cards-based layout:** Pipeline cards have elevated background (`.pipeline-card` with `--bg-1`)
- **Compact re-run UI:** Inline re-run button in pipeline header (replaces separate row)
- **Error banner positioning:** Shown inside failed stage (not below entire execution)
- **Approval palette:** Uses amber color (`--warn`) instead of blue
- **Stage collapse:** Single-focus rule (see above)
- **Module badges:** Rounded pills with `--bg-3` background
- **Status icons:** Unicode symbols (✓ × ⚠ ⏱) instead of text labels
- **Timing display:** Compact format with symbols

### Theme Selection Flow

1. Extension activates → `initFmeClient()` in `src/fme/fmeClient.ts`
2. On each poller tick → `getBarExperience()` fetches current variation
3. `GIT_CONTEXT` message includes `themeVariation: 'simple' | 'enhanced'`
4. Webview receives message → `applyTheme(msg.themeVariation)`
5. Light/dark detection (enhanced only) → applies `.theme-light` if needed

**Graceful degradation:** If FME fails or timeout → defaults to `simple` theme.

---

## Commit URL Behavior

Commit links are built from **pipeline execution data**, not local git context:

### Live Mode ("This commit")
- Uses local git remote URL to build commit link (as execution matches local commit)

### History/Detail Mode (previous executions)
- **Priority 1**: Use `moduleInfo.ci.repoUrl` from execution (if present)
- **Priority 2**: Extract org/project from execution's `logBaseKey` (`orgId:X/projectId:Y`) + `ci.repoName` → construct Harness Code URL
- **Priority 3**: Fallback to current config org/project + `ci.repoName` (may be incorrect if user switched orgs)

**Example:** Viewing execution from `org-A/project-A` while extension is set to `org-B/project-B`:
- Commit link correctly points to repo in `org-A/project-A` (extracted from logBaseKey)
- Not `org-B/project-B` (current selection)

This ensures commit links work when browsing pipelines across different orgs/projects.

---

## Onboarding Flow

Hybrid settings approach: **Global by default, Workspace overrides when needed**.

### Two-phase setup:

1. **Global** (once per machine) — `Harness: Configure API Key`:
   - Base URL (default `https://app.harness.io`)
   - PAT → stored in `SecretStorage`
   - Account ID → stored in Global VS Code settings

2. **Project Selection** — auto-prompted or `Harness: Select Org & Project`:
   - Fetches orgs via `GET /ng/api/organizations?accountIdentifier=...`
   - QuickPick → fetches projects via `GET /ng/api/projects?accountIdentifier=...&orgIdentifier=...`
   - QuickPick → saves `orgIdentifier` + `projectIdentifier` to **Global** settings

### Workspace Override (optional):

**Command:** `Harness: Switch Project (This Workspace)`
- Use case: Working on different projects in different workspace folders
- Saves `orgIdentifier` + `projectIdentifier` to **Workspace** settings
- Workspace settings override Global settings for that workspace only
- Closing workspace → falls back to Global settings

### Config Resolution Order:

```
Workspace settings (if present)
  ↓ (overrides)
Global settings (fallback)
```

### Config Storage:

- `SecretStorage`: `harness.apiKey` (PAT) — global
- Global settings: `harness.baseUrl`, `harness.accountIdentifier`, `harness.orgIdentifier`, `harness.projectIdentifier`, `harness.fmeSdkKey` (optional), `harness.defaultView` (optional)
- Workspace settings (optional overrides): `harness.orgIdentifier`, `harness.projectIdentifier`

**Behavior:**
- ✅ Works without workspace (uses Global settings)
- ✅ No re-prompting when closing/opening workspaces
- ✅ Per-workspace project override when needed (opt-in)

---

## Harness Feature Management (FME)

The extension integrates with Harness Feature Management Engine to enable controlled feature rollouts via feature flags.

**Architecture:**
- Uses Split.io SDK (`@splitsoftware/splitio`) as FME's underlying engine
- Initialized on activation if `harness.fmeSdkKey` is configured in settings
- User targeting based on Harness user email (from `GET /ng/api/user/currentUser`)
- Falls back to VS Code machine ID if user fetch fails
- Graceful degradation: FME failure → defaults to baseline behavior (no blocking)

**Configuration:**
- **Default embedded key** — Extension ships with a public client SDK key for all end users
- Setting: `harness.fmeSdkKey` (global) — Optional override for custom FME environment
- Environment variable: `HARNESS_FME_SDK_KEY` (fallback for development, reads from `process.env`)
- Priority: VS Code settings > environment variable > default embedded key
- Refresh rate: 60 seconds (auto-polls for flag updates)
- Ready timeout: 5 seconds (uses cached values if network unavailable)

**Note:** Client SDK keys are designed to be public-facing and safe to embed in client applications. They only allow reading feature flags, not modifying them.

**Current flags:**
- `vscode-log-experience` — Controls log viewer UX
  - Variations: `inline`, `expanded` (default - editor tabs), `drawer` (reserved)
  - See "Log Viewer Variations" section above for behavior details
- `vscode-bar-experience` — Controls theme implementation
  - Variations: `simple`, `enhanced` (default - cards UI with OKLCH colors)
  - See "Theme Variations" section below for architecture details

**Events:**
- `SDK_READY` — Flags loaded from Harness
- `SDK_READY_FROM_CACHE` — Offline mode, using cached flag states
- `SDK_READY_TIMED_OUT` — Network timeout, defaults to `control` (baseline)
- `SDK_UPDATE` — Flag states refreshed (logs new values to console)

**Implementation:** `src/fme/fmeClient.ts`
- `initFmeClient()` — Called on activation (non-blocking)
- `getLogViewerVariation()` — Returns current variation for `vscode-log-experience`
- `getBarExperience()` — Returns current variation for `vscode-bar-experience`
- `refreshFmeClient()` — Force-refresh flags (for debugging)
- `destroyFmeClient()` — Cleanup on deactivation

**Design principle:** FME enhances the extension but never blocks core functionality. All flag checks default to baseline behavior on failure.

---

## Approval Flow

The extension supports both **Harness native approvals** and **external approvals** (Jira/ServiceNow).

### Harness Native Approval

When execution status is `APPROVALWAITING` and `HarnessApproval` step is found:
- Dispatcher finds `HarnessApproval` step in `executionGraph.nodeMap`
- Reads approver groups + minimum count from `stepParameters.spec.approvers`
- Extracts `stageIdentifier` from step's `baseFqn` (e.g., `pipeline.stages.Deploy_Dev.spec.execution.steps.promotionApproval` → `Deploy_Dev`)
- Sends `APPROVAL_UPDATE` with `planExecutionId` + display info + `canApprove` flag + `stageIdentifier`
- Webview renders approval card **inside the approval step** (not at stage level):
  - Approval card only shows for steps with `stepType: 'HarnessApproval'` AND actively waiting status (`APPROVALWAITING`, `ASYNC_WAITING`, or `RUNNING`)
  - Completed approval steps (status: `SUCCESS`) do not show the card
  - Approval step is **auto-expanded** to display the card immediately
  - `StepInfo` includes `stepType` field to identify approval steps during rendering
- **Steps from completed stages are visible** during approval waiting (so users can review logs before approving)
- Approve/Reject buttons POST to:
  `POST /gateway/pipeline/api/v1/orgs/{org}/projects/{project}/approvals/execution/{planExecutionId}`
  with `Harness-Account` header (not `accountIdentifier` query param)

**Permission check** (`src/api/userService.ts`):
1. `GET /ng/api/user/currentUser?accountIdentifier=...` → resolves UUID + email
2. Check direct user match against `stepParameters.spec.approvers.users` (uuid or email)
3. For each group in `stepParameters.spec.approvers.userGroups`, call:
   `GET /ng/api/user-groups/{groupId}/member/{userUuid}?...`
   - Group scope prefix determines query params:
     - `account.<id>` → account-scoped (no org/project)
     - `org.<id>` → org-scoped (account + org)
     - `_project_<id>` or bare `<id>` → project-scoped (account + org + project)
4. `canApprove: false` → buttons replaced with "You are not in the approver list" message
5. On any API failure → defaults to `canApprove: true` (fail open, never block a legitimate approver)

### External Approval (Jira/ServiceNow)

When execution status is `APPROVALWAITING` and `JiraApproval` or `ServiceNowApproval` step is found:
- Dispatcher detects external approval step type
- Extracts `stageIdentifier` from step's `baseFqn`
- Extracts ticket information from `stepParameters.spec`:
  - **Jira**: `issueKey`, `projectKey`, `issueType`, `approvalCriteria`, `rejectionCriteria`
  - **ServiceNow**: `ticketNumber`, `ticketType`, `approvalCriteria`, `rejectionCriteria`
- Sends `EXTERNAL_APPROVAL_UPDATE` with ticket details + `stageIdentifier`
- Webview renders external approval card **inside the approval step** showing:
  - Ticket ID with link (when URL can be constructed)
  - Project/issue metadata
  - Approval and rejection conditions
  - Note: "Update the ticket in [Jira/ServiceNow] to proceed"
  - Card only appears for steps actively waiting (same status check as Harness approval)
  - Step is auto-expanded to show the card
- **Logs for previous steps are still fetched** (status `APPROVALWAITING` now triggers log fetching)

**Ticket URL construction:**
- Jira: `https://harness.atlassian.net/browse/{issueKey}` (may need connector lookup for custom instances)
- ServiceNow: `https://instance.service-now.com/nav_to.do?uri={ticketType}/{ticketNumber}` (needs connector lookup)

---

## AI Integration (Harness MCP)

The extension integrates Claude Code (CLI or Extension) with Harness pipeline data via Model Context Protocol (MCP).

**Architecture:**
- Detects installed AI tools: Claude Code CLI (`which claude`) and/or Claude Code Extension (VS Code API)
- User can switch between tools via picker if both are installed
- **Tool preference persists** across sessions via VS Code globalState (`harness.aiToolPreference`)
- MCP configuration written to `~/.claude.json`
- AI bar shows 6 states: detecting, none, unconfigured, ready, sending, error

**Tool Selection:**
- CLI integration: Fully automated (spawns subprocess, returns response directly in Harness sidebar)
- Extension integration: Semi-automated (auto-opens panel, copies prompt, shows "Paste Now" button)
- User's tool choice saved to globalState and persists across VS Code restarts
- All `detectAITools()` calls respect the saved preference

**Extension Integration Flow:**
1. User sends AI query with Extension selected
2. Extension auto-opens using `claude-vscode.focus` command (works even when closed)
3. Creates new conversation with `claude-vscode.newConversation`
4. Copies prompt to clipboard
5. Shows notification with **"Paste Now"** button
6. User clicks button → prompt automatically pastes into Claude's input
7. User sends to Claude and conversation happens in Claude Code panel

**MCP Configuration Flow:**
1. User clicks "Configure MCP" in unconfigured state
2. Extension reads PAT from `SecretStorage` (already configured for Harness)
3. Writes MCP server config to `~/.claude.json`:
   - **Global mcpServers** — Used when not in a project directory
   - **Project-specific mcpServers** — Used when inside a Claude Code project directory
   - Adds to ALL existing projects so it works everywhere
   ```json
   {
     "mcpServers": {
       "harness": {
         "type": "stdio",
         "command": "npx",
         "args": ["harness-mcp-v2"],
         "env": {
           "HARNESS_API_KEY": "<from-secret-storage>",
           "HARNESS_BASE_URL": "https://app.harness.io",
           "HARNESS_ACCOUNT_ID": "...",
           "HARNESS_ORG_ID": "...",
           "HARNESS_PROJECT_ID": "..."
         }
       }
     },
     "projects": {
       "/path/to/project": {
         "mcpServers": {
           "harness": { /* same config */ }
         }
       }
     }
   }
   ```
4. Preserves existing config: merges with other MCP servers, keeps custom env vars
5. User must **restart Claude Code** to activate MCP server

**Prompt Context:**
When user asks a question, the extension includes:
- Pipeline name, status, execution ID
- Git branch and commit SHA
- Stage list with status, duration, and error messages
- Org/Project identifiers

**Files:**
- `src/ai/detector.ts` — Detects tools, checks MCP readiness, accepts preferred tool parameter
- `src/ai/mcpConfigurer.ts` — Writes/updates MCP config (preserves existing settings)
- `src/ai/promptBuilder.ts` — Builds contextual prompts from execution data
- `src/ai/launcher.ts` — Spawns CLI subprocess OR auto-opens Extension with "Paste Now" UX
- `src/extension.ts` — Manages tool preference in globalState, passes to all `detectAITools()` calls
- `src/ui/webview/ai-bar.css` — Dual-theme styles for AI bar
- `src/ui/webview/main.ts` — AI bar rendering + event delegation

**Important:**
- PAT is **automatically** pulled from SecretStorage (no user re-entry)
- Configuration **checks for existing** `mcpServers.harness` and preserves custom settings
- Only updates managed fields (API key, base URL, account/org/project IDs)
- User customizations (custom command, args, extra env vars) are preserved
- **Tool preference persists globally** — once user switches to Extension (or CLI), that choice is remembered across all workspaces and VS Code restarts
- Extension auto-open uses `claude-vscode.focus` command which works even when panel is completely closed

---

## Debugging & Export Tools

**Export Execution Data:**
- Command: `Harness: Export Last Execution to JSON`
- Exports the **currently viewed execution** (from "This commit" live mode or "All executions" detail view)
- Saves full execution response (including `executionGraph`) to a JSON file with pipeline name in filename
- Tracks current execution via `EXECUTION_UPDATE` and `HISTORY_DETAIL` messages
- Cleared on `NO_EXECUTION` message
- Useful for inspecting pipeline structure, debugging step detection, and understanding API responses

**Debug Output Channel:**
- Command: `Harness: Show Debug Output`
- Logs every pipeline execution fetch with full JSON payload
- Auto-created in `PipelinePoller`, enabled via `outputChannel` parameter
- Helps diagnose API issues, status normalization, and execution flow

**FME Debug:**
- Command: `Harness: Debug FME Flags` (for development)
- Refreshes and logs current FME feature flag states to console
- Helps verify flag targeting and variation assignment

**Execution Tracking:**
- Extension tracks `currentViewedExecution` (execution + graph) from `EXECUTION_UPDATE` and `HISTORY_DETAIL` messages
- Export command uses this tracked execution (works for both live and history detail views)
- Cleared on `NO_EXECUTION` message

---

## Known Issues / TODO

1. **Pipeline Re-run API endpoint** — UI button implemented but API endpoint returns 404. Tested multiple endpoint variations:
   - `/pipeline/api/pipelines/execution/rerun/v2/{planExecutionId}/{pipelineIdentifier}`
   - `/pipeline/api/pipelines/execution/rerun/{planExecutionId}/{pipelineIdentifier}`
   - `/gateway/pipeline/api/pipeline/execute/{pipelineIdentifier}/retryPipeline`
   
   All return 404/400. Need to find correct Harness API endpoint for pipeline re-run with original inputs. Implementation exists in `src/api/rerunService.ts` and UI in both enhanced/simple themes.

2. **AIDA RCA** — `POST /aida/api/v1/root-cause-analysis` returns 404. Correct endpoint unknown. Needs research against current Harness API docs or network inspection in the Harness UI.

3. **"Ask Harness AI" input** — Rendered in footer but does nothing. Needs AIDA chat API integration once endpoint is confirmed.

4. ~~**FME (Feature Management)**~~ — Implemented. Uses Split.io SDK to fetch feature flags from Harness. Currently gates log viewer variations (`inline` vs `expanded`) and theme variations (`simple` vs `enhanced`).

5. ~~**Approval permission check**~~ — Implemented. Buttons gated on group membership via `GET /ng/api/user-groups/{id}/member/{uuid}`.

6. **Harness FF (Feature Flags) SDK detection** — Not yet implemented. Future: scan open files for `@harnessio/ff-*-sdk` calls and display flag state inline from `/cf/admin/features/{key}`.

---

## Build & Run

```bash
npm install
npm run compile      # esbuild — outputs dist/

# In VS Code: F5 → Extension Development Host  (launch.json pre-configured)
# First run: Cmd+Shift+P → "Harness: Configure API Key" (sets PAT + AccountID globally)
# Per workspace: Cmd+Shift+P → "Harness: Select Org & Project" (org/project dropdowns)
```

**FME SDK Key (Feature Flag Support)**
- Extension ships with a default FME SDK key (works out of the box for all users)
- Optional override: Set `HARNESS_FME_SDK_KEY` in `.vscode/launch.json` or VS Code settings
- Only needed for testing custom feature flag configurations during development
- Get your key from: Harness → Account Settings → Feature Flags → Environments → SDK Keys

`.vscode/launch.json` — pre-configured "Run Extension" debug profile (extensionDevelopmentHost).
`.vscode/tasks.json` — runs `npm run compile` as preLaunchTask.
`.vscodeignore` — excludes `src/`, `node_modules/`, `.vscode/`, config files from packaged `.vsix`.

**Package:**
```bash
npm run package   # vsce package → harness-vscode-0.x.x.vsix
```
