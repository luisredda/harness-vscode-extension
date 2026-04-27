import * as vscode from 'vscode';

export class DiagnosticsManager implements vscode.Disposable {
  private readonly sto = vscode.languages.createDiagnosticCollection('harness-sto');
  private readonly ti  = vscode.languages.createDiagnosticCollection('harness-ti');
  private readonly ssca = vscode.languages.createDiagnosticCollection('harness-ssca');

  getStoCollection(): vscode.DiagnosticCollection { return this.sto; }
  getTiCollection(): vscode.DiagnosticCollection  { return this.ti; }
  getSscaCollection(): vscode.DiagnosticCollection { return this.ssca; }

  clearAll(): void {
    this.sto.clear();
    this.ti.clear();
    this.ssca.clear();
  }

  dispose(): void {
    this.sto.dispose();
    this.ti.dispose();
    this.ssca.dispose();
  }
}
