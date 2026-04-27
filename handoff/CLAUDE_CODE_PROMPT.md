# Prompt for Claude Code — Implement the Harness AI bar UI

## ⚠️ Scope — read this first

**You are ONLY implementing the AI bar + MCP setup + detection UI as
specified in the original `PROMPT — Harness AI Integration` document.**

**Do NOT change anything else.** Specifically, do not touch:

- `ViewStateManager`, FME client, log provider, polling
- Any existing message handlers (only ADD the new ones listed)
- The visual design of the rest of the webview (header, tabs, stages,
  logs, pipeline card, history list, etc.) — leave them byte-for-byte
  untouched unless `vscode-bar-experience = 'enhanced'` is active
- Existing MCP config entries for any tool — only ADD `harness`, never
  overwrite other servers
- Secret storage, activation timing, or any non-AI code paths

If a change you're about to make isn't directly required by this
prompt, **stop and don't make it**. Read `CLAUDE.md` fully before you
write code.

---

## What to build

Follow the original spec (sections 1–8) exactly. The **UI portion** is
designed in `AI Integration.html` in this project — open it and use
the artboards as pixel reference. Keys:

### Files to create (AI only)
- `src/ai/detector.ts`
- `src/ai/mcpConfigurer.ts`
- `src/ai/promptBuilder.ts`
- `src/ai/launcher.ts`
- `src/webview/ai-bar.css`   ← split out, don't pollute existing CSS
- `src/webview/ai-bar.ts`    ← all AI-bar DOM + message handlers

### Files to modify (minimum diff)
- `extension.ts` — add:
  - non-blocking `detectAITools()` call in `activate()`
  - the 3 new message handlers (`AI_SEND_MESSAGE`, `AI_CONFIGURE_MCP`,
    `AI_SWITCH_TOOL`) exactly as specified
  - nothing else
- `src/webview/webview.html` — replace the existing inert AI bar block
  with the new markup. Do not restyle neighbouring sections.

---

## UI reference — artboards

The design lives in two forms in this handoff:

- **`AI Integration.html`** — interactive pan/zoom canvas. Open this in a
  browser to inspect real DOM, copy class names, hover states, etc.
- **`handoff/Print Sheet.html`** — flat 2-column layout covering the
  same artboards. Easier to scroll and reference alongside code.
- **`handoff/screens/*.png`** — baked screenshots of the print sheet
  for quick pixel reference without opening anything.

The canvas has four sections. Build the code to match the artboards.

### Atom: AI bar
```
┌─────────────────────────────────────────────────┐
│ [● Tool ▾]  Ask about this pipeline…       [ ↑ ]│
│ ● MCP ready · Claude Code (CLI)                 │
└─────────────────────────────────────────────────┘
```

Two rows:
1. Badge + input + send (28px tall, pill input, circular send)
2. Status strip: dot + label + optional link/button

### State machine (one component, 6 visual states)

| state          | badge                 | input                          | status dot | status text                              |
|----------------|-----------------------|--------------------------------|------------|------------------------------------------|
| `detecting`    | spinner (no badge)    | disabled, "Detecting AI tools…"| pulse      | "Detecting AI tools…"                    |
| `none`         | ⚠ "No AI tool"        | disabled                       | red        | "No AI tool found" + "Install Claude Code ↗" |
| `unconfigured` | tool badge, warn tint | disabled, MCP-warn placeholder | amber      | "MCP not configured · <tool>" + `[Configure MCP ›]` |
| `ready`        | tool badge            | enabled, "Ask about this pipeline…" | green | "MCP ready · <tool> (<sub>)"           |
| `sending`      | tool badge            | disabled, echoes question      | pulse      | "Querying <tool>…"                       |
| `error`        | tool badge            | enabled                        | red        | "Request failed" + `[Retry]`             |

### Overlays (mounted above the bar row)
- **MCP setup card** — triggered by clicking `Configure MCP ›` or
  hitting send in `unconfigured`. Inline, not a modal. Shows:
  - tool glyph + title ("Configure Harness MCP")
  - subtitle ("Lets <tool> fetch pipeline data, logs & executions.")
  - meta rows: "Writes to: `~/.claude.json`" (tool-specific path),
    "Auth: Uses your stored Harness PAT"
  - `[Configure automatically]` primary + `[Not now]` ghost
  - Busy state: button becomes "Configuring…" with spinner
- **Configured done card** — replaces setup card on success for ~5s.
  Green check + "Harness MCP configured for <tool>. Restart it to activate."
- **CLI response panel** — `max-height: 380px`, shown only for
  `claudecode-cli` responses:
  - Header: tool glyph + name + metadata ("4 MCP calls · 8.2s")
  - Body: markdown-lite (bold, `<code>`, `<ul>`, `<pre>`)
  - **Tool-call trace**: little chips like `⚒ harness_get · execution_log`
    pulled from the CLI's `--output-format json` structured output
  - Footer chips: "Open in Claude Code ↗", "Copy answer", "Re-run"
- **Launched-in-external confirm** — for `claudecode-ext` / `cursor`,
  a single-row confirm with a 3s dismiss timer:
  "Opened in <tool>. Continue the conversation there."
- **Clipboard fallback** — same shape, for Windsurf:
  "Prompt copied to clipboard. Paste it in Windsurf Cascade to investigate."

### Tool picker (multi-tool only)
Popover above the badge. Show every detected tool with:
- glyph + name + sub ("CLI" / "Extension")
- MCP readiness: green "MCP ready" or amber "MCP not configured"
- checkmark on the active one
- footer: "Priority · CLI › Ext › Cursor › Windsurf"

Only render the `▾` on the badge when `detection.tools.length > 1`.

---

## Icons — use native tool marks

Swap the placeholder glyphs in `ai-integration.jsx` for the real ones:

- **Claude Code (CLI + Extension)** — use Anthropic's official Claude
  sparkle/star mark. Pull from:
  - `node_modules/@anthropic-ai/claude-code/assets/icon.svg` if the CLI
    is a dependency, **or**
  - the Claude Code VS Code extension's `images/icon.png` (read from
    `~/.vscode/extensions/anthropic.claude-code-*/images/`), **or**
  - bundle the SVG the user drops into `src/webview/assets/claude.svg`
  - Do not redraw or approximate the mark yourself — ship the exact SVG
    as shipped by Anthropic, or a plain text fallback "CC".
- **Cursor** — use the official Cursor mark from their brand kit.
  Bundle `src/webview/assets/cursor.svg`.
- **Windsurf** — use the official Codeium Windsurf mark.
  Bundle `src/webview/assets/windsurf.svg`.

In the JSX, each glyph is a small React component returning an
`<img src>` or inline SVG string. Keep them 13×13 to match the
existing `Ico.*` sizing. Apply `color: currentColor` via
`filter: brightness(0) invert(1)` for monochrome tinting, or let them
render in their native color on the badge — your call, but be consistent.

**Never modify or recolor the marks beyond what the brand guidelines
permit.** If you cannot get hold of an official mark, leave the
placeholder SVG currently in the design and log a TODO.

---

## CSS tokens

All styles live in `ai-bar.css`. Reuse existing tokens from `styles.css`:

```css
--bg-0 .. --bg-5, --line, --line-2
--fg-0 .. --fg-3
--accent, --accent-soft, --accent-ring, --accent-dim
--ok, --warn, --err  (and their -soft variants)
--r, --r-sm, --r-lg, --r-pill
--font-sans, --font-mono
```

Do not introduce new colors, fonts, or shadow scales. If a rule
doesn't already exist on the token list above, don't invent it.

Class-name prefix for everything new: `.aix-*` (so the grep-diff is
clean and a future refactor can delete it in one shot).

---

## Message protocol (already in the spec — reproduced for clarity)

Webview → extension:
```ts
{ type: 'AI_SEND_MESSAGE', question: string }
{ type: 'AI_CONFIGURE_MCP' }
{ type: 'AI_SWITCH_TOOL', toolId: string }
```

Extension → webview:
```ts
{ type: 'STATE_UPDATE', aiDetection: DetectionResult }
{ type: 'AI_RESPONSE', content: string, toolCalls?: { name: string }[], durationMs?: number }
{ type: 'AI_LAUNCHED', tool: string }
{ type: 'AI_SHOW_MCP_SETUP', tool: string }
{ type: 'AI_CONFIG_DONE', tool: string }
{ type: 'AI_ERROR', message: string }
```

`toolCalls` and `durationMs` power the response-panel header metadata
(see `AI Integration.html` → Section 2, artboard H).

---

## Acceptance checklist

- [ ] Detection runs non-blocking; activate() returns before it resolves
- [ ] All 6 bar states render identical to the artboards
- [ ] MCP setup card appears inline, not as a modal
- [ ] CLI response renders in place with tool-call chips
- [ ] Ext / Cursor launches show a 3s confirm, then collapse
- [ ] Windsurf copies prompt + shows clipboard confirm
- [ ] Tool picker only appears with ≥2 tools detected
- [ ] No existing CSS rule was edited
- [ ] No existing TS file was edited beyond the two listed above
- [ ] Feature flag `vscode-bar-experience = 'simple'` preserves the
      current visual weight (no dark theme changes from the redesign
      doc bleeding in)
- [ ] Invalid JSON in an existing MCP config → backed up to `.bak`
      before write
- [ ] Windows: `where claude` instead of `which`; Cursor URI errors
      caught and falls back to clipboard
- [ ] PAT is read only from VS Code `SecretStorage`, never written to
      any file other than the MCP server `env` block

---

## One more time: what NOT to touch

- ❌ Header, tabs, pipeline card, stage tree, logs, history, approval,
      policy strip, module rows, Pipelines catalog, VS Code frame
- ❌ Any colors/fonts/tokens in `styles.css`
- ❌ ViewStateManager, polling, FME client, log provider
- ❌ Existing command palette entries
- ❌ Existing MCP entries for any tool

If in doubt, don't change it. Ship the smallest possible diff.
