# History Toolbar — Option A · Claude Code Handoff

**What changes:** the Executions tab toolbar in the Harness VSCode extension gets
a tidier, single-row pill layout. The `Current commit` checkbox becomes a filter
pill; the sort button becomes a compact icon that opens a popover menu with
four sort modes (Most recent / Oldest first / Duration / Status).

**What does NOT change:** every piece of business logic — state manager,
polling, fetch calls, FME, MCP, Pipelines tab, sort ordering, filter contract.

## What's in this folder

| File | Purpose |
|------|---------|
| `CLAUDE_CODE_PROMPT.md` | **Main artifact.** Paste this into Claude Code. Contains the full spec, code to insert, guardrails, and an acceptance checklist. |
| `Sort Menu — Option A.html` | Interactive reference — icons, open-menu states, trigger variants. Open in a browser. |
| `History Toolbar Options.html` | The broader exploration (Options A/B/C). Option A is the one we're shipping; B & C are for context. |
| `screens/01-sort-icons.png` | The four sort-mode glyphs. |
| `screens/02-sort-menu-open.png` | Popover menu, selected + unselected states. |
| `screens/03-trigger-states.png` | Default / modified / open / labeled trigger states. |
| `screens/04-toolbar-intro.png` | Toolbar spec overview. |
| `screens/05-option-a.png` | Option A at 240 / 320 / 440 px widths. |

## How to use

1. Open this folder in your editor.
2. Open `CLAUDE_CODE_PROMPT.md` and paste its contents into Claude Code at
   the root of the `harness-vscode-plugin` repo.
3. Claude Code will edit `src/ui/webview/main.ts` and `src/ui/webview/styles.css`.
4. Verify against the acceptance checklist at the bottom of the prompt.
5. Open `Sort Menu — Option A.html` side-by-side while reviewing.

## Key design decisions

- **Icon-only trigger** keeps the narrow-panel layout from wrapping. An accent
  dot signals non-default sort so the trigger still communicates state.
- **Popover menu** (not a cycle-through button) so all four modes are visible
  at once. Selection is one click, not four.
- **Direction hints** (`newest ↓`, `failed ↑`) live in the menu rows — no
  separate direction toggle needed.
- **Current commit becomes a pill** in the same vocabulary as status filters;
  the two-row toolbar collapses to one wrap-friendly row.
