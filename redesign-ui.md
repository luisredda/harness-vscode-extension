# Claude Code Prompt — Webview UI Redesign (Dark Theme + Harness Brand + Feature Flag)

Paste this entire prompt as your first message in Claude Code.

---

```
Read CLAUDE.md fully before writing any code.

I want to completely redesign the visual style of the Harness VS Code extension 
webview. The current implementation has a basic light theme ("simple"). I want to 
add a new polished dark theme ("enhanced") that matches the Harness brand identity.

The new design is controlled by a Harness FME feature flag called
`vscode-bar-experience` with two treatments:
  - "simple"   → current light theme (control — DO NOT change this)
  - "enhanced" → new Harness dark theme (implement this)

Both experiences must coexist in the same webview HTML/CSS file.
Switching between them is done by toggling a CSS class on the body element.
The design also follows the IDE dark/light mode automatically (see Part C).

DO NOT change any TypeScript logic, API calls, polling, message handlers, 
ViewStateManager, FME client, log provider, or any existing .ts files.
ONLY change the webview HTML, CSS, and inline JS rendering logic.

---

## Design system

### Color palette (CSS variables — define in :root)

```css
:root {
  --bg-base:        #131313;
  --bg-surface:     #1C1B1B;
  --bg-elevated:    #201F1F;
  --bg-card:        #252525;
  --bg-high:        #2A2A2A;
  --bg-highest:     #353534;

  --primary:        #85CFFF;
  --primary-dim:    #2BB1F2;
  --primary-glow:   rgba(133, 207, 255, 0.08);

  --secondary:      #E2B6FF;
  --secondary-dim:  #8200CA;

  --on-surface:     #E5E2E1;
  --on-surface-var: #BDC8D1;
  --outline:        #88929B;
  --outline-var:    #3E4850;

  --success:        #3FB950;
  --success-bg:     rgba(63, 185, 80, 0.08);
  --warning:        #E3B341;
  --warning-bg:     rgba(227, 179, 65, 0.08);
  --error:          #F85149;
  --error-bg:       rgba(248, 81, 73, 0.08);
  --error-container:#93000A;
  --running:        #85CFFF;
  --running-bg:     rgba(133, 207, 255, 0.08);

  --font-mono:      'Geist Mono', 'Fira Code', 'Consolas', monospace;
  --font-sans:      'Inter', -apple-system, sans-serif;
  --radius:         4px;
  --radius-sm:      2px;
  --radius-lg:      6px;
}
```

### Typography

All labels, nav items, and section headers: uppercase, letter-spacing: 0.08em,
font-size: 10px, font-weight: 600.
Pipeline name and stage names: font-size: 13px, font-weight: 500.
Step names: font-size: 11px, font-weight: 400.
Log content: font-family: var(--font-mono), font-size: 11px.
Mono identifiers (run IDs, SHAs): font-family: var(--font-mono), 
color: var(--primary), opacity: 0.7.

---

## Harness logo SVG

Use this exact SVG inline as the logo (replace any text "Harness" with this):

```html
<svg width="82" height="16" viewBox="0 0 82 16" fill="none" 
     xmlns="http://www.w3.org/2000/svg" aria-label="Harness">
  <!-- Harness logomark (the 4-square grid icon) -->
  <rect x="0" y="0" width="7" height="7" rx="1.5" fill="#85CFFF"/>
  <rect x="9" y="0" width="7" height="7" rx="1.5" fill="#85CFFF" opacity="0.7"/>
  <rect x="0" y="9" width="7" height="7" rx="1.5" fill="#85CFFF" opacity="0.7"/>
  <rect x="9" y="9" width="7" height="7" rx="1.5" fill="#85CFFF"/>
  <!-- Harness wordmark -->
  <path d="M24 2h2v5h5V2h2v12h-2V9h-5v5h-2V2z" fill="#E5E2E1"/>
  <path d="M36.5 14l4-12h2l4 12h-2.1l-.9-2.8h-4l-.9 2.8H36.5zm3.6-4.6h2.8L41.5 5l-1.4 4.4z" fill="#E5E2E1"/>
  <path d="M49 14V2h4.5c1 0 1.9.3 2.5.9.6.6.9 1.4.9 2.4 0 .8-.2 1.5-.6 2-.4.5-1 .9-1.7 1l2.7 5.7h-2.3L52.5 9H51v5H49zm2-6.8h2.3c.5 0 .9-.15 1.2-.45.3-.3.45-.7.45-1.2s-.15-.9-.45-1.2C54.2 4.05 53.8 3.9 53.3 3.9H51v3.3z" fill="#E5E2E1"/>
  <path d="M60 14V2h4.5c1 0 1.9.3 2.5.9.6.6.9 1.4.9 2.4 0 .8-.2 1.5-.6 2-.4.5-1 .9-1.7 1l2.7 5.7h-2.3L63.5 9H62v5H60zm2-6.8h2.3c.5 0 .9-.15 1.2-.45.3-.3.45-.7.45-1.2s-.15-.9-.45-1.2C65.2 4.05 64.8 3.9 64.3 3.9H62v3.3z" fill="#E5E2E1"/>
  <path d="M70 11.5l1.8-.7c.15.6.45 1.05.9 1.35.45.3 1 .45 1.65.45.6 0 1.05-.12 1.35-.37.3-.25.45-.57.45-.97 0-.55-.5-1-1.5-1.35l-1.2-.4c-.85-.28-1.5-.67-1.95-1.17-.45-.5-.67-1.1-.67-1.8 0-.9.32-1.62.97-2.17.65-.55 1.5-.83 2.55-.83.85 0 1.57.18 2.18.55.6.37 1.02.88 1.27 1.55l-1.75.72c-.15-.42-.4-.73-.75-.93-.35-.2-.75-.3-1.2-.3-.5 0-.9.1-1.17.32-.28.22-.42.52-.42.9 0 .5.47.92 1.42 1.25l1.2.42c.95.32 1.65.73 2.1 1.23.45.5.67 1.1.67 1.8 0 .98-.35 1.75-1.05 2.33-.7.58-1.65.87-2.85.87-.98 0-1.82-.22-2.52-.67-.7-.45-1.17-1.08-1.42-1.88z" fill="#E5E2E1"/>
  <path d="M80 11.5l1.8-.7c.15.6.42 1.05.82 1.35.4.3.9.45 1.5.45.55 0 .98-.12 1.28-.37.3-.25.45-.57.45-.97 0-.55-.48-1-1.45-1.35l-1.15-.4c-.82-.28-1.45-.67-1.88-1.17C81.95 7.8 81.73 7.2 81.73 6.5c0-.9.3-1.62.92-2.17.62-.55 1.45-.83 2.47-.83.82 0 1.52.18 2.1.55.57.37.97.88 1.2 1.55l-1.7.72c-.15-.42-.38-.73-.72-.93-.35-.2-.72-.3-1.15-.3-.47 0-.85.1-1.12.32-.28.22-.42.52-.42.9 0 .5.45.92 1.37 1.25l1.15.42c.92.32 1.6.73 2.02 1.23.43.5.65 1.1.65 1.8 0 .98-.33 1.75-1 2.33-.67.58-1.58.87-2.75.87-.95 0-1.75-.22-2.42-.67-.67-.45-1.13-1.08-1.37-1.88z" fill="#E5E2E1"/>
</svg>
```

NOTE: The wordmark SVG paths above are approximate shapes for illustration —
use this simplified version that renders correctly instead:

```html
<!-- Simplified logo: icon + text wordmark -->
<div class="harness-logo">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="0" y="0" width="7" height="7" rx="1.5" fill="#85CFFF"/>
    <rect x="9" y="0" width="7" height="7" rx="1.5" fill="#85CFFF" opacity="0.65"/>
    <rect x="0" y="9" width="7" height="7" rx="1.5" fill="#85CFFF" opacity="0.65"/>
    <rect x="9" y="9" width="7" height="7" rx="1.5" fill="#85CFFF"/>
  </svg>
  <span class="harness-wordmark">Harness</span>
</div>
```

```css
.harness-logo {
  display: flex;
  align-items: center;
  gap: 7px;
}
.harness-wordmark {
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--primary);
}
```

---

## Layout structure

```
┌─────────────────────────────────────────────┐
│  HEADER (40px)                              │
│  [logo] [account/branch info]  [actions]   │
├─────────────────────────────────────────────┤
│  VIEW TOGGLE (32px)                         │
│  [● This commit]  [⊡ All executions]  [📌] │
├─────────────────────────────────────────────┤
│                                             │
│  CONTENT AREA (flex: 1, scrollable)         │
│  — pipeline card                            │
│  — stage/step tree                          │
│  — error banner                             │
│  — module strips                            │
│                                             │
├─────────────────────────────────────────────┤
│  AI BAR (44px)                              │
│  [A icon] [input…] [Claude Code badge]      │
└─────────────────────────────────────────────┘
```

---

## Header

```css
.header {
  height: 40px;
  background: var(--bg-base);
  border-bottom: 1px solid var(--outline-var);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 10px;
  flex-shrink: 0;
}
.header-account {
  font-size: 10px;
  color: var(--outline);
  font-family: var(--font-mono);
  margin-left: 4px;
}
.header-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}
.header-btn {
  width: 26px;
  height: 26px;
  border-radius: var(--radius);
  border: none;
  background: transparent;
  color: var(--on-surface-var);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background .15s;
}
.header-btn:hover { background: var(--bg-high); }
```

---

## View toggle

Same position and behavior as existing toggle, restyled:

```css
.view-toggle {
  display: flex;
  align-items: center;
  height: 32px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--outline-var);
  flex-shrink: 0;
}
.vt-btn {
  flex: 1;
  height: 100%;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--outline);
  font-size: 10px;
  font-family: var(--font-sans);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .07em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: color .15s, border-color .15s;
}
.vt-btn:hover { color: var(--on-surface-var); }
.vt-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  background: var(--primary-glow);
}
.vt-live-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--primary);
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.2} }
.vt-pin {
  padding: 0 8px;
  height: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--outline-var);
  font-size: 11px;
  display: flex;
  align-items: center;
  transition: color .15s;
  flex-shrink: 0;
}
.vt-pin:hover { color: var(--on-surface-var); }
.vt-pin.pinned { color: var(--primary); }
```

---

## Pipeline card (execution header)

```css
.pip-card {
  padding: 10px 12px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--outline-var);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.pip-status-bar {
  width: 3px;
  height: 32px;
  border-radius: 2px;
  flex-shrink: 0;
}
.pip-status-bar.ok      { background: var(--success); }
.pip-status-bar.failed  { background: var(--error); }
.pip-status-bar.running { 
  background: var(--primary);
  animation: pulse-bar 1.4s infinite;
}
@keyframes pulse-bar { 0%,100%{opacity:1}50%{opacity:.4} }
.pip-status-bar.pending { background: var(--outline-var); }

.pip-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--on-surface);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pip-badge {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  padding: 2px 7px;
  border-radius: 99px;
  flex-shrink: 0;
}
.pip-badge.ok      { background: var(--success-bg); color: var(--success); 
                     border: 1px solid rgba(63,185,80,.25); }
.pip-badge.failed  { background: var(--error-bg);   color: var(--error);
                     border: 1px solid rgba(248,81,73,.25); }
.pip-badge.running { background: var(--running-bg); color: var(--running);
                     border: 1px solid rgba(133,207,255,.25); }
.pip-duration {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--outline);
}
.pip-ext-link {
  color: var(--outline);
  font-size: 12px;
  cursor: pointer;
  text-decoration: none;
  transition: color .15s;
}
.pip-ext-link:hover { color: var(--primary); }
```

---

## Git context bar

```css
.git-bar {
  padding: 5px 12px;
  background: rgba(133, 207, 255, 0.04);
  border-bottom: 1px solid var(--outline-var);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: var(--outline);
  flex-shrink: 0;
}
.git-branch { color: var(--on-surface); font-weight: 500; }
.git-sha    { color: var(--primary); font-family: var(--font-mono); cursor: pointer; }
.git-sha:hover { text-decoration: underline; }
.git-time   { color: var(--outline-var); }
```

---

## Stage / step tree

```css
.tree-body { flex: 1; overflow-y: auto; padding: 6px 0; }
.tree-body::-webkit-scrollbar { width: 3px; }
.tree-body::-webkit-scrollbar-thumb { background: var(--bg-high); border-radius: 2px; }

/* Stage row */
.stage-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background .1s;
  position: relative;
}
.stage-row:hover { background: var(--bg-elevated); }
.stage-row.active {
  background: var(--bg-elevated);
  border-left: 2px solid var(--primary);
}

.stage-bar {
  width: 3px;
  height: 22px;
  border-radius: 2px;
  flex-shrink: 0;
}
.stage-bar.ok      { background: var(--success); }
.stage-bar.failed  { background: var(--error); }
.stage-bar.running { background: var(--primary); animation: pulse-bar 1.4s infinite; }
.stage-bar.pending { background: var(--bg-highest); }
.stage-bar.warn    { background: var(--warning); }

.stage-icon { font-size: 16px; flex-shrink: 0; }
.stage-icon.ok      { color: var(--success); }
.stage-icon.failed  { color: var(--error); }
.stage-icon.running { color: var(--primary); animation: spin 1s linear infinite; }
.stage-icon.pending { color: var(--outline-var); }
.stage-icon.warn    { color: var(--warning); }
@keyframes spin { to { transform: rotate(360deg); } }

.stage-name { flex: 1; font-size: 12px; color: var(--on-surface); font-weight: 500; }
.stage-name.failed { color: var(--error); }
.stage-name.running { color: var(--primary); font-weight: 600; }
.stage-duration { font-size: 10px; font-family: var(--font-mono); color: var(--outline); }
.stage-status-text { font-size: 10px; color: var(--primary); font-style: italic; }

/* Step rows (indented) */
.steps-container {
  margin-left: 22px;
  border-left: 1px solid var(--outline-var);
  padding-left: 12px;
}
.step-row {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background .1s;
}
.step-row:hover { background: var(--bg-high); }
.step-row.active {
  background: rgba(133, 207, 255, 0.08);
  border-left: 2px solid var(--primary);
  margin-left: -2px;
}

.step-icon { font-size: 13px; flex-shrink: 0; }
.step-icon.ok      { color: var(--success); }
.step-icon.failed  { color: var(--error); }
.step-icon.running { color: var(--primary); animation: spin 1s linear infinite; }
.step-icon.pending { color: var(--outline-var); }
.step-icon.warn    { color: var(--warning); }

.step-name { font-size: 11px; color: var(--on-surface-var); flex: 1; }
.step-name.failed { color: var(--error); }
.step-name.pending { color: var(--outline); font-style: italic; }

.step-badge {
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 1px 5px;
  border-radius: 3px;
}
.step-badge.retrying {
  background: var(--error-bg);
  color: var(--error);
  border: 1px solid rgba(248,81,73,.2);
}
.step-ext-ic {
  font-size: 9px;
  color: var(--primary);
  opacity: .5;
  transition: opacity .15s;
}
.step-row:hover .step-ext-ic { opacity: 1; }
```

---

## Section headers (modules, policy, etc.)

```css
.section-header {
  padding: 8px 12px 3px;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--outline-var);
  font-weight: 600;
}
```

---

## Policy evaluations row

```css
.policy-row {
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 11px;
  border-bottom: 1px solid var(--outline-var);
  transition: background .1s;
}
.policy-row:hover { background: var(--bg-elevated); }
.policy-label { color: var(--on-surface-var); flex: 1; }
.policy-val.warn    { color: var(--warning); font-weight: 500; }
.policy-val.ok      { color: var(--success); font-weight: 500; }
.policy-val.blocked { color: var(--error);   font-weight: 500; }
```

---

## Module strip (CI, CD, STO, TI, CCM, FF)

```css
.mod-row {
  padding: 4px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  border-bottom: 1px solid rgba(62,72,80,.3);
  cursor: pointer;
  transition: background .1s;
}
.mod-row:hover { background: var(--bg-elevated); }
.mod-tag {
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--outline-var);
  min-width: 28px;
  letter-spacing: .05em;
}
.mod-val { flex: 1; }
.mod-val.ok   { color: var(--success); }
.mod-val.warn { color: var(--warning); }
.mod-val.err  { color: var(--error); }
.mod-val.info { color: var(--primary); }
.mod-val.muted { color: var(--outline); }
```

---

## Error banner

```css
.error-banner {
  margin: 6px 10px;
  padding: 8px 10px;
  background: rgba(147, 0, 10, 0.2);
  border-left: 2px solid var(--error);
  border-radius: 0 var(--radius) var(--radius) 0;
  font-size: 11px;
  color: var(--error);
  line-height: 1.5;
}
.error-banner strong { color: #FF8A80; }
```

---

## Log snippet (inline — existing behavior when FF = 'inline')

```css
.log-snippet {
  background: var(--bg-base);
  border-top: 1px solid var(--outline-var);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.log-snippet-hdr {
  padding: 5px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--outline-var);
  flex-shrink: 0;
}
.log-snippet-title {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--outline-var);
  font-weight: 700;
}
.log-snippet-expand {
  font-size: 12px;
  color: var(--outline);
  cursor: pointer;
  transition: color .15s;
}
.log-snippet-expand:hover { color: var(--primary); }
.log-snippet-body {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.7;
  overflow-y: auto;
  padding: 6px 10px;
  color: var(--on-surface-var);
  max-height: 140px;
}
.log-snippet-body::-webkit-scrollbar { width: 3px; }
.log-snippet-body::-webkit-scrollbar-thumb { background: var(--bg-high); }
.log-ts  { color: var(--outline-var); margin-right: 6px; }
.log-lvl-info    { color: var(--primary); }
.log-lvl-error   { color: var(--error); }
.log-lvl-warn    { color: var(--warning); }
.log-lvl-debug   { color: var(--outline-var); }
.log-lvl-success { color: var(--success); }
```

---

## AI bar

```css
.ai-bar {
  padding: 7px 10px;
  background: var(--bg-surface);
  border-top: 1px solid var(--outline-var);
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}
.ai-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--bg-high);
  border: 1px solid rgba(133,207,255,.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ai-avatar svg { width: 12px; height: 12px; }
.ai-input {
  flex: 1;
  background: var(--bg-high);
  border: 1px solid var(--outline-var);
  border-radius: 10px;
  padding: 5px 10px;
  font-size: 11px;
  font-family: var(--font-sans);
  color: var(--on-surface);
  outline: none;
  transition: border-color .15s;
}
.ai-input:focus { border-color: var(--primary); }
.ai-input::placeholder { color: var(--outline-var); }
.ai-badge {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 99px;
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  white-space: nowrap;
}
.ai-badge.cc {
  background: rgba(226,182,255,.08);
  color: var(--secondary);
  border: 1px solid rgba(226,182,255,.2);
}
.ai-badge.browser {
  background: var(--bg-high);
  color: var(--outline);
  border: 1px solid var(--outline-var);
}
.ai-badge-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
}
```

---

## Execution history list items

```css
.exec-item {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(62,72,80,.3);
  display: flex;
  align-items: flex-start;
  gap: 9px;
  cursor: pointer;
  transition: background .1s;
}
.exec-item:hover { background: var(--bg-elevated); }
.exec-item.current-commit {
  background: rgba(133,207,255,.04);
  border-left: 2px solid var(--primary);
}
.ei-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}
.ei-dot.ok      { background: var(--success); }
.ei-dot.failed  { background: var(--error); }
.ei-dot.running { background: var(--primary); animation: pulse 1.4s infinite; }
.ei-dot.aborted { background: var(--outline); }

.ei-name { font-size: 11px; font-weight: 500; color: var(--on-surface); }
.ei-badge {
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 1px 5px;
  border-radius: 3px;
}
.ei-badge.ok      { background: var(--success-bg); color: var(--success); }
.ei-badge.failed  { background: var(--error-bg);   color: var(--error); }
.ei-badge.running { background: var(--running-bg); color: var(--running); }
.ei-meta { font-size: 10px; color: var(--outline); font-family: var(--font-mono); }
.ei-sha  { color: var(--primary); }
.ei-branch { color: var(--secondary); opacity: .8; font-family: var(--font-sans); }
.ei-cur-tag {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 99px;
  background: rgba(133,207,255,.1);
  color: var(--primary);
  border: 1px solid rgba(133,207,255,.2);
}
.ei-tag {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
}
.et-ci  { background: rgba(133,207,255,.1); color: var(--primary); }
.et-cd  { background: var(--success-bg); color: var(--success); }
.et-sto { background: var(--error-bg); color: var(--error); }
.et-ti  { background: var(--warning-bg); color: var(--warning); }
.et-aida { background: rgba(226,182,255,.1); color: var(--secondary); }
```

---

## Pagination

```css
.pag-bar {
  padding: 6px 10px;
  border-top: 1px solid var(--outline-var);
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-surface);
  flex-shrink: 0;
}
.pg-btn {
  padding: 3px 8px;
  font-size: 10px;
  border: 1px solid var(--outline-var);
  border-radius: var(--radius);
  background: transparent;
  color: var(--outline);
  cursor: pointer;
  font-family: var(--font-sans);
}
.pg-btn:hover { border-color: var(--outline); color: var(--on-surface-var); }
.pg-btn:disabled { opacity: .3; cursor: default; }
.pg-num { padding: 3px 7px; font-size: 10px; border-radius: var(--radius); cursor: pointer; color: var(--outline); }
.pg-num:hover { background: var(--bg-elevated); }
.pg-num.on { background: rgba(133,207,255,.12); color: var(--primary); border: 1px solid rgba(133,207,255,.25); }
.pg-info { margin-left: auto; font-size: 10px; color: var(--outline-var); font-family: var(--font-mono); }
```

---

## Back bar (detail view)

```css
.back-bar {
  padding: 5px 10px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--outline-var);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.back-btn {
  background: transparent;
  border: none;
  color: var(--primary);
  cursor: pointer;
  font-size: 11px;
  font-family: var(--font-sans);
  padding: 2px 6px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  gap: 3px;
  transition: background .15s;
}
.back-btn:hover { background: var(--primary-glow); }
.bc-sep  { color: var(--outline-var); }
.bc-name { color: var(--on-surface-var); font-size: 11px; }
```

---

## Adjacent navigation (prev/next in detail)

```css
.adj-bar {
  padding: 5px 10px;
  border-top: 1px solid var(--outline-var);
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--bg-surface);
  flex-shrink: 0;
}
.adj-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border: 1px solid var(--outline-var);
  border-radius: var(--radius);
  background: transparent;
  color: var(--outline);
  cursor: pointer;
  font-size: 10px;
  font-family: var(--font-sans);
  transition: border-color .15s, color .15s;
  min-width: 0;
}
.adj-btn:hover { border-color: var(--outline); color: var(--on-surface-var); }
.adj-btn.disabled { opacity: .3; cursor: default; pointer-events: none; }
.adj-lbl { font-size: 9px; color: var(--outline-var); display: block; margin-bottom: 1px; }
.adj-name { font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.adj-name.ok { color: var(--success); }
.adj-name.failed { color: var(--error); }
.adj-mid { font-size: 10px; color: var(--outline-var); flex-shrink: 0; font-family: var(--font-mono); }
```

---

## Pin footer

```css
.pin-footer {
  padding: 4px 12px;
  font-size: 10px;
  color: var(--outline);
  border-top: 1px solid var(--outline-var);
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--bg-surface);
  flex-shrink: 0;
}
.pin-footer-link {
  margin-left: auto;
  color: var(--primary);
  cursor: pointer;
  font-size: 10px;
  opacity: .7;
  transition: opacity .15s;
}
.pin-footer-link:hover { opacity: 1; text-decoration: underline; }
```

---

## MCP status badge (in AI bar)

```css
.mcp-badge {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 99px;
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}
.mcp-badge.on {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid rgba(63,185,80,.2);
}
.mcp-badge.off {
  background: var(--bg-high);
  color: var(--outline);
  border: 1px solid var(--outline-var);
}
.mcp-dot { width: 4px; height: 4px; border-radius: 50%; background: currentColor; }
```

---

## Global webview base styles

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: var(--bg-base);
  color: var(--on-surface);
  font-family: var(--font-sans);
  font-size: 12px;
  overflow: hidden;
  height: 100vh;
  display: flex;
  flex-direction: column;
  -webkit-font-smoothing: antialiased;
}

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bg-high); border-radius: 2px; }

/* Subtle gradient accents */
.accent-glow-bottom-right {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(133,207,255,0.04) 0%, transparent 70%);
  pointer-events: none;
  z-index: -1;
}
.accent-glow-top-left {
  position: fixed;
  top: 40px;
  left: 0;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(226,182,255,0.03) 0%, transparent 70%);
  pointer-events: none;
  z-index: -1;
}
```

Add both `.accent-glow-bottom-right` and `.accent-glow-top-left` as the last
children of the body.

---

## AI avatar SVG (Harness icon small)

Replace the existing AI bar avatar with:

```html
<div class="ai-avatar">
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <rect x="0" y="0" width="7" height="7" rx="1.5" fill="#85CFFF"/>
    <rect x="9" y="0" width="7" height="7" rx="1.5" fill="#85CFFF" opacity="0.6"/>
    <rect x="0" y="9" width="7" height="7" rx="1.5" fill="#85CFFF" opacity="0.6"/>
    <rect x="9" y="9" width="7" height="7" rx="1.5" fill="#85CFFF"/>
  </svg>
</div>
```

---

## Tabs (MAIN / CI / CD etc.)

```css
.pip-tabs {
  display: flex;
  border-bottom: 1px solid var(--outline-var);
  background: var(--bg-surface);
  padding: 0 10px;
  flex-shrink: 0;
  gap: 2px;
}
.pip-tab {
  padding: 5px 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--outline);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color .15s, border-color .15s;
  display: flex;
  align-items: center;
  gap: 4px;
}
.pip-tab:hover { color: var(--on-surface-var); }
.pip-tab.active { color: var(--primary); border-bottom-color: var(--primary); }
.tab-badge {
  font-size: 8px;
  background: var(--error);
  color: #fff;
  border-radius: 99px;
  padding: 0 4px;
  min-width: 12px;
  text-align: center;
  line-height: 12px;
}
.tab-badge.warn { background: var(--warning); color: var(--bg-base); }
.tab-badge.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  padding: 0;
  min-width: 5px;
  background: var(--secondary);
}
```

---

## Refresh button

```css
.refresh-btn {
  margin: 6px 10px;
  padding: 4px 10px;
  font-size: 10px;
  border: 1px solid var(--outline-var);
  border-radius: var(--radius);
  background: transparent;
  color: var(--outline);
  cursor: pointer;
  font-family: var(--font-sans);
  display: flex;
  align-items: center;
  gap: 4px;
  align-self: flex-end;
  transition: border-color .15s, color .15s;
}
.refresh-btn:hover { border-color: var(--outline); color: var(--on-surface-var); }
```

---

## Summary of what to change

1. Add all CSS variables to `:root` at the top of the `<style>` block
2. Replace ALL existing color references (hex values, VS Code variables) 
   with the new CSS variables above
3. Replace the "Harness" text header with the `.harness-logo` SVG+wordmark
4. Replace the AI bar avatar with the Harness 4-square icon SVG
5. Apply the new class names and CSS to all existing HTML elements
6. Add `.accent-glow-bottom-right` and `.accent-glow-top-left` to body
7. Keep all onclick handlers, data attributes, and JS logic exactly as-is
8. Make sure the body background is `var(--bg-base)` (#131313) — no white flash

## What NOT to change

- Any TypeScript files (.ts)
- ViewStateManager logic
- Message handlers
- FME client
- Log editor tab logic
- Polling or API calls
- Existing HTML structure (only restyle, don't restructure)
- Any data flow or rendering logic in JS

---

## PART B — Feature Flag: vscode-bar-experience

The new dark design is gated behind the Harness FME feature flag
`vscode-bar-experience`. The flag already exists in the project.

### B.1 — FME flag spec

Flag identifier: vscode-bar-experience
Org: default (Sandbox) · Project: luisredda
Treatments:
  "simple"   → current light theme (control — DO NOT change this path)
  "enhanced" → new Harness dark theme (implement this)

### B.2 — Add treatment getter to src/fme/fmeClient.ts

```typescript
export function getWebviewThemeVariation(): 'simple' | 'enhanced' {
  if (!splitClient) return 'simple'; // safe default — never show broken UI
  const v = splitClient.getTreatment('vscode-bar-experience');
  if (v === 'enhanced') return 'enhanced';
  return 'simple';
}
```

### B.3 — Send theme to webview on init and on state updates

In extension.ts, wherever you post the initial state message to the webview
and wherever you post state updates, add the theme variation:

```typescript
import { getWebviewThemeVariation } from './fme/fmeClient';

panel.webview.postMessage({
  type: 'STATE_UPDATE',
  // ... existing fields ...
  webviewTheme: getWebviewThemeVariation(), // add this
});
```

### B.4 — Webview: apply theme class on STATE_UPDATE

In the webview JS, store the theme — the actual application is done
by applyEffectiveTheme() in Part C which combines both signals:

```javascript
let webviewTheme = 'simple'; // safe default

window.addEventListener('message', e => {
  const msg = e.data;
  if (msg.type === 'STATE_UPDATE') {
    if (msg.webviewTheme !== undefined) webviewTheme = msg.webviewTheme;
    // ideThemeKind also updated here — see Part C.3
    applyEffectiveTheme();
    // ... rest of existing state handling unchanged ...
  }
});
```

### B.5 — CSS: scope enhanced design under .theme-enhanced

All new dark CSS variables and component rules from Part A must be scoped
under the class `.theme-enhanced` on the body element.

The existing light/simple CSS stays exactly as-is — no class prefix needed,
it is the default baseline.

```css
/* ── SIMPLE (current light theme) — untouched, no class prefix ── */
/* all existing CSS rules here, exactly as written today */

/* ── ENHANCED (new dark Harness theme) — only when body.theme-enhanced ── */
.theme-enhanced {
  --bg-base:         #131313;
  --bg-surface:      #1C1B1B;
  --bg-elevated:     #201F1F;
  --bg-card:         #252525;
  --bg-high:         #2A2A2A;
  --bg-highest:      #353534;
  --primary:         #85CFFF;
  --primary-dim:     #2BB1F2;
  --primary-glow:    rgba(133,207,255,0.08);
  --secondary:       #E2B6FF;
  --on-surface:      #E5E2E1;
  --on-surface-var:  #BDC8D1;
  --outline:         #88929B;
  --outline-var:     #3E4850;
  --success:         #3FB950;
  --success-bg:      rgba(63,185,80,0.10);
  --warning:         #E3B341;
  --warning-bg:      rgba(227,179,65,0.10);
  --error:           #F85149;
  --error-bg:        rgba(248,81,73,0.10);
  --error-container: #93000A;
  --running-bg:      rgba(133,207,255,0.10);
  background: var(--bg-base);
  color:      var(--on-surface);
}

/* All Part A component rules scoped under .theme-enhanced: */
.theme-enhanced .hdr             { background: var(--bg-base); border-bottom: 1px solid var(--outline-var); }
.theme-enhanced .git-bar         { background: rgba(133,207,255,.03); border-bottom: 1px solid var(--outline-var); }
.theme-enhanced .view-toggle     { background: var(--bg-surface); border-bottom: 1px solid var(--outline-var); }
.theme-enhanced .pip-card        { background: var(--bg-elevated); }
.theme-enhanced .tree-body       { background: var(--bg-base); }
.theme-enhanced .stage-row:hover { background: var(--bg-elevated); }
.theme-enhanced .stage-row.active{ background: var(--bg-elevated); border-left: 2px solid var(--primary); }
.theme-enhanced .step-row:hover  { background: var(--bg-high); }
.theme-enhanced .log-snippet     { background: var(--bg-base); border-top: 1px solid var(--outline-var); }
.theme-enhanced .ai-bar          { background: var(--bg-surface); border-top: 1px solid var(--outline-var); }
.theme-enhanced .ai-input        { background: var(--bg-high); border: 1px solid var(--outline-var); color: var(--on-surface); }
.theme-enhanced .ai-input::placeholder { color: var(--outline-var); }
/* Apply ALL Part A component rules prefixed with .theme-enhanced — one per component */
```

Switching from simple to enhanced is done by replacing the body class:

```javascript
// simple:   document.body.className = 'theme-simple'
// enhanced: document.body.className = 'theme-enhanced'
```

---

## PART C — IDE dark/light mode detection

The webview must follow the VS Code IDE theme automatically.
When IDE is in dark mode AND FF = 'enhanced' → show enhanced dark theme.
When IDE is in light mode → always show simple theme, regardless of FF.

### C.1 — Detect VS Code theme kind in extension.ts

```typescript
import * as vscode from 'vscode';

function getVSCodeThemeKind(): 'dark' | 'light' {
  const kind = vscode.window.activeColorTheme.kind;
  // ColorThemeKind: 1 = Light, 2 = Dark, 3 = HighContrast, 4 = HighContrastLight
  return (kind === 1 || kind === 4) ? 'light' : 'dark';
}
```

Include in every state message to webview:

```typescript
panel.webview.postMessage({
  type: 'STATE_UPDATE',
  // ... all existing fields unchanged ...
  webviewTheme: getWebviewThemeVariation(), // 'simple' | 'enhanced'
  ideThemeKind: getVSCodeThemeKind(),       // 'dark' | 'light'
});
```

### C.2 — Listen for IDE theme changes in extension.ts

```typescript
context.subscriptions.push(
  vscode.window.onDidChangeActiveColorTheme(() => {
    panel?.webview.postMessage({
      type: 'STATE_UPDATE',
      // ... include all current state fields ...
      webviewTheme: getWebviewThemeVariation(),
      ideThemeKind: getVSCodeThemeKind(),
    });
  })
);
```

### C.3 — Webview: combine FF treatment + IDE theme kind

```javascript
let webviewTheme = 'simple';  // from FME FF
let ideThemeKind = 'dark';    // from VS Code

window.addEventListener('message', e => {
  const msg = e.data;
  if (msg.type === 'STATE_UPDATE') {
    if (msg.webviewTheme !== undefined) webviewTheme = msg.webviewTheme;
    if (msg.ideThemeKind !== undefined) ideThemeKind = msg.ideThemeKind;
    applyEffectiveTheme();
    // ... rest of existing state handling unchanged ...
  }
});

function applyEffectiveTheme() {
  // enhanced only when: FF = 'enhanced' AND IDE is in dark mode
  const effective = (webviewTheme === 'enhanced' && ideThemeKind === 'dark')
    ? 'enhanced'
    : 'simple';

  document.body.classList.remove('theme-simple', 'theme-enhanced');
  document.body.classList.add('theme-' + effective);
}

// Initial detection using VS Code's own body classes
// (VS Code injects 'vscode-dark' or 'vscode-light' before first message)
function detectInitialTheme() {
  if (document.body.classList.contains('vscode-dark') ||
      document.body.classList.contains('vscode-high-contrast')) {
    ideThemeKind = 'dark';
  } else {
    ideThemeKind = 'light';
  }
  applyEffectiveTheme();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectInitialTheme);
} else {
  detectInitialTheme();
}
```

### C.4 — Simple theme compatibility

When the effective theme is 'simple', the webview must look exactly as
it does today — no enhanced dark colors can bleed through. This is
guaranteed by Part B.5 scoping all enhanced rules under `.theme-enhanced`.

---

## Decision table

| FF treatment  | IDE theme | Effective webview theme     |
|---|---|---|
| `simple`      | dark      | simple (current light UI)   |
| `simple`      | light     | simple (current light UI)   |
| `enhanced`    | dark      | enhanced (new dark UI) ✓   |
| `enhanced`    | light     | simple (current light UI)   |

The developer only sees the new enhanced dark UI when both are true:
1. FME flag `vscode-bar-experience` = `enhanced` for their machine/user
2. Their VS Code IDE is in dark mode

---

## Summary of files to touch (Parts B and C)

- src/fme/fmeClient.ts  — add getWebviewThemeVariation() returning 'simple'|'enhanced'
- extension.ts          — add getVSCodeThemeKind(), onDidChangeActiveColorTheme
                          listener, add webviewTheme + ideThemeKind to all
                          STATE_UPDATE postMessage calls
- webview HTML/CSS      — keep simple CSS as default, scope all enhanced rules
                          under .theme-enhanced body class (Part B.5)
- webview JS            — add applyEffectiveTheme(), detectInitialTheme(),
                          handle webviewTheme + ideThemeKind in message listener
```
