import * as vscode from 'vscode';
import * as path from 'path';
import { HarnessClient } from '../api/harnessClient';
import { HarnessConfig } from '../config/configManager';
import { getFlagState } from '../api/ffService';
import { FlagState } from '../api/types';

const FF_PATTERNS: RegExp[] = [
  /isEnabled\(['"`]([^'"`]+)['"`]\)/g,
  /client\.variation\(['"`]([^'"`]+)['"`]/g,
  /ff\.BoolVariation\(['"`]([^'"`]+)['"`]/g,
  /\.variation\(['"`]([^'"`]+)['"`]/g,
  /getFlag\(['"`]([^'"`]+)['"`]\)/g,
  /LDClient\.variation\(['"`]([^'"`]+)['"`]/g,
  /unleash\.isEnabled\(['"`]([^'"`]+)['"`]\)/g,
];

const flagCache = new Map<string, { state: FlagState; expiresAt: number }>();

function extractFlagKeys(text: string): Map<string, number[]> {
  const result = new Map<string, number[]>();
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of FF_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(line)) !== null) {
        const key = match[1];
        const existing = result.get(key) ?? [];
        if (!existing.includes(i)) existing.push(i);
        result.set(key, existing);
      }
    }
  }

  return result;
}

function makeDecorationTypes(context: vscode.ExtensionContext) {
  return {
    on: vscode.window.createTextEditorDecorationType({
      gutterIconPath: vscode.Uri.file(path.join(context.extensionPath, 'icons', 'flag-on.svg')),
      gutterIconSize: '14px',
    }),
    off: vscode.window.createTextEditorDecorationType({
      gutterIconPath: vscode.Uri.file(path.join(context.extensionPath, 'icons', 'flag-off.svg')),
      gutterIconSize: '14px',
    }),
    varies: vscode.window.createTextEditorDecorationType({
      gutterIconPath: vscode.Uri.file(path.join(context.extensionPath, 'icons', 'flag-varies.svg')),
      gutterIconSize: '14px',
    }),
  };
}

async function getCachedFlagState(
  key: string,
  client: HarnessClient,
  config: HarnessConfig
): Promise<FlagState | null> {
  const cached = flagCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.state;

  try {
    const state = await getFlagState(client, config, key);
    flagCache.set(key, { state, expiresAt: Date.now() + 60_000 });
    return state;
  } catch {
    return null;
  }
}

function classifyFlag(state: FlagState): 'on' | 'off' | 'varies' {
  if (!state.environments.length) return state.enabled ? 'on' : 'off';
  const allOn  = state.environments.every(e => e.enabled);
  const allOff = state.environments.every(e => !e.enabled);
  return allOn ? 'on' : allOff ? 'off' : 'varies';
}

function buildHoverMarkdown(state: FlagState): vscode.MarkdownString {
  const md = new vscode.MarkdownString();
  md.isTrusted = true;
  md.appendMarkdown(`**$(flag) Harness Feature Flag: \`${state.name}\`**\n\n`);
  if (state.environments.length) {
    md.appendMarkdown('| Environment | Status |\n|---|---|\n');
    for (const env of state.environments) {
      md.appendMarkdown(`| ${env.name} | ${env.enabled ? '🟢 Enabled' : '⚫ Disabled'} |\n`);
    }
  } else {
    md.appendMarkdown(`Global: ${state.enabled ? '🟢 Enabled' : '⚫ Disabled'}`);
  }
  return md;
}

export function registerFfDecorations(
  context: vscode.ExtensionContext,
  getClient: () => HarnessClient | null,
  getConfig: () => HarnessConfig | null
): void {
  const decorTypes = makeDecorationTypes(context);

  let debounceTimer: NodeJS.Timeout | undefined;

  async function refreshEditor(editor: vscode.TextEditor) {
    const client = getClient();
    const config = getConfig();
    if (!client || !config) return;

    const flagMap = extractFlagKeys(editor.document.getText());
    if (!flagMap.size) {
      editor.setDecorations(decorTypes.on, []);
      editor.setDecorations(decorTypes.off, []);
      editor.setDecorations(decorTypes.varies, []);
      return;
    }

    const onRanges: vscode.DecorationOptions[]     = [];
    const offRanges: vscode.DecorationOptions[]    = [];
    const variesRanges: vscode.DecorationOptions[] = [];

    await Promise.all(
      [...flagMap.entries()].map(async ([key, lines]) => {
        const state = await getCachedFlagState(key, client, config);
        if (!state) return;

        const kind = classifyFlag(state);
        const hover = buildHoverMarkdown(state);

        for (const line of lines) {
          const range = new vscode.Range(line, 0, line, 0);
          const opt: vscode.DecorationOptions = { range, hoverMessage: hover };
          if      (kind === 'on')     onRanges.push(opt);
          else if (kind === 'off')    offRanges.push(opt);
          else                         variesRanges.push(opt);
        }
      })
    );

    editor.setDecorations(decorTypes.on,     onRanges);
    editor.setDecorations(decorTypes.off,    offRanges);
    editor.setDecorations(decorTypes.varies, variesRanges);
  }

  function scheduleRefresh(editor: vscode.TextEditor) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => refreshEditor(editor), 500);
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) refreshEditor(editor);
    }),
    vscode.workspace.onDidChangeTextDocument(e => {
      const editor = vscode.window.activeTextEditor;
      if (editor && e.document === editor.document) scheduleRefresh(editor);
    }),
    decorTypes.on,
    decorTypes.off,
    decorTypes.varies
  );

  // Refresh current editor on activation
  if (vscode.window.activeTextEditor) {
    refreshEditor(vscode.window.activeTextEditor);
  }
}
