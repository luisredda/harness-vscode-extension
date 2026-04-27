# Implement: History toolbar — Option A (pill row + sort popover)

You are implementing a UI refactor for the **Executions tab** (history toolbar) in this VSCode extension. A complete design has already been produced; your job is to translate it to code **surgically** without touching surrounding logic.

---

## ⛔ DO NOT TOUCH

The following MUST remain unchanged. If you find yourself editing any of these, stop and reconsider.

- `ViewStateManager` and any state persistence logic
- Polling / fetch logic (`fetchHistory`, `fetchPipelines`, `setInterval` / `setTimeout` in `main.ts`)
- The `FME client` / FME integration
- MCP entries or any Harness MCP wiring
- The `Pipelines` tab (`pipelinesSort`, `pipelinesFilter`, `pipelinesSearch`, `togglePipelinesSort`, etc.) — only the **Executions** tab toolbar changes
- The filter message contract (`vscode.postMessage({ type: 'fetchHistory', ... })`) — signatures stay the same
- `historyItemRow(...)` and everything downstream of it
- `.rerun-scrim` / `.rerun-menu` styles (we reuse the pattern, do not modify it)
- `HistoryItem`, `PipelineItem` types
- Existing color tokens (`--accent`, `--bg-*`, `--fg-*`, `--line*`) — use them, do not redefine
- `state.executionsSort` mode names (`'recent' | 'oldest' | 'duration' | 'status'`) — do not rename
- The sort behavior in `historyListView` (the `displayList.sort(...)` blocks) — logic stays, only the trigger UI changes

---

## ✅ WHAT CHANGES

### File: `src/ui/webview/main.ts`

**1.  Add one piece of state (next to `executionsSort`):**

```ts
sortMenuOpen: false as boolean,   // true while the executions sort popover is open
```

**2.  Rewrite the toolbar inside `historyListView()`** (currently: `<div class="hist-toolbar">...`).

Replace the existing toolbar block — the one with `.hist-filters`, `.hist-check`, `.sort-btn`, `.hist-count-chip` — with this structure (keep all surrounding code intact, including `filteredPipelineName` pill rendering, `displayList`, `totalCount`, and the `exec-list-body` push).

```ts
// Sort-mode metadata
const sortMeta: Record<ExecutionsSortMode, { label: string; dir: string }> = {
  recent:   { label: 'Most recent', dir: 'newest \u2193' },
  oldest:   { label: 'Oldest first', dir: 'oldest \u2191' },
  duration: { label: 'Duration',     dir: 'longest \u2193' },
  status:   { label: 'Status',       dir: 'failed \u2191' },
};
const sortIsDefault = state.executionsSort === 'recent';
const currentSortLabel = sortMeta[state.executionsSort].label;

// SVG glyphs — inline, 14px, stroke: currentColor
const SORT_GLYPHS = {
  recent:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 7 L12 12 L15.5 14"/></svg>',
  oldest:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 7 L12 12 L8.5 14"/></svg>',
  duration: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18 L4 13"/><path d="M10 18 L10 10"/><path d="M16 18 L16 6"/></svg>',
  status:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="7" cy="12" r="2.6" fill="currentColor" opacity="0.95"/><circle cx="13" cy="12" r="2.6" fill="currentColor" opacity="0.55"/><circle cx="19" cy="12" r="2.6" fill="currentColor" opacity="0.25"/></svg>',
};

const sortOptHtml = (mode: ExecutionsSortMode) => {
  const isSel = state.executionsSort === mode;
  const m = sortMeta[mode];
  return `<button class="hist-sort-opt${isSel ? ' selected' : ''}" data-action="setExecutionsSort" data-sort-mode="${mode}" role="menuitemradio" aria-checked="${isSel}">
    <span class="opt-ico">${SORT_GLYPHS[mode]}</span>
    <span class="opt-lbl">${m.label}</span>
    <span class="opt-dir">${m.dir}</span>
    <svg class="opt-check" width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5 L5 9.5 L10 3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </button>`;
};

const commitPillOn = state.currentCommitFilter ? ' on' : '';
const commitPillDisabled = !state.gitCtx?.commitSha ? ' disabled' : '';

parts.push(`<div class="hist-toolbar">
  <div class="hist-filters">
    <button class="f-pill${allActive}"     data-action="filterAll">All</button>
    <button class="f-pill${failedActive}"  data-action="filterFailed">\u2715 Failed</button>
    <button class="f-pill${successActive}" data-action="filterSuccess">\u2713 Success</button>
    <button class="f-pill${waitingActive}" data-action="filterWaiting">\u23f1 Waiting</button>
    <button class="f-pill commit-pill${commitPillOn}${commitPillDisabled}"
            data-action="toggleCurrentCommitFilter"
            title="${state.gitCtx?.commitSha ? 'Filter to current commit' : 'No git commit detected'}"
            aria-pressed="${state.currentCommitFilter ? 'true' : 'false'}">
      <span class="check-glyph" aria-hidden="true">
        <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1.5 4.5 L3.5 6.5 L7.5 2.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <span>Current commit</span>
    </button>
    ${filteredPipelineName ? `<span class="hist-pipeline-filter">
      <span class="hist-pf-label">\u26a1 ${esc(filteredPipelineName)}</span>
      <button class="hist-pf-clear" data-action="clearPipelineFilter" title="Clear pipeline filter">\u00d7</button>
    </span>` : ''}
    <div class="hist-sort-wrap">
      <button class="hist-sort-btn${sortIsDefault ? '' : ' modified'}${state.sortMenuOpen ? ' open' : ''}"
              data-action="toggleSortMenu"
              title="Sort: ${currentSortLabel}"
              aria-haspopup="menu"
              aria-expanded="${state.sortMenuOpen ? 'true' : 'false'}">
        <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3 L3 10 M3 3 L1.5 5 M3 3 L4.5 5 M9 9 L9 2 M9 9 L7.5 7 M9 9 L10.5 7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="none"/></svg>
        ${sortIsDefault ? '' : '<span class="sort-dot" aria-hidden="true"></span>'}
      </button>
      ${state.sortMenuOpen ? `
        <div class="hist-sort-scrim" data-action="closeSortMenu"></div>
        <div class="hist-sort-menu" role="menu" aria-label="Sort executions by">
          <div class="menu-hdr">Sort by</div>
          ${sortOptHtml('recent')}
          ${sortOptHtml('oldest')}
          <div class="menu-div" role="separator"></div>
          ${sortOptHtml('duration')}
          ${sortOptHtml('status')}
        </div>` : ''}
    </div>
    <span class="hist-count-chip"><span class="hc-n">${displayList.length}</span><span class="hc-sep">/</span><span class="hc-total">${totalCount}</span></span>
  </div>
</div>`);
```

**Notes on structure:**
- Everything is in one wrap-friendly row (`.hist-filters`). The second row used by `.hist-check` is gone.
- `Current commit` becomes a pill with the same on/off vocabulary as the status filters. Keep it **last in the pill group** so it reads as a scope modifier.
- The sort button is anchored in `.hist-sort-wrap` (a positioned ancestor). The menu uses the rerun-scrim pattern you already have — fixed-inset scrim + absolute-positioned menu.

**3.  Replace the existing `toggleExecutionsSort` handler** (the cycle-through one) and add the menu handlers. In the handlers section:

```ts
// Open/close the executions sort popover
q('[data-action="toggleSortMenu"]', () => {
  state.sortMenuOpen = !state.sortMenuOpen;
  scheduleRender(true);
});
q('[data-action="closeSortMenu"]', () => {
  state.sortMenuOpen = false;
  scheduleRender(true);
});

// Select a sort mode
document.querySelectorAll<HTMLElement>('[data-action="setExecutionsSort"]').forEach(el => {
  el.addEventListener('click', () => {
    const mode = el.getAttribute('data-sort-mode') as ExecutionsSortMode;
    if (mode) {
      state.executionsSort = mode;
      state.sortMenuOpen = false;
      scheduleRender(true);
    }
  });
});
```

**Delete** the old `q('[data-action="toggleExecutionsSort"]', ...)` handler — it is replaced.

**4.  Escape key to close the menu.** Add once, near other global keyboard handlers (there is likely a `keydown` listener for Esc already — piggy-back on it):

```ts
if (e.key === 'Escape' && state.sortMenuOpen) {
  state.sortMenuOpen = false;
  scheduleRender(true);
  return;
}
```

If no Esc handler exists, add a `document.addEventListener('keydown', ...)` at the bottom of the init block. Do not duplicate if one is already there.

---

### File: `src/ui/webview/styles.css`

Make changes inside the `.theme-enhanced` scope to match the rest of the enhanced-theme block. Append at the end of the file, or group next to the existing `.hist-toolbar` block (around line 3745) — your call.

**A.  Update `.theme-enhanced .hist-toolbar`** (currently has two variants — the second at line ~3890 overrides the first). Keep only one, matching this:

```css
.theme-enhanced .hist-toolbar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px 6px;
  border-bottom: 1px solid var(--line);
  background: var(--bg-0);
}
.theme-enhanced .hist-filters {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  min-width: 0;
}
```

**B.  Remove / replace:** the existing `.theme-enhanced .hist-check` rules and the old `.theme-enhanced .sort-btn` rules for the executions tab. The Pipelines tab's sort-btn should remain unaffected — if the rule is shared, scope it with `.hist-toolbar .sort-btn` or leave and don't target it.

**C.  Add the commit pill, sort button, sort menu, and count chip styles:**

```css
/* Current-commit pill (extends .f-pill) */
.theme-enhanced .f-pill.commit-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding-left: 4px;
}
.theme-enhanced .f-pill.commit-pill .check-glyph {
  width: 13px; height: 13px;
  border: 1.3px solid var(--line-2);
  border-radius: 3px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--bg-0);
  color: transparent;
  flex-shrink: 0;
  transition: background .1s, border-color .1s, color .1s;
}
.theme-enhanced .f-pill.commit-pill.on .check-glyph {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg-0);
}
.theme-enhanced .f-pill.commit-pill.disabled {
  opacity: 0.4;
  pointer-events: none;
}

/* Icon-only sort button */
.theme-enhanced .hist-sort-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}
.theme-enhanced .hist-sort-btn {
  width: 24px; height: 24px;
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--fg-2);
  cursor: pointer;
  position: relative;
  transition: background .1s, border-color .1s, color .1s;
}
.theme-enhanced .hist-sort-btn:hover {
  background: var(--bg-1);
  border-color: var(--line-2);
  color: var(--fg-0, var(--fg));
}
.theme-enhanced .hist-sort-btn.modified,
.theme-enhanced .hist-sort-btn.open {
  background: var(--bg-1);
  border-color: var(--line-2);
  color: var(--fg-0, var(--fg));
}
.theme-enhanced .hist-sort-btn .sort-dot {
  position: absolute;
  top: 2px; right: 2px;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--accent);
  border: 1px solid var(--bg-0);
}

/* Sort popover */
.theme-enhanced .hist-sort-scrim {
  position: fixed; inset: 0; z-index: 25;
}
.theme-enhanced .hist-sort-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 26;
  min-width: 220px;
  background: var(--bg-2);
  border: 1px solid var(--line-2);
  border-radius: var(--r, 6px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4);
  padding: 4px;
  display: flex; flex-direction: column;
  animation: histSortMenuIn 120ms ease-out;
}
@keyframes histSortMenuIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: none; }
}
.theme-enhanced .hist-sort-menu .menu-hdr {
  padding: 6px 10px 4px;
  font-size: 9.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fg-3);
  font-family: var(--font-mono);
}
.theme-enhanced .hist-sort-menu .menu-div {
  height: 1px;
  background: var(--line);
  margin: 4px 0;
}
.theme-enhanced .hist-sort-opt {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 8px 7px 10px;
  font-size: 11.5px;
  color: var(--fg-1);
  background: transparent;
  border: none;
  border-radius: var(--r-sm, 4px);
  width: 100%;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: background .08s;
}
.theme-enhanced .hist-sort-opt:hover { background: var(--bg-3); color: var(--fg-0, var(--fg)); }
.theme-enhanced .hist-sort-opt.selected {
  background: var(--accent-soft, rgba(0,180,220,0.12));
  color: var(--accent);
}
.theme-enhanced .hist-sort-opt .opt-ico {
  width: 14px; height: 14px;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  opacity: 0.9;
}
.theme-enhanced .hist-sort-opt .opt-lbl { flex: 1; }
.theme-enhanced .hist-sort-opt .opt-dir {
  font-size: 9.5px;
  font-family: var(--font-mono);
  color: var(--fg-3);
  letter-spacing: 0.04em;
}
.theme-enhanced .hist-sort-opt.selected .opt-dir {
  color: var(--accent);
  opacity: 0.8;
}
.theme-enhanced .hist-sort-opt .opt-check {
  opacity: 0;
  flex-shrink: 0;
}
.theme-enhanced .hist-sort-opt.selected .opt-check {
  opacity: 1;
  color: var(--accent);
}

/* Count chip — compact mono badge, replaces the old .hist-count-chip box */
.theme-enhanced .hist-count-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--fg-2);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: auto;
  padding: 0 4px 0 6px;
  background: transparent;
  border-radius: 0;
}
.theme-enhanced .hist-count-chip .hc-n { color: var(--fg-0, var(--fg)); font-weight: 500; }
.theme-enhanced .hist-count-chip .hc-sep { opacity: 0.4; }
.theme-enhanced .hist-count-chip .hc-total { opacity: 0.6; }
```

**D.  Simple-theme (non-enhanced) fallback.** The Executions tab also runs in the plain theme; keep it basic — pills render via existing `.f-pill`, and a flat sort button suffices. Drop in:

```css
.hist-sort-wrap { position: relative; display: inline-flex; }
.hist-sort-btn {
  width: 22px; height: 22px;
  background: var(--vscode-button-secondaryBackground);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 3px;
  color: var(--vscode-foreground);
  cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  position: relative;
}
.hist-sort-btn:hover { background: var(--vscode-button-secondaryHoverBackground); }
.hist-sort-btn .sort-dot {
  position: absolute; top: 2px; right: 2px;
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--vscode-charts-blue, #0078d4);
}
.hist-sort-scrim { position: fixed; inset: 0; z-index: 25; }
.hist-sort-menu {
  position: absolute; top: calc(100% + 4px); right: 0; z-index: 26;
  min-width: 200px;
  background: var(--vscode-menu-background, var(--vscode-editor-background));
  border: 1px solid var(--vscode-menu-border, var(--vscode-panel-border));
  box-shadow: 0 6px 18px rgba(0,0,0,0.3);
  padding: 3px;
}
.hist-sort-opt {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 8px;
  background: transparent; border: none; width: 100%;
  color: var(--vscode-menu-foreground, var(--vscode-foreground));
  font-size: 12px; cursor: pointer; text-align: left;
}
.hist-sort-opt:hover {
  background: var(--vscode-menu-selectionBackground, var(--vscode-list-hoverBackground));
  color: var(--vscode-menu-selectionForeground, var(--vscode-foreground));
}
.hist-sort-opt .opt-ico { width: 14px; height: 14px; flex-shrink: 0; opacity: 0.8; }
.hist-sort-opt .opt-lbl { flex: 1; }
.hist-sort-opt .opt-dir { font-size: 10px; opacity: 0.55; }
.hist-sort-opt .opt-check { opacity: 0; }
.hist-sort-opt.selected .opt-check { opacity: 1; }
.hist-sort-menu .menu-hdr {
  padding: 4px 8px 2px; font-size: 10px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.06em;
}
.hist-sort-menu .menu-div { height: 1px; background: var(--vscode-panel-border); margin: 3px 0; }
.f-pill.commit-pill .check-glyph {
  width: 11px; height: 11px;
  border: 1px solid var(--vscode-panel-border);
  display: inline-flex; align-items: center; justify-content: center;
  color: transparent;
  margin-right: 3px;
}
.f-pill.commit-pill.on .check-glyph {
  background: var(--vscode-charts-blue, #0078d4);
  border-color: var(--vscode-charts-blue, #0078d4);
  color: var(--vscode-editor-background);
}
.hist-count-chip {
  margin-left: auto;
  font-size: 10px;
  font-family: var(--vscode-editor-font-family, monospace);
  color: var(--vscode-descriptionForeground);
  font-variant-numeric: tabular-nums;
  padding: 0 4px;
}
.hist-count-chip .hc-n { color: var(--vscode-foreground); }
.hist-count-chip .hc-sep { opacity: 0.4; }
.hist-count-chip .hc-total { opacity: 0.6; }
```

---

## 🔎 Reference screenshots (in this folder)

- `screens/01-sort-icons.png` — the 4 glyphs and their intent
- `screens/02-sort-menu-open.png` — menu anchored to the icon button, selected + unselected states
- `screens/03-trigger-states.png` — default / modified / open / labeled trigger behavior
- `screens/05-option-a.png` — the toolbar row layout at 240 / 320 / 440 px widths

Open `Sort Menu — Option A.html` and `History Toolbar Options.html` in a browser for pixel-accurate reference.

---

## ✅ Acceptance checklist

Run through this before declaring done:

- [ ] All status filter pills still work exactly as before (push `fetchHistory` with the filter).
- [ ] `Current commit` pill toggles `state.currentCommitFilter` and re-renders; disabled state when no `gitCtx.commitSha`.
- [ ] `Pipeline` filter pill (the `hist-pipeline-filter`) still renders in the same row when present, and its X still clears.
- [ ] Sort icon button opens menu; scrim dismisses on outside click; Esc closes.
- [ ] Menu shows 4 modes with icons + labels + direction hints + check on selected.
- [ ] Selecting a mode updates `state.executionsSort`, closes menu, list re-sorts.
- [ ] Non-default sort → trigger shows accent dot + darker fill.
- [ ] Count chip reads as `{displayList.length}/{totalCount}` in mono, right-aligned.
- [ ] At narrow panel widths (240 px) the pill row wraps gracefully — no overflow, no horizontal scroll.
- [ ] Pipelines tab is untouched and still works.
- [ ] No new lint errors; existing types compile.
- [ ] Polling behavior unchanged — confirm a page reload still fetches and auto-refreshes history.

---

## 🚫 Reminder — do NOT touch

- `ViewStateManager`
- Polling / timers / fetchHistory call sites (other than reading `displayList` length)
- FME client
- Harness MCP
- Pipelines tab
- `.rerun-scrim` / `.rerun-menu`
- Existing design tokens
- `historyItemRow` and everything below it
- `state.executionsSort` enum values

If a change requires modifying any of these, **stop and ask** before proceeding.
