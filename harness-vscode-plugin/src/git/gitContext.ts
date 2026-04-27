import * as vscode from 'vscode';

export interface GitContext {
  branch: string;
  commitSha: string;
  shortSha: string;
  repoPath: string;
  remoteUrl?: string;    // e.g. https://github.com/org/repo
  commitWebUrl?: string; // direct link to this commit on the SCM host
}

export async function getGitApi(): Promise<import('./gitTypes').GitAPI | null> {
  const gitExt = vscode.extensions.getExtension('vscode.git');
  if (!gitExt) return null;
  const git = gitExt.isActive ? gitExt.exports : await gitExt.activate();
  return git.getAPI(1);
}

export async function getGitContext(): Promise<GitContext | null> {
  const api = await getGitApi();
  if (!api) return null;

  let repo = api.repositories[0];
  if (!repo) {
    // If no workspace is open, don't wait for a repo - return immediately
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
      return null;
    }

    // Workspace is open but repo not ready - wait up to 5 seconds for it to initialize
    repo = await new Promise(resolve => {
      const timer = setTimeout(() => { sub.dispose(); resolve(undefined as any); }, 5000);
      const sub = api.onDidOpenRepository(r => {
        clearTimeout(timer);
        sub.dispose();
        resolve(r);
      });
    });
  }
  if (!repo) return null;

  const branch    = repo.state.HEAD?.name;
  const commitSha = repo.state.HEAD?.commit;
  if (!branch || !commitSha) return null;

  // Derive web URL from remote
  const remotes: Array<{ name: string; fetchUrl?: string; pushUrl?: string }> =
    (repo.state as any).remotes ?? [];
  const origin = remotes.find(r => r.name === 'origin') ?? remotes[0];
  const rawUrl = origin?.fetchUrl ?? origin?.pushUrl;
  const remoteUrl  = rawUrl ? normaliseRemoteUrl(rawUrl) : undefined;
  const commitWebUrl = remoteUrl ? buildCommitUrl(remoteUrl, commitSha) : undefined;

  return {
    branch,
    commitSha,
    shortSha: commitSha.slice(0, 7),
    repoPath: repo.rootUri.fsPath,
    remoteUrl,
    commitWebUrl,
  };
}

/** Convert git remote URL to HTTPS web URL (strips .git, converts SSH syntax). */
function normaliseRemoteUrl(raw: string): string {
  // SSH: git@github.com:org/repo.git  →  https://github.com/org/repo
  const ssh = raw.match(/^git@([^:]+):(.+?)(?:\.git)?$/);
  if (ssh) return `https://${ssh[1]}/${ssh[2]}`;
  // HTTPS: already fine, just strip .git
  return raw.replace(/\.git$/, '');
}

/** Build a direct commit URL for the known SCM hosts. */
export function buildCommitUrl(repoUrl: string, sha: string): string {
  // Harness Code repos can be org-level or project-level:
  // Project: https://git.harness.io/{account}/{org}/{project}/{repo}
  //   → https://app.harness.io/ng/account/{account}/module/code/orgs/{org}/projects/{project}/repos/{repo}/commit/{sha}
  // Org: https://git.harness.io/{account}/{org}/{repo}
  //   → https://app.harness.io/ng/account/{account}/module/code/orgs/{org}/repos/{repo}/commit/{sha}

  // Try project-level first (4 segments)
  const harnessProject = repoUrl.match(/git\.harness\.io\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)/);
  if (harnessProject) {
    const [, accountId, org, project, repo] = harnessProject;
    return `https://app.harness.io/ng/account/${accountId}/module/code/orgs/${org}/projects/${project}/repos/${repo}/commit/${sha}`;
  }

  // Try org-level (3 segments)
  const harnessOrg = repoUrl.match(/git\.harness\.io\/([^/]+)\/([^/]+)\/([^/]+)/);
  if (harnessOrg) {
    const [, accountId, org, repo] = harnessOrg;
    return `https://app.harness.io/ng/account/${accountId}/module/code/orgs/${org}/repos/${repo}/commit/${sha}`;
  }

  if (repoUrl.includes('gitlab'))    return `${repoUrl}/-/commit/${sha}`;
  if (repoUrl.includes('bitbucket')) return `${repoUrl}/commits/${sha}`;
  // GitHub and everything else
  return `${repoUrl}/commit/${sha}`;
}

export function shaMatch(localSha: string, triggerSha: string): boolean {
  if (!localSha || !triggerSha) return false;
  return localSha.startsWith(triggerSha) || triggerSha.startsWith(localSha);
}

export function extractTriggerShas(execution: {
  moduleInfo?: {
    ci?: {
      ciExecutionInfoDTO?: {
        branch?: { commits?: Array<{ id: string }> };
        pullRequest?: { commits?: Array<{ id: string }> };
        tag?: { commits?: Array<{ id: string }> };
        commits?: Array<{ id: string }>;
      };
      commits?: Array<{ id: string }>;
    };
    cd?: Record<string, unknown>;
  };
  gitInfo?: {
    commit?: string;
    commitId?: string;
    commits?: Array<{ id: string; commitId?: string }>;
  };
}): string[] {
  const shas: string[] = [];
  const push = (v: string | undefined) => { if (v?.trim()) shas.push(v.trim()); };

  const ci = execution.moduleInfo?.ci;
  if (ci) {
    const dto = ci.ciExecutionInfoDTO;
    dto?.branch?.commits?.forEach(c => push(c.id));
    dto?.pullRequest?.commits?.forEach(c => push(c.id));
    dto?.tag?.commits?.forEach(c => push(c.id));
    dto?.commits?.forEach(c => push(c.id));
    ci.commits?.forEach((c: { id: string }) => push(c.id));
  }

  const gi = execution.gitInfo;
  if (gi) {
    push(gi.commit);
    push(gi.commitId);
    gi.commits?.forEach(c => { push(c.id); push(c.commitId); });
  }

  return [...new Set(shas)];
}

export function executionMatchesSha(
  execution: Parameters<typeof extractTriggerShas>[0],
  localSha: string
): boolean {
  const shas = extractTriggerShas(execution);
  if (!shas.length) return false;
  return shas.some(s => shaMatch(localSha, s));
}
