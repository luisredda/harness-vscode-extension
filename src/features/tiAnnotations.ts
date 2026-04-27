import * as vscode from 'vscode';
import { TiOverview, TiFlakyTest } from '../api/types';
import { DiagnosticsManager } from './diagnosticsManager';

const RERUN_ACTION_CODE = 'harness.rerunTest';

export function applyTI(
  overview: TiOverview,
  flaky: TiFlakyTest[],
  diagnostics: DiagnosticsManager
): void {
  const collection = diagnostics.getTiCollection();
  collection.clear();

  const flakyNames = new Set(flaky.map(f => `${f.testSuiteName}::${f.testCaseName}`));

  const byFile = new Map<string, vscode.Diagnostic[]>();

  for (const test of overview.tests ?? []) {
    const file = test.file;
    if (!file) continue;

    const line = Math.max(0, (test.lineNumber ?? 1) - 1);
    const range = new vscode.Range(line, 0, line, 0);
    const key = `${test.testSuiteName}::${test.testCaseName}`;
    const isFlaky = flakyNames.has(key);

    let diag: vscode.Diagnostic | null = null;

    if (test.status === 'FAILED' || test.status === 'ERROR') {
      const msg = `[Harness TI] ${test.testCaseName} failed${test.errorMessage ? ': ' + test.errorMessage.slice(0, 120) : ''}`;
      diag = new vscode.Diagnostic(range, msg, vscode.DiagnosticSeverity.Error);
      diag.source = 'Harness TI';
      diag.code = RERUN_ACTION_CODE;
    } else if (isFlaky) {
      const flakyInfo = flaky.find(f => f.testCaseName === test.testCaseName);
      const runs = flakyInfo?.totalRuns ?? 20;
      const rate = Math.round((flakyInfo?.failureRate ?? 0) * 100);
      const msg = `[Harness TI] ${test.testCaseName}: historically flaky (${rate}% failure rate / ${runs} runs)`;
      diag = new vscode.Diagnostic(range, msg, vscode.DiagnosticSeverity.Information);
      diag.source = 'Harness TI';
    }

    if (diag) {
      const existing = byFile.get(file) ?? [];
      existing.push(diag);
      byFile.set(file, existing);
    }
  }

  for (const [file, diags] of byFile.entries()) {
    const wsFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
    const uri = vscode.Uri.file(`${wsFolder}/${file}`);
    collection.set(uri, diags);
  }
}

export function summariseTI(
  overview: TiOverview,
  flaky: TiFlakyTest[]
): { failed: number; flaky: number; selected: number; total: number } {
  return {
    total:    overview.total,
    failed:   overview.failed,
    flaky:    flaky.length,
    selected: overview.selected ?? 0,
  };
}

export class TiCodeActionProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    return context.diagnostics
      .filter(d => d.code === RERUN_ACTION_CODE)
      .map(d => {
        const action = new vscode.CodeAction(
          'Re-run test via Harness',
          vscode.CodeActionKind.QuickFix
        );
        action.command = {
          command: 'harness.rerunTest',
          title: 'Re-run test via Harness',
          arguments: [document.uri, d.range],
        };
        action.diagnostics = [d];
        return action;
      });
  }
}
