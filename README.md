# Harness Pipeline — VS Code Extension

See your Harness pipeline status, logs, and security results without leaving your editor.

---

## What it does

Monitor all your Harness pipelines and executions directly in VS Code. The extension surfaces pipeline status, execution details, stages, steps, logs, test results, security findings, policy evaluations, and approval gates — all in the sidebar.

**Plus:** Ask questions about your pipelines using **Claude Code** with automatic context injection via MCP.

No tab switching. No copy-pasting execution IDs. No context-switching to investigate failures.

---

## Requirements

- VS Code 1.85+
- Node.js 18+
- A Harness account with at least one pipeline configured
- A Harness Personal Access Token (PAT)

---

## Building from Source

### Dependencies

Install all dependencies (includes `esbuild`, `typescript`, and `@vscode/vsce`):

```bash
npm install
```

### Compile

```bash
npm run compile
```

This runs esbuild and outputs:
- `dist/extension.js` — extension host bundle (CJS)
- `dist/webview.js` — webview bundle
- `dist/webview.css` — webview styles

To watch for changes during development:

```bash
npm run watch
```

### Run in VS Code

Press **F5** in VS Code to launch an Extension Development Host with the extension loaded. The `compile` step runs automatically as a pre-launch task.

### Package as `.vsix`

First install the packaging tool globally if you haven't:

```bash
npm install -g @vscode/vsce
```

Then build and package:

```bash
npm run compile && npm run package
```

This produces `harness-vscode-0.x.x.vsix`, which can be installed via **Extensions: Install from VSIX** in the Command Palette.

---

## Setup

### First-time setup (global configuration)

1. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run **Harness: Configure API Key**
3. Enter your Harness base URL (default: `https://app.harness.io`)
4. Enter your PAT — get it from **Account Settings → Access Management → API Keys**
5. Enter your Account ID — found at **Account Settings → Overview**
6. Select your organization from the dropdown
7. Select your project from the dropdown

**All settings are saved globally** — they work across all workspaces and even without a workspace folder open. Your PAT is stored securely in VS Code's secret store.

### Per-workspace override (optional)

If you work on multiple projects in different workspace folders, you can override the global settings for specific workspaces:

1. Open the workspace where you want a different project
2. Run **Harness: Switch Project (This Workspace)** from the Command Palette
3. Select a different org and project

The workspace-specific settings override your global settings for that workspace only. Close the workspace, and the extension falls back to your global settings.

**To change global settings:** Run **Harness: Select Org & Project**

---

## Feature Flags (FME)

The extension ships with a default Harness Feature Management Engine (FME) SDK key that enables feature flag-gated UX variations for all users. **No configuration needed!**

### Available FME-Gated Features

- **Log Viewer Mode** (`vscode-log-experience`):
  - `inline` — Logs displayed in collapsible tree within sidebar
  - `expanded` (default) — Logs open in separate editor tab with syntax highlighting
  
- **UI Theme** (`vscode-bar-experience`):
  - `simple` — Minimal theme using VS Code color variables
  - `enhanced` (default) — Cards-based UI with OKLCH color system, light/dark auto-detection, and polished animations

- **AI Chat** (`vscode-mcp-integration`):
  - `off` — AI chat footer hidden
  - `on` — AI chat footer visible, enables Claude Code integration

### For Developers (Testing Custom Flags)

If you want to test with your own FME environment during development:

1. Get your FME SDK key from Harness:
   - Navigate to: **Account Settings → Feature Flags → Environments → SDK Keys**
   - Create a new **Client SDK Key** (or use an existing one)
   - Copy the key (starts with `client-`)

2. Add it to `.vscode/launch.json`:
   ```json
   {
     "version": "0.2.0",
     "configurations": [{
       "name": "Run Extension",
       "env": {
         "HARNESS_FME_SDK_KEY": "client-your-key-here"
       }
     }]
   }
   ```

3. Press **F5** — your custom key overrides the default

**Alternative:** Set `harness.fmeSdkKey` in VS Code user settings to override globally.

---

## AI Integration (Claude Code)

Ask questions about your pipeline executions using **Claude Code** (CLI or Extension) with Harness-specific context automatically included via Model Context Protocol (MCP).

### Setup

1. **Install Claude Code** (choose one):
   - **CLI**: Install from [claude.ai/code](https://claude.ai/code)
   - **VS Code Extension**: Install [Claude Code Extension](https://marketplace.visualstudio.com/items?itemName=Anthropic.claude-code) from the marketplace

2. **Configure MCP** (one-time):
   - Click **Configure MCP** in the AI footer (appears when AI chat is enabled via FME)
   - Your Harness PAT and account details are automatically copied to `~/.claude.json`
   - Restart Claude Code to activate the Harness MCP server

3. **Select your preferred tool**:
   - Click the tool picker in the AI footer to switch between CLI and Extension
   - Your choice persists across VS Code sessions

### Using AI Integration

**With CLI (fully automated):**
- Ask a question in the AI footer
- Claude CLI runs in background with pipeline context
- Response appears directly in the Harness sidebar

**With Extension (semi-automated):**
- Ask a question in the AI footer
- Claude Code Extension opens automatically (even if closed)
- New conversation starts with your question copied to clipboard
- Click **"Paste Now"** button to paste and send
- Continue the conversation in Claude Code panel

**What context is included:**
- Pipeline name, status, execution ID
- Current git branch and commit SHA
- Stage list with status, duration, and error messages
- Org/Project identifiers
- Harness execution URL

Claude Code can use the **Harness MCP server** to fetch full execution details, logs, and other data via API.

---

## View Modes

The extension offers two view modes, accessible via tabs at the top:

### Pipelines

Browse and manage all pipelines in your project:
- **Search pipelines** by name or type
- **Filter by status**: All / Failed / Running / Waiting for Approval
- **Sort** by name, recent activity, or pinned status
- **Pin pipelines** to keep your most-used ones at the top
- **Click any pipeline** to view its most recent execution with full details, logs, and stage breakdown
- Shows pipeline status badge, last run time, and module badges (CI, CD, etc.)
- **Works without a git repository** — uses your global org/project settings

This mode gives you a dashboard view of all your pipelines and their current status.

You can **pin** this view as your default using the 📌 button — the extension will always open to this view when VS Code starts.

### Executions

Browse execution history across all pipelines in your project:
- **Filter by status**: All / Failed / Passed
- **Filter by pipeline**: Click a pipeline name to see only its executions
- **Paginated view**: 10-15 executions per page with Previous/Next navigation
- **Click any execution** to view full details, logs, and stage/step breakdown
- **Re-run button** available for completed pipelines (currently under development)
- **Works without a git repository or workspace folder** — uses your global org/project settings

This mode is useful for:
- Reviewing failed runs across all pipelines
- Checking execution history when you're not in a git repository
- Re-running previous executions
- Investigating issues across multiple pipelines
- Working without a workspace folder open

---

## What you see

### Pipeline header

Shows the pipeline name, overall status badge, and elapsed time. The status dot animates while running. For completed pipelines, a **↻ Re-run** button appears to trigger a new execution with the same inputs. Click the header to open the execution in Harness.

### Stages and steps

Stages are listed in execution order. The active or failed stage is highlighted. Steps within a stage expand automatically during a run — click any step to expand or collapse it manually.

### Logs

Pipeline step logs are fetched in the background for all steps. The most relevant step is auto-expanded:
- If the pipeline failed: the first failed step
- Otherwise: the last step that ran

Click any step to view its logs inline. Logs are color-coded (errors in red, warnings in yellow).

### Failure banner

When a pipeline fails, a red banner appears below the stages with the error message from Harness.

### Policy Evaluations

A compact row shows the count of passed, warning, and errored policy evaluations. Hover over it to see a tooltip with each policy name and its deny message.

Click **↗** to open the full policy evaluation page in Harness.

### Module summary cards (when available)

| Module | What it shows |
|--------|--------------|
| **CI** | Build steps, logs and status |
| **CD** | Deployment status per environment |


### Future Ideas

| Module | What it shows |
|--------|--------------|
| **STO** | Security scan findings — new critical, high, medium counts |
| **TI** | Test Intelligence — passed, failed, flaky test counts, time saved |
| **SSCA** | Supply chain — number of flagged components in your diff |

### Approval gates

When a pipeline is waiting for a manual approval, a card appears inline below the approval stage showing:
- Which user groups or individuals need to approve
- Minimum approval count required
- **✓ Approve** and **✕ Reject** buttons

The buttons call the Harness Approval API using your PAT. If your user is not in the approver group, the API will return an error.

---

## Commands

| Command | What it does |
|---------|-------------|
| `Harness: Configure API Key` | Set or update your PAT, Account ID, org, and project (global) |
| `Harness: Select Org & Project` | Change your global org and project settings |
| `Harness: Switch Project (This Workspace)` | Override org/project for the current workspace only |
| `Harness: Refresh Pipeline Status` | Force a fresh poll immediately |
| `Harness: Clear API Key` | Remove stored credentials |
| `Harness: Export Last Execution to JSON` | Export currently viewed execution data for debugging |
| `Harness: Show Debug Output` | Show debug logs of all pipeline execution fetches |

---

## Limitations

- **Pipeline re-run button** — UI is implemented but currently non-functional due to Harness API endpoint research in progress
- **Approval permissions** — Approve/Reject buttons are permission-checked against user groups; if you're not an approver, buttons are disabled with an informational message
- **Harness AIDA Root Cause Analysis** — the AI analysis card is not yet functional (endpoint under investigation)
- **AI Integration requires Claude Code** — The AI chat feature requires Claude Code CLI or Extension to be installed separately
