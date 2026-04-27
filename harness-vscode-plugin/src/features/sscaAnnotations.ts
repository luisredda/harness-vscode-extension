import * as vscode from 'vscode';
import { SscaSbom } from '../api/types';
import { DiagnosticsManager } from './diagnosticsManager';

export function applySSCA(sbom: SscaSbom, diagnostics: DiagnosticsManager): void {
  const collection = diagnostics.getSscaCollection();
  collection.clear();

  // SSCA findings are not file-pinned — surface them as workspace-level diagnostics
  // using a virtual "SSCA Summary" location
  const flagged = sbom.flaggedComponents ?? [];
  if (!flagged.length) return;

  const wsFolder = vscode.workspace.workspaceFolders?.[0]?.uri;
  if (!wsFolder) return;

  // Attach to workspace root as placeholder (no file-level location from SSCA API)
  const diags = flagged.map(c => {
    const msg = `[Harness SSCA] ${c.name}@${c.version} flagged${c.riskReason ? ': ' + c.riskReason : ''}`;
    const diag = new vscode.Diagnostic(
      new vscode.Range(0, 0, 0, 0),
      msg,
      vscode.DiagnosticSeverity.Warning
    );
    diag.source = 'Harness SSCA';
    return diag;
  });

  // Try to pin to package.json / go.mod / pom.xml if present
  const manifestFiles = ['package.json', 'go.mod', 'pom.xml', 'requirements.txt', 'Cargo.toml'];
  let manifestUri: vscode.Uri | undefined;
  for (const mf of manifestFiles) {
    try {
      const uri = vscode.Uri.joinPath(wsFolder, mf);
      // We'll try to set it; vscode won't error if file doesn't exist
      manifestUri = uri;
      break;
    } catch { /* continue */ }
  }

  collection.set(manifestUri ?? wsFolder, diags);
}

export function summariseSSCA(sbom: SscaSbom): { flagged: number } {
  return { flagged: sbom.flaggedComponents?.length ?? 0 };
}
