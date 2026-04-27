import * as vscode from 'vscode';
import { execSync } from 'child_process';
import { StoFinding } from '../api/types';
import { DiagnosticsManager } from './diagnosticsManager';

function getDiffFiles(repoPath: string): Set<string> {
  try {
    const out = execSync('git diff --name-only HEAD~1', { cwd: repoPath, encoding: 'utf8' });
    return new Set(out.split('\n').map(f => f.trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

export function applySTO(
  findings: StoFinding[],
  diffAware: boolean,
  diagnostics: DiagnosticsManager
): void {
  const collection = diagnostics.getStoCollection();
  collection.clear();

  const diffFiles = diffAware
    ? getDiffFiles(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '')
    : null;

  const byFile = new Map<string, vscode.Diagnostic[]>();

  for (const f of findings) {
    const file = f.location?.file;
    if (!file) continue;
    if (diffFiles && !diffFiles.has(file)) continue;

    const severity =
      f.severity === 'CRITICAL' || f.severity === 'HIGH'  ? vscode.DiagnosticSeverity.Error :
      f.severity === 'MEDIUM'                              ? vscode.DiagnosticSeverity.Warning :
                                                             vscode.DiagnosticSeverity.Information;

    const line = Math.max(0, (f.location?.line ?? 1) - 1);
    const range = new vscode.Range(line, 0, line, 0);

    const message = `[Harness STO] ${f.title}${f.cveId ? ` (${f.cveId})` : ''}`;
    const diag = new vscode.Diagnostic(range, message, severity);
    diag.source = 'Harness STO';

    if (f.referenceUrl) {
      diag.code = { value: f.cveId ?? f.id, target: vscode.Uri.parse(f.referenceUrl) };
    }

    const existing = byFile.get(file) ?? [];
    existing.push(diag);
    byFile.set(file, existing);
  }

  for (const [file, diags] of byFile.entries()) {
    const wsFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
    const uri = vscode.Uri.file(`${wsFolder}/${file}`);
    collection.set(uri, diags);
  }
}

export function summariseSTO(findings: StoFinding[]): { count: number; high: number; medium: number; critical: number } {
  return {
    count:    findings.length,
    critical: findings.filter(f => f.severity === 'CRITICAL').length,
    high:     findings.filter(f => f.severity === 'HIGH').length,
    medium:   findings.filter(f => f.severity === 'MEDIUM').length,
  };
}
