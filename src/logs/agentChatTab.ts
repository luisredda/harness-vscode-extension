import * as vscode from 'vscode';
import { fetchStepLogs } from '../api/logService';
import { logger } from '../utils/logger';
import { stripAnsiFromLines } from '../utils/ansiStrip';

export interface AgentChatInfo {
  stepName: string;
  stageName: string;
  pipelineName: string;
  planExecutionId: string;
  logBaseKey: string;
  status: string;
  durationMs?: number;
  config: {
    baseUrl: string;
    accountIdentifier: string;
    orgIdentifier: string;
    projectIdentifier: string;
    apiKey: string;
  };
}

interface Turn {
  index: number;
  maxTurns: number;
  lines: string[];
  toolCalls: ToolCall[];
}

interface ToolCall {
  name: string;
  argsPreview: string;
  status: 'running' | 'done' | 'error';
}

// Detect if log lines look like a Harness AI agent execution
export function isAgentLog(lines: string[]): boolean {
  const first50 = lines.slice(0, 50).join('\n');
  return (
    /Running Harness AI agent/i.test(first50) ||
    /--- Turn \d+\/\d+ ---/.test(first50) ||
    /MCP servers:/i.test(first50)
  );
}

function parseAgentHeader(lines: string[]): { agentModel?: string; totalTurns?: number; mcpServers?: string[]; promptPreview?: string } {
  let agentModel: string | undefined;
  let totalTurns: number | undefined;
  const mcpServers: string[] = [];
  let promptPreview: string | undefined;

  for (const line of lines.slice(0, 20)) {
    const modelMatch = line.match(/AI agent\s*\(([^)]+)\)/i);
    if (modelMatch) agentModel = modelMatch[1];

    const turnsMatch = line.match(/max\s+(\d+)\s+turns/i);
    if (turnsMatch) totalTurns = parseInt(turnsMatch[1], 10);

    const mcpMatch = line.match(/MCP servers:\s*(.+)/i);
    if (mcpMatch) mcpServers.push(...mcpMatch[1].split(',').map(s => s.trim()));

    const promptMatch = line.match(/Prompt preview:\s*(.+)/i);
    if (promptMatch) promptPreview = promptMatch[1];
  }

  return { agentModel, totalTurns, mcpServers, promptPreview };
}

function parseTurns(lines: string[]): Turn[] {
  const turns: Turn[] = [];
  let currentTurn: Turn | null = null;
  let maxTurns = 150;

  const turnStart = /---\s*Turn\s*(\d+)\/(\d+)\s*---/i;
  const toolLine = /^\[([^\]]+)\]\s*(\{.*\}|\S.*?)\s*(done|error)?$/;
  const cleanLine = (raw: string): string => {
    // Strip ANSI, strip leading "linenum  timestamp  STATUS  " prefix from formatted logs
    return raw
      .replace(/^\s*\d+\s+\d{2}:\d{2}:\d{2}\s+(UNKNOWN|SUCCESS|ERROR|WARN|INFO|DEBUG)\s+/, '')
      .trim();
  };

  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    if (!line) continue;

    const turnMatch = line.match(turnStart);
    if (turnMatch) {
      if (currentTurn) turns.push(currentTurn);
      maxTurns = parseInt(turnMatch[2], 10);
      currentTurn = {
        index: parseInt(turnMatch[1], 10),
        maxTurns,
        lines: [],
        toolCalls: [],
      };
      continue;
    }

    if (!currentTurn) continue;

    const toolMatch = line.match(toolLine);
    if (toolMatch) {
      const name = toolMatch[1];
      const argsRaw = toolMatch[2] ?? '';
      const statusStr = toolMatch[3];
      let argsPreview = '';
      try {
        const parsed = JSON.parse(argsRaw) as Record<string, unknown>;
        // Show compact key preview
        argsPreview = Object.keys(parsed).slice(0, 3).map(k => {
          const v = parsed[k];
          const s = typeof v === 'string' ? v : JSON.stringify(v);
          return `${k}: ${s.substring(0, 40)}`;
        }).join(', ');
      } catch {
        argsPreview = argsRaw.substring(0, 60);
      }
      const tcStatus: ToolCall['status'] = statusStr === 'done' ? 'done' : statusStr === 'error' ? 'error' : 'running';
      currentTurn.toolCalls.push({ name, argsPreview, status: tcStatus });
      continue;
    }

    // Regular narration line
    if (line.length > 0) {
      currentTurn.lines.push(line);
    }
  }

  if (currentTurn) turns.push(currentTurn);
  return turns;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildHtml(panel: vscode.WebviewPanel, info: AgentChatInfo, lines: string[], isLive: boolean): string {
  const clean = stripAnsiFromLines(lines);
  const header = parseAgentHeader(clean);
  const turns = parseTurns(clean);

  const statusIcon = info.status === 'SUCCESS' ? '✓'
    : info.status === 'FAILED' ? '✗'
    : info.status === 'RUNNING' ? '▶'
    : info.status === 'IGNOREFAILED' ? '⚠' : '–';

  const nonce = Math.random().toString(36).substring(2);

  const csp = `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';`;

  const totalTurnsLabel = header.totalTurns ? `/ ${header.totalTurns}` : '';
  const mcpLabel = header.mcpServers?.length
    ? `<span class="meta-chip">${escHtml(header.mcpServers.join(', '))}</span>` : '';
  const modelLabel = header.agentModel
    ? `<span class="meta-chip model">${escHtml(header.agentModel)}</span>` : '';

  const turnsHtml = turns.map(t => {
    const toolsHtml = t.toolCalls.map(tc => {
      const cls = tc.status === 'done' ? 'tc-done' : tc.status === 'error' ? 'tc-err' : 'tc-run';
      const icon = tc.status === 'done' ? '✓' : tc.status === 'error' ? '✗' : '…';
      return `<span class="tc ${cls}" title="${escHtml(tc.argsPreview)}">${icon} ${escHtml(tc.name)}</span>`;
    }).join('');

    const narrationHtml = t.lines
      .filter(l => l.length > 0)
      .map(l => `<p class="narration">${escHtml(l)}</p>`)
      .join('');

    const hasContent = t.lines.length > 0 || t.toolCalls.length > 0;
    if (!hasContent) return '';

    return `<div class="turn">
      <div class="turn-hdr">
        <span class="turn-num">Turn ${t.index}${totalTurnsLabel}</span>
        ${toolsHtml ? `<div class="turn-tools">${toolsHtml}</div>` : ''}
      </div>
      ${narrationHtml ? `<div class="turn-body">${narrationHtml}</div>` : ''}
    </div>`;
  }).filter(Boolean).join('');

  const promptHtml = header.promptPreview
    ? `<div class="prompt-preview">
        <span class="prompt-label">Prompt</span>
        <span class="prompt-text">${escHtml(header.promptPreview)}${header.promptPreview.length >= 100 ? '…' : ''}</span>
      </div>` : '';

  const liveIndicator = isLive
    ? `<span class="live-dot" title="Live — updates every 5s"></span><span class="live-label">Live</span>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(info.stepName)} — Agent</title>
<style nonce="${nonce}">
  :root {
    --bg: var(--vscode-editor-background, #1e1e1e);
    --fg: var(--vscode-editor-foreground, #d4d4d4);
    --fg-muted: var(--vscode-descriptionForeground, #888);
    --border: var(--vscode-panel-border, #3c3c3c);
    --accent: var(--vscode-focusBorder, #007acc);
    --card-bg: var(--vscode-editorWidget-background, #252526);
    --chip-bg: var(--vscode-badge-background, #4d4d4d);
    --chip-fg: var(--vscode-badge-foreground, #fff);
    --green: #4caf50;
    --red: #f44336;
    --amber: #ff9800;
    --blue: #2196f3;
    font-family: var(--vscode-font-family, 'Segoe UI', sans-serif);
    font-size: var(--vscode-font-size, 13px);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--fg); padding: 16px 20px; line-height: 1.5; }

  .header {
    display: flex; align-items: flex-start; gap: 10px;
    border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px;
  }
  .header-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
  .header-body { flex: 1; min-width: 0; }
  .header-title { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .header-title .status-icon { font-size: 13px; }
  .header-breadcrumb { font-size: 11px; color: var(--fg-muted); margin-bottom: 4px; }
  .header-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; align-items: center; }
  .meta-chip {
    background: var(--chip-bg); color: var(--chip-fg);
    padding: 1px 7px; border-radius: 10px; font-size: 11px; white-space: nowrap;
  }
  .meta-chip.model { background: var(--accent); opacity: 0.9; }
  .live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: var(--green);
    display: inline-block; animation: pulse 1.5s infinite;
  }
  .live-label { font-size: 11px; color: var(--green); }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .prompt-preview {
    background: var(--card-bg); border: 1px solid var(--border);
    border-radius: 6px; padding: 8px 12px; margin-bottom: 16px;
    display: flex; gap: 8px; align-items: baseline;
  }
  .prompt-label { font-size: 11px; color: var(--fg-muted); white-space: nowrap; font-weight: 600; }
  .prompt-text { font-size: 12px; color: var(--fg-muted); font-style: italic; }

  .turns { display: flex; flex-direction: column; gap: 12px; }

  .turn {
    background: var(--card-bg); border: 1px solid var(--border);
    border-radius: 8px; overflow: hidden;
  }
  .turn-hdr {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    padding: 7px 12px; border-bottom: 1px solid var(--border);
    background: rgba(255,255,255,0.03);
  }
  .turn-num { font-size: 11px; font-weight: 700; color: var(--fg-muted); white-space: nowrap; }
  .turn-tools { display: flex; gap: 5px; flex-wrap: wrap; }

  .tc {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 1px 7px; border-radius: 10px; font-size: 11px;
    cursor: default; border: 1px solid transparent;
  }
  .tc-done { background: rgba(76,175,80,0.12); color: var(--green); border-color: rgba(76,175,80,0.25); }
  .tc-err  { background: rgba(244,67,54,0.12);  color: var(--red);   border-color: rgba(244,67,54,0.25); }
  .tc-run  { background: rgba(33,150,243,0.12); color: var(--blue);  border-color: rgba(33,150,243,0.25); }

  .turn-body { padding: 10px 12px; }
  .narration { font-size: 13px; line-height: 1.6; color: var(--fg); }
  .narration + .narration { margin-top: 4px; }

  .empty { color: var(--fg-muted); font-size: 13px; padding: 24px 0; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div class="header-icon">⬡</div>
  <div class="header-body">
    <div class="header-breadcrumb">${escHtml(info.pipelineName)} › ${escHtml(info.stageName)}</div>
    <div class="header-title">
      <span>${escHtml(info.stepName)}</span>
      <span class="status-icon">${statusIcon}</span>
    </div>
    <div class="header-meta">
      ${modelLabel}
      ${mcpLabel}
      ${info.durationMs ? `<span class="meta-chip">${(info.durationMs / 1000).toFixed(1)}s</span>` : ''}
      <span class="meta-chip">${turns.length} turn${turns.length !== 1 ? 's' : ''}</span>
      ${liveIndicator}
    </div>
  </div>
</div>

${promptHtml}

<div class="turns">
${turnsHtml || '<div class="empty">No agent turns parsed yet…</div>'}
</div>
</body>
</html>`;
}

const activePanels = new Map<string, vscode.WebviewPanel>();

export async function openAgentChatTab(info: AgentChatInfo): Promise<void> {
  logger.debug('AgentChatTab', 'Opening agent chat for:', { stepName: info.stepName, logBaseKey: info.logBaseKey });

  const panelKey = `${info.planExecutionId}/${info.stageName}/${info.stepName}`;

  // Reuse existing panel if open
  const existing = activePanels.get(panelKey);
  if (existing) {
    existing.reveal(vscode.ViewColumn.Two, true);
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    'harnessAgentChat',
    `⬡ ${info.stepName}`,
    { viewColumn: vscode.ViewColumn.Two, preserveFocus: true },
    { enableScripts: true, retainContextWhenHidden: true }
  );

  activePanels.set(panelKey, panel);
  panel.onDidDispose(() => activePanels.delete(panelKey));

  const isLive = info.status === 'RUNNING' || info.status === 'ASYNC_WAITING';
  let pollingActive = isLive;
  let pollTimer: ReturnType<typeof setTimeout> | undefined;

  const refresh = async (): Promise<void> => {
    try {
      const lines = await fetchStepLogs(info.config as any, info.logBaseKey);
      if (lines.length > 0 && !panel.disposed) {
        const currentLive = pollingActive && (info.status === 'RUNNING' || info.status === 'ASYNC_WAITING');
        panel.webview.html = buildHtml(panel, info, lines, currentLive);
      }
    } catch (err) {
      logger.debug('AgentChatTab', 'Poll fetch error:', err);
    }
  };

  // Initial render with loading state
  panel.webview.html = buildHtml(panel, info, [], isLive);

  // Fetch initial logs
  try {
    const lines = await fetchStepLogs(info.config as any, info.logBaseKey);
    if (lines.length > 0 && !panel.disposed) {
      panel.webview.html = buildHtml(panel, info, lines, isLive);
    }
  } catch (err) {
    logger.debug('AgentChatTab', 'Initial fetch error:', err);
  }

  // Poll while live
  if (isLive) {
    const schedulePoll = (): void => {
      if (!pollingActive || panel.disposed) return;
      pollTimer = setTimeout(async () => {
        await refresh();
        schedulePoll();
      }, 5000);
    };
    schedulePoll();

    panel.onDidDispose(() => {
      pollingActive = false;
      if (pollTimer) clearTimeout(pollTimer);
    });
  }
}

export function updateAgentChatStatus(planExecutionId: string, stageName: string, stepName: string, newStatus: string): void {
  const panelKey = `${planExecutionId}/${stageName}/${stepName}`;
  const panel = activePanels.get(panelKey);
  if (!panel) return;
  // If terminal status received, stop polling on next cycle
  const terminalStatuses = new Set(['SUCCESS', 'FAILED', 'ABORTED', 'SKIPPED', 'EXPIRED', 'IGNOREFAILED']);
  if (terminalStatuses.has(newStatus.toUpperCase())) {
    logger.debug('AgentChatTab', 'Stopping poll for terminal status:', newStatus);
  }
}
