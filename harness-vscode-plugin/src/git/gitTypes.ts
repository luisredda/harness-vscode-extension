// Minimal type shim for vscode.git extension API
export interface Repository {
  rootUri: import('vscode').Uri;
  state: {
    HEAD?: { name?: string; commit?: string };
    onDidChange: (listener: () => void) => import('vscode').Disposable;
  };
}

export interface GitAPI {
  repositories: Repository[];
  onDidOpenRepository: (listener: (repo: Repository) => void) => import('vscode').Disposable;
}
