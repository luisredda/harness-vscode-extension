# Harness AI integration — handoff bundle

## What's in here

- **`CLAUDE_CODE_PROMPT.md`** — the implementation prompt. Start here.
- **`AI Integration.html`** — interactive design canvas. Open in a browser.
- **`Print Sheet.html`** — flat 2-column layout of every artboard, easier to scroll.
- **`screens/*.png`** — baked screenshots of the print sheet for quick reference.
- **`ai-integration.jsx` / `ai-integration.css`** — the React components
  and styles used in both canvases. Lift structure + class names from these.
- **`styles.css`** — shared design tokens (colors, spacing, radii). Do not fork.
- **`design-canvas.jsx`** — only needed for the pan/zoom canvas; not
  part of the implementation.

## How to use

1. Read `CLAUDE_CODE_PROMPT.md` top to bottom.
2. Open `AI Integration.html` in a browser. Pan/zoom through the
   artboards. Hover to inspect DOM and grab exact class names.
3. Cross-reference against the screens/ folder when you just need a
   quick look without booting the canvas.
4. Implement. Ship the smallest possible diff to the existing
   extension — see the "what NOT to touch" list in the prompt.
