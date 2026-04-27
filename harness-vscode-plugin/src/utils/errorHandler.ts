import * as vscode from 'vscode';
import { HarnessApiError } from '../api/harnessClient';

export function handleApiError(error: unknown, context: string): void {
  if (error instanceof HarnessApiError) {
    if (error.status === 401) {
      vscode.window.showErrorMessage(
        `Harness: Authentication failed — ${error.message}`, 'Reconfigure'
      ).then(a => {
        if (a === 'Reconfigure') vscode.commands.executeCommand('harness.configureApiKey');
      });
      return;
    }
    if (error.status === 403) {
      vscode.window.showWarningMessage(
        `Harness: Insufficient permissions for ${context}. Check API key scopes.`
      );
      return;
    }
    // 5xx — log silently, retry next poll tick
    console.error(`[Harness] ${context}: ${error.message}`);
    return;
  }
  if (error instanceof TypeError && error.message.includes('fetch')) {
    console.warn(`[Harness] Network error in ${context} — will retry`);
    return;
  }
  console.error(`[Harness] Unexpected error in ${context}:`, error);
}
