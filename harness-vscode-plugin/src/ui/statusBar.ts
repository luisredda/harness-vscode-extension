import * as vscode from 'vscode';

export class StatusBarItem implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.item.command = 'harness.sidebar.focus';
    this.item.name = 'Harness Pipeline';
    this.setIdle();
    this.item.show();
  }

  setIdle(): void {
    this.item.text = '$(harness-icon) Harness';
    this.item.tooltip = 'Harness: No execution found';
    this.item.backgroundColor = undefined;
  }

  setNotConfigured(): void {
    this.item.text = '$(warning) Harness: not configured';
    this.item.tooltip = 'Click to configure Harness';
    this.item.command = 'harness.configureApiKey';
    this.item.backgroundColor = undefined;
  }

  updateFromStatus(status: string, pipelineName: string, extra?: string): void {
    // Reset command to sidebar focus
    this.item.command = 'harness.sidebar.focus';
    this.item.backgroundColor = undefined;

    switch (status) {
      case 'RUNNING':
      case 'ASYNC_WAITING':
        this.item.text = `$(sync~spin) Harness: running`;
        this.item.tooltip = `${pipelineName} — running`;
        break;
      case 'SUCCESS':
        this.item.text = extra
          ? `$(check) Harness: passed · ${extra}`
          : `$(check) Harness: passed`;
        this.item.tooltip = `${pipelineName} — passed`;
        break;
      case 'FAILED':
        this.item.text = extra
          ? `$(error) Harness: failed · ${extra}`
          : `$(error) Harness: failed`;
        this.item.tooltip = `${pipelineName} — failed`;
        break;
      case 'ABORTED':
        this.item.text = `$(circle-slash) Harness: aborted`;
        this.item.tooltip = `${pipelineName} — aborted`;
        break;
      case 'POLICY_EVALUATION_FAILURE':
        this.item.text = `$(law) Harness: policy blocked`;
        this.item.tooltip = `${pipelineName} — blocked by OPA policy`;
        break;
      default:
        this.setIdle();
    }
  }

  dispose(): void {
    this.item.dispose();
  }
}
