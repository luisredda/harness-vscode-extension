# Deep reference — component inventory

Companion to `README.md`. Read that first. This doc is a quick reference for the most-frequently-asked "what goes where" questions.

## Root layout

```
┌─────────────────────────────────────────┐ panel > 100% height, var(--bg-0)
│ Header (42px)                           │ var(--bg-1), border-bottom var(--line)
├─────────────────────────────────────────┤
│ TabStrip (32px)                         │ var(--bg-0), active tab 2px --accent
├─────────────────────────────────────────┤
│                                         │
│ Body (fills) — one of the views         │ scroll container
│                                         │
├─────────────────────────────────────────┤
│ Footer (28px)                           │ var(--bg-1), border-top var(--line)
└─────────────────────────────────────────┘
```

Panel width is 360px by design — it's what VS Code's sidebar settles to by default. All internal layouts must reflow below 300px without breaking.

## Status iconography

Every status icon is 14×14 SVG, 1.5px stroke, drawn inline. Use the same glyphs in the same colors throughout:

| State | Glyph | Class | Color |
|---|---|---|---|
| Running | rotating ring (animated) | `.st-run` | `--accent` |
| Passed | filled circle + check | `.st-ok` | `--ok` |
| Failed | filled circle + × | `.st-err` | `--err` |
| Warn | triangle + ! | `.st-warn` | `--warn` |
| Wait / queued | hollow clock | `.st-wait` | `--secondary` |
| Pending / skipped | dotted circle | `.st-pend` | `--fg-3` |

## StageRow anatomy

```
[status-icon] [stage-name              ] [duration] [▸ if expandable]
              [sub-meta · sub-meta        ]
```

- 40px tall unexpanded, 56px when showing sub-meta.
- Whole row is a button; hover = `--bg-2`.
- If the stage has sub-stages, chevron rotates 90° on expand.

## LogStream vs LogDetailView

- `LogStream` is the small inline log tail below the stage list on the `running` view — 240px tall, auto-scrolls, last 500 lines visible.
- `LogDetailView` is the full-panel terminal view — toolbar (search, level filter, wrap toggle, copy, download), then the log viewport which fills the rest. Line numbers left; mono; level-colored prefix.

## AppMenu structure

```
╭ Products ─────────────────────╮
│ ● Pipelines          (active) │
│ ○ Feature Flags   coming soon │
│ ○ Builds          coming soon │
│ ○ Deployments     coming soon │
│ ○ Security        coming soon │
│ ○ Test Intel      coming soon │
├───────────────────────────────┤
│ Docs                          │
│ Settings                      │
├───────────────────────────────┤
│ Account: acme / payments   ▸  │ ← opens QuickPick
├───────────────────────────────┤
│ Sign out                      │
╰───────────────────────────────╯
```

- 280px wide, anchored to the `⋯` button.
- Only Pipelines is clickable. Disabled rows show a "coming soon" pill on hover.
- Account row has a right chevron and the subtle current-context styling (`.acct-org` + `.acct-sep` + `.acct-proj`).

## QuickPickAccountSwitcher

Modeled on VS Code's native QuickPick. Two steps:

**Step 1 — Organization**
```
╭ [Organization] › Project ···························  1 / 2 ╮
│ [Filter organizations…                                    ]  │
├──────────────────────────────────────────────────────────────┤
│ 🏢  acme                acme-prod.pipelines.io     CURRENT  │
│ 🏢  acme-labs           labs.pipelines.io                   │
│ 🏢  personal            personal-free                       │
├──────────────────────────────────────────────────────────────┤
│ ↑↓ navigate  ↵ select  esc dismiss       harness.switchProject │
╰──────────────────────────────────────────────────────────────╯
```

**Step 2 — Project** (after picking org)
```
╭ Organization › [Project] ····························  2 / 2 ╮
│ acme │ [Filter projects…                                   ]  │
├──────────────────────────────────────────────────────────────┤
│ 📁  payments           5 pipelines  last run 2m ago  CURRENT │
│ 📁  checkout           3 pipelines  last run 1h ago          │
│ 📁  auth               8 pipelines  last run 4h ago          │
╰──────────────────────────────────────────────────────────────╯
```

- Step 1's breadcrumb: `[Organization]` active, `Project` dimmed.
- Step 2's breadcrumb: `Organization` shows the chosen org as a pill, `[Project]` active.
- Backspace on an empty step-2 filter → steps back to step 1.
- On final select → `postMessage({ type: 'switchProject', orgId, projectId })` and close.

## BuildTab body

Three cards stacked:
1. **Repo card** — repo name, branch chip, last commit hash + author + message (1-line truncate), commits-in-run count.
2. **Stages card** — standard StageList scoped to CI stages (checkout, install, lint, test, build, upload).
3. **Impact card** — Cache hit rate · Time saved · Artifacts produced, each as a big number + sparkline.

## DeployTab body

One row per service × environment (e.g. `payments-api` across `dev / stage / prod`). Each cell shows the deployed version + status. Awaiting-approval cells show a warning chip; clicking opens the approval flow.

## SecurityTab body

1. **Scan summary card** — total issues + Critical / High / Med / Low breakdown with colored pills.
2. **New this run** — list of new vulns (CVE, severity, component, path).
3. **Skipped-scan state** — replaces both when the upstream build failed: a simple info banner "Scan skipped · upstream build failed" with a link back to the failed run.

## PipelinesCatalog — layout specifics

- **Cards:** 2-column grid at panel width ≥ 340px, else 1-column. Card is 100% width × auto, 12px padding, `--bg-1`, hover raises to `--bg-2`.
- **Grouped:** folder header = 28px, uppercase mono label, small count on the right. Clicking header collapses the group. Pinned pipelines pinned to the top outside any folder.
- **Expandable:** one row per pipeline, 32px tall, click expands to show last 3 runs as mini-rows (24px each). Only one pipeline expanded at a time.

---

See `source/panel.jsx` for the definitive props and state shapes. Everything else in this doc is derived from there.
