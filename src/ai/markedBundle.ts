// Entry point bundled by esbuild into dist/marked.js (IIFE, browser).
// The chat panel reads that built file and inlines it into the webview HTML,
// exposing window.__harnessMarkdown(text) for rendering assistant responses.
import { marked } from 'marked';

marked.setOptions({
  gfm: true,        // GitHub-flavored: tables, strikethrough, autolinks
  breaks: true,     // single newline -> <br> (matches the old renderer's behavior)
});

(globalThis as unknown as { __harnessMarkdown: (t: string) => string }).__harnessMarkdown = (text: string): string => {
  try {
    return marked.parse(text ?? '', { async: false }) as string;
  } catch {
    return '';
  }
};
