// AI Integration UI — states for the Harness MCP flow
// Each component is an isolated state of the AI bar inside the pipeline panel.

const { useState: useAIState } = React;

// ── Tool glyphs (abstract, non-branded) ────────────────────────
const ToolGlyph = {
  claudeCli: () => (
    <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden>
      <rect x="1.5" y="2.5" width="11" height="9" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M3.8 6 L5.5 7.5 L3.8 9 M6.5 9 L9.5 9" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  claudeExt: () => (
    <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden>
      <path d="M7 1.5 L11.5 4 L11.5 10 L7 12.5 L2.5 10 L2.5 4 Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="7" cy="7" r="1.6" fill="currentColor"/>
    </svg>
  ),
  cursor: () => (
    <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden>
      <path d="M2.5 2 L11.5 7 L7 7.8 L5.8 12 Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  windsurf: () => (
    <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden>
      <path d="M2 5 Q5 3 7 5 Q9 7 12 5 M2 8 Q5 6 7 8 Q9 10 12 8 M2 11 Q5 9 7 11 Q9 13 12 11" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    </svg>
  ),
};

const TOOL_META = {
  'claudecode-cli': { name: 'Claude Code', sub: 'CLI', glyph: ToolGlyph.claudeCli },
  'claudecode-ext': { name: 'Claude Code', sub: 'Extension', glyph: ToolGlyph.claudeExt },
  'cursor':         { name: 'Cursor',      sub: null,         glyph: ToolGlyph.cursor },
  'windsurf':       { name: 'Windsurf',    sub: null,         glyph: ToolGlyph.windsurf },
};

// ── Small reusable bits ───────────────────────────────────────
function SendIco() {
  return <svg width="11" height="11" viewBox="0 0 12 12"><path d="M6 10 L6 2 M3 5 L6 2 L9 5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function SparkIco() {
  return <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 1 L6.9 4.6 L10.5 5.5 L6.9 6.4 L6 10 L5.1 6.4 L1.5 5.5 L5.1 4.6 Z" fill="currentColor"/></svg>;
}
function ChevDown() {
  return <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 3 L4 5.5 L6.5 3" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function Dot({ state }) {
  return <span className={`ai-dot ai-dot-${state}`} aria-hidden/>;
}

// ── Tool badge ────────────────────────────────────────────────
function ToolBadge({ toolId, multi, warn, compact }) {
  const meta = TOOL_META[toolId];
  if (!meta) {
    return (
      <div className="ai-badge is-warn">
        <svg width="11" height="11" viewBox="0 0 12 12"><path d="M6 1.5 L11 10 L1 10 Z M6 5 L6 7.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"/><circle cx="6" cy="8.7" r="0.55" fill="currentColor"/></svg>
        <span>No AI tool</span>
      </div>
    );
  }
  const Glyph = meta.glyph;
  return (
    <button className={`ai-badge ${warn?'is-warn':''} ${compact?'is-compact':''}`}>
      <Glyph/>
      {!compact && <span className="ai-badge-name">{meta.name}</span>}
      {multi && <span className="ai-badge-chev"><ChevDown/></span>}
    </button>
  );
}

// ── The AI bar (input + status bar) ───────────────────────────
function AIBar({
  state = 'ready',           // detecting | none | unconfigured | ready | sending | error
  toolId = 'claudecode-cli',
  multi = false,
  value = '',
  showStatus = true,
  overlay = null,            // inline MCP-setup card or response panel mounted above
  placeholder,
  onActivity,
}) {
  const meta = TOOL_META[toolId];
  const placeholders = {
    detecting:    'Detecting AI tools…',
    none:         'Install Claude Code to ask questions',
    unconfigured: 'Configure MCP to ask questions',
    ready:        'Ask about this pipeline…',
    sending:      'Thinking…',
    error:        'Ask about this pipeline…',
  };
  const inputDisabled = state === 'detecting' || state === 'none' || state === 'sending';
  const sendDisabled  = inputDisabled || !value;

  const statusLine = () => {
    switch (state) {
      case 'detecting':
        return { dot: 'pulse', text: 'Detecting AI tools…' };
      case 'none':
        return { dot: 'err', text: 'No AI tool found', link: 'Install Claude Code ↗' };
      case 'unconfigured':
        return { dot: 'warn', text: `MCP not configured · ${meta?.name}`, link: 'Configure MCP ›' };
      case 'ready':
        return { dot: 'ok', text: `MCP ready · ${meta?.name}${meta?.sub?` (${meta.sub})`:''}` };
      case 'sending':
        return { dot: 'pulse', text: `Querying ${meta?.name}…` };
      case 'error':
        return { dot: 'err', text: 'Request failed', link: 'Retry' };
    }
    return { dot: 'ok', text: '' };
  };
  const s = statusLine();

  return (
    <div className={`aix aix-${state}`}>
      {overlay}
      <div className="aix-bar">
        {state !== 'none' && state !== 'detecting' && (
          <ToolBadge toolId={toolId} multi={multi} warn={state==='unconfigured'}/>
        )}
        {state === 'detecting' && (
          <div className="aix-detect">
            <span className="aix-spinner"/>
          </div>
        )}
        {state === 'none' && <ToolBadge toolId={null}/>}
        <input
          className="aix-inp"
          placeholder={placeholder || placeholders[state]}
          value={value}
          disabled={inputDisabled}
          readOnly
        />
        <button className="aix-send" disabled={sendDisabled}>
          {state === 'sending'
            ? <span className="aix-send-spin"/>
            : <SendIco/>}
        </button>
      </div>
      {showStatus && (
        <div className="aix-status">
          <Dot state={s.dot}/>
          <span className="aix-status-txt">{s.text}</span>
          {s.link && (
            <button className={`aix-status-link ${state==='unconfigured'?'is-primary':''}`}>
              {s.link}
            </button>
          )}
          {onActivity && <span className="aix-status-meta">{onActivity}</span>}
        </div>
      )}
    </div>
  );
}

// ── Inline MCP configure card (overlay) ───────────────────────
function MCPConfigureCard({ toolId = 'claudecode-cli', busy = false, done = false }) {
  const meta = TOOL_META[toolId];
  const Glyph = meta.glyph;
  if (done) {
    return (
      <div className="aix-overlay aix-overlay-done">
        <span className="aix-overlay-check">
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6.2 L5 8.5 L9.5 3.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
        <div className="aix-overlay-done-text">
          <strong>Harness MCP configured for {meta.name}.</strong>
          <span>Restart {meta.name} to activate.</span>
        </div>
        <button className="aix-overlay-x" aria-label="Dismiss">
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 2 L8 8 M8 2 L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
        </button>
      </div>
    );
  }
  return (
    <div className="aix-overlay aix-overlay-setup">
      <div className="aix-setup-hdr">
        <span className="aix-setup-glyph"><Glyph/></span>
        <div className="aix-setup-title">
          <strong>Configure Harness MCP</strong>
          <span>Lets {meta.name} fetch pipeline data, logs &amp; executions.</span>
        </div>
        <button className="aix-overlay-x" aria-label="Dismiss">
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 2 L8 8 M8 2 L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
        </button>
      </div>
      <div className="aix-setup-meta">
        <div className="aix-setup-row">
          <span className="aix-setup-k">Writes to</span>
          <code className="aix-setup-v mono">~/.claude.json</code>
        </div>
        <div className="aix-setup-row">
          <span className="aix-setup-k">Auth</span>
          <span className="aix-setup-v">Uses your stored Harness PAT</span>
        </div>
      </div>
      <div className="aix-setup-acts">
        <button className={`aix-btn-primary ${busy?'is-busy':''}`} disabled={busy}>
          {busy
            ? <><span className="aix-send-spin"/> Configuring…</>
            : <>Configure automatically</>}
        </button>
        <button className="aix-btn-ghost">Not now</button>
      </div>
    </div>
  );
}

// ── Tool picker (expanded from badge) ─────────────────────────
function ToolPicker({ toolId, installed }) {
  return (
    <div className="aix-picker">
      <div className="aix-picker-head">Choose AI tool</div>
      {installed.map(t => {
        const m = TOOL_META[t.id];
        const G = m.glyph;
        return (
          <button key={t.id} className={`aix-picker-item ${toolId===t.id?'on':''}`}>
            <span className="aix-picker-ico"><G/></span>
            <span className="aix-picker-text">
              <span className="aix-picker-name">
                {m.name}
                {m.sub && <span className="aix-picker-sub">{m.sub}</span>}
              </span>
              <span className={`aix-picker-status is-${t.mcpReady?'ok':'warn'}`}>
                <Dot state={t.mcpReady?'ok':'warn'}/>
                {t.mcpReady ? 'MCP ready' : 'MCP not configured'}
              </span>
            </span>
            {toolId===t.id && <span className="aix-picker-check">
              <svg width="11" height="11" viewBox="0 0 12 12"><path d="M2.5 6.2 L5 8.5 L9.5 3.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>}
          </button>
        );
      })}
      <div className="aix-picker-foot">
        <span className="aix-picker-foot-k">Priority</span>
        <span className="aix-picker-foot-v mono">CLI › Ext › Cursor › Windsurf</span>
      </div>
    </div>
  );
}

// ── Response panel (CLI subprocess result) ────────────────────
function ResponsePanel({ variant = 'cli' }) {
  if (variant === 'launched') {
    return (
      <div className="aix-overlay aix-overlay-launched">
        <span className="aix-overlay-check is-accent">
          <svg width="11" height="11" viewBox="0 0 12 12"><path d="M3 3 L7 3 L7 7 M7 3 L3 7" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
        <div className="aix-overlay-done-text">
          <strong>Opened in Claude Code</strong>
          <span>Continue the conversation there. Dismissing in 3s…</span>
        </div>
      </div>
    );
  }
  if (variant === 'clipboard') {
    return (
      <div className="aix-overlay aix-overlay-launched">
        <span className="aix-overlay-check is-accent">
          <svg width="11" height="11" viewBox="0 0 12 12"><rect x="3" y="2" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M5 1 L7 1 L7 3 L5 3 Z" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
        </span>
        <div className="aix-overlay-done-text">
          <strong>Prompt copied to clipboard</strong>
          <span>Paste it in Windsurf Cascade to investigate.</span>
        </div>
      </div>
    );
  }
  return (
    <div className="aix-response">
      <div className="aix-response-hdr">
        <span className="aix-response-tool">
          <ToolGlyph.claudeCli/>
          <span>Claude Code</span>
          <span className="aix-response-meta">· 4 MCP calls · 8.2s</span>
        </span>
        <button className="aix-response-close" aria-label="Close">
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 2 L8 8 M8 2 L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
        </button>
      </div>
      <div className="aix-response-body">
        <p>The integration test <code className="mono">tokenizes card numbers</code> failed in stage <strong>Test &amp; Scan</strong> (exit 1).</p>
        <p className="aix-response-lead">Root cause:</p>
        <ul>
          <li><code className="mono">tokenize()</code> in <code className="mono">src/payments/tokenize.ts:47</code> dereferences <code className="mono">response.token</code> when the Stripe mock returns <code className="mono">{'{ error }'}</code>.</li>
          <li>3 downstream cases cascade from the same null.</li>
        </ul>
        <p className="aix-response-lead">Suggested fix:</p>
        <pre className="aix-response-code mono">{`if (!response?.token) {
  throw new TokenizeError(response?.error);
}`}</pre>
        <div className="aix-response-tools">
          <span className="aix-tool-call">harness_get · execution_log</span>
          <span className="aix-tool-call">harness_get · step_output</span>
          <span className="aix-tool-call">read_file · tokenize.ts</span>
        </div>
      </div>
      <div className="aix-response-foot">
        <button className="aix-chip">Open in Claude Code ↗</button>
        <button className="aix-chip">Copy answer</button>
        <button className="aix-chip">Re-run</button>
      </div>
    </div>
  );
}

// ── Mini panel frame — reuses the panel look without pulling all of panel.jsx
function MiniPanel({ title = 'payments-api · deploy', status = 'failed', children, footerOnly = false }) {
  const label = {running:'Running', failed:'Failed', ok:'Passed', waiting:'Waiting'}[status] || status;
  return (
    <div className="ai-mini panel">
      {/* Header */}
      <div className="ai-mini-hdr">
        <div className="ai-mini-brand">
          <span className="ai-mini-mark"/>
          <span>Pipeline</span>
        </div>
        <span className="ai-mini-ctx mono">acme / payments</span>
      </div>
      {!footerOnly && (
        <>
          {/* Pipeline card */}
          <div className={`ai-mini-card is-${status}`}>
            <div className="ai-mini-card-top">
              <span className="ai-mini-name">{title}</span>
              <span className={`ai-mini-badge is-${status}`}>{label}</span>
            </div>
            <div className="ai-mini-card-meta mono">
              <span className="ai-mini-run">#4715</span>
              <span className="ai-mini-sep">·</span>
              <span>2m 14s</span>
              <span className="ai-mini-sep">·</span>
              <span>feat/card-tokens</span>
            </div>
          </div>
          {/* Stage list */}
          <div className="ai-mini-stages">
            {[
              {n:'Checkout & Install', s:'ok'},
              {n:'Build',              s:'ok'},
              {n:'Test & Scan',        s: status==='failed'?'failed':'running'},
              {n:'Deploy → Staging',   s:'pending'},
            ].map((r,i)=>(
              <div key={i} className="ai-mini-stage">
                <span className={`ai-mini-rail is-${r.s}`}/>
                <span className="ai-mini-stage-name">{r.n}</span>
              </div>
            ))}
          </div>
          {/* Error banner when failed */}
          {status === 'failed' && (
            <div className="ai-mini-err">
              <svg width="11" height="11" viewBox="0 0 12 12"><path d="M6 1 L11 10 L1 10 Z" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M6 5 L6 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="6" cy="8.6" r="0.5" fill="currentColor"/></svg>
              <span>integration tests failed · 4 tests in tokenize</span>
            </div>
          )}
        </>
      )}
      <div className="ai-mini-spacer"/>
      {children}
    </div>
  );
}

window.AIBar = AIBar;
window.MCPConfigureCard = MCPConfigureCard;
window.ToolPicker = ToolPicker;
window.ResponsePanel = ResponsePanel;
window.MiniPanel = MiniPanel;
window.TOOL_META = TOOL_META;
window.ToolGlyph = ToolGlyph;
