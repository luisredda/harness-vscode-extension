# Prompt for Claude Code — Multi-Product Hub Menu

Paste this into Claude Code alongside the `handoff/` folder.

---

You are implementing **one focused change** to the Harness VS Code extension: turning the header "3-dots" menu into a **multi-product hub**, and wiring its Account row to the existing native org/project switcher.

**Do not redesign anything else.** Ignore the broader prototype surfaces in `source/Pipeline Extension.html` (tab bodies, log viewer, pipelines catalog layouts, run states, themes, etc.) — they are there for context only. Touch only what this prompt describes.

## Scope

Exactly three things:

1. **Header 3-dots button** opens a slide-out "App menu" (the multi-product hub).
2. **App menu contents:**
   - A "Products" section with **one** item: **Pipelines** (icon = the three-node glyph already used on the Pipelines tab in the View Toggle, see `source/panel.jsx` → `PipelinesGlyph` / the SVG inside `ViewToggle`).
   - An "Account" section with **one** clickable row showing the current `org / project`. Clicking it fires the existing `harness.switchProject` VS Code command.
   - **Remove** Test Intelligence, Feature Flags, Builds, Deployments, and Security entries. They are not products in this scope.
3. **Account row click handler:** post `{ type: 'command', command: 'harness.switchProject' }` to the extension host — same contract the existing `data-action="selectProject"` button in `project-bar` uses today (see `src/ui/webview/main.ts` around the `q('[data-action="selectProject"]', …)` handler, and `src/extension.ts` → `harness.switchProject` → `runWorkspaceOverride`). Do **not** build an in-webview org/project picker; reuse the native QuickPick flow.

That's it. Everything else — live log tailing, Build/Deploy/Security tab bodies, pipelines catalog layouts, themes — stays exactly as it is in the current extension.

## Files to touch (expected)

- `src/ui/webview/main.ts` — replace the existing menu rendering (or the existing `project-bar` if the hub absorbs it) with the new hub markup; add the click handler that posts `harness.switchProject`.
- `src/ui/webview/styles.css` — styles for `.app-menu`, `.app-menu-item`, `.app-menu-section`, and the account row. Mirror the prototype tokens where they don't already exist.
- Nothing in `src/extension.ts` or `src/auth/onboarding.ts` should change — `harness.switchProject` and `runWorkspaceOverride` already do the right thing.

## Design reference

- `source/panel.jsx` → `AppMenu` component: exact structure, icon, copy, class names.
- `source/styles.css` → search for `.app-menu`, `.app-menu-item`, `.app-menu-section`, `.app-menu-chev`, `.account-item`, `.acct-org`, `.acct-sep`, `.acct-proj` — these are the styles to port (remap token values to the extension's existing tokens where they differ).
- `source/Pipeline Extension.html` → "App menu — multi-product hub" section shows the intended visual.
- **Ignore** the `AccountPicker` / `.qp-*` styles in the prototype. That component is a *visual stand-in* for the native QuickPick and must not be rebuilt in the webview — the real extension already has the QuickPick flow wired through `harness.switchProject`.

## Copy

- Header in the drawer: "Pipeline" brand wordmark + close button.
- Section label: `Products` (uppercase, tracked).
- Pipelines row — label: `Pipelines`, sublabel: `Execution status & logs`.
- Section label: `Account` (uppercase, tracked).
- Account row — label: `{org} / {project}` (fall back to "Not connected" when unset), sublabel: `Change org & project` (or `Connect your Harness account` when unset).
- Chevron (`›`) on the right of the Account row.

## Acceptance

- Clicking the header's 3-dots opens the drawer.
- Drawer shows exactly one product (Pipelines) with the node-graph glyph.
- Account row shows the current org/project; clicking it opens the native VS Code QuickPick (two-step: Organization → Project) via the existing `harness.switchProject` command. No webview dialog.
- After the user picks in the QuickPick, the header breadcrumb and the Account row update via the existing `GIT_CONTEXT` message flow — no new plumbing needed.
- Esc / scrim click closes the drawer.
- No other surfaces in the extension change.

## Rules

- **Do not** add Feature Flags / Builds / Deployments / Security / Test Intel items as "coming soon" — just leave them out.
- **Do not** build an in-webview org/project picker. Use `harness.switchProject`.
- **Do not** touch the tab strip, log viewer, pipelines catalog, or any run-state rendering.
- If you discover the existing `project-bar` becomes redundant once the Account row is in the hub, ask before removing it.

When done, show a screenshot of the extension with the hub open against the "App menu — multi-product hub" artboard in `source/Pipeline Extension.html`.
