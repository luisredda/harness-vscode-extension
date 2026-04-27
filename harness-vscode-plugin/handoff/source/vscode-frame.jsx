// VS Code context frame — activity bar, sidebar, editor area, status bar.

function VSCodeFrame({ panel, width = 1280, height = 780, projectName = 'payments-api', filename = 'tokenize.ts' }) {
  return (
    <div className="vsc" style={{ width, height }}>
      {/* Title bar */}
      <div className="vsc-title">
        <div className="vsc-traffic">
          <span style={{ background: '#ff5f57' }}/>
          <span style={{ background: '#febc2e' }}/>
          <span style={{ background: '#28c840' }}/>
        </div>
        <div className="vsc-title-center">{projectName} — Visual Studio Code</div>
        <div className="vsc-title-right"/>
      </div>

      {/* Main row */}
      <div className="vsc-row">
        {/* Activity bar */}
        <div className="vsc-activity">
          <button className="vsc-act" title="Explorer"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 6 L10 6 L12 8 L21 8 L21 19 L3 19 Z" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg></button>
          <button className="vsc-act" title="Search"><svg width="18" height="18" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M14 14 L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
          <button className="vsc-act" title="Source control"><svg width="18" height="18" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="18" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M6 8 L6 16 M7 7 Q16 8 16 11" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg></button>
          <button className="vsc-act" title="Run"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M7 5 L19 12 L7 19 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg></button>
          <button className="vsc-act" title="Extensions"><svg width="18" height="18" viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="13" y="13" width="8" height="8" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="3" y="13" width="8" height="8" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg></button>
          <button className="vsc-act on" title="Pipeline extension">
            <span className="vsc-act-mark"><BrandMark size={18} primary="currentColor"/></span>
          </button>
          <div className="vsc-act-spacer"/>
          <button className="vsc-act" title="Settings"><svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M12 2 L12 5 M12 19 L12 22 M2 12 L5 12 M19 12 L22 12 M5 5 L7 7 M17 17 L19 19 M5 19 L7 17 M17 7 L19 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
          <button className="vsc-act" title="Account"><svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="9" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M4 20 Q4 14 12 14 Q20 14 20 20" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg></button>
        </div>

        {/* Extension panel */}
        <div className="vsc-panel-col">
          {panel}
        </div>

        {/* Editor area */}
        <div className="vsc-editor">
          <div className="vsc-tabs">
            <div className="vsc-tab on">
              <span className="vsc-tab-ico ts">TS</span>
              {filename}
              <span className="vsc-tab-close">×</span>
            </div>
            <div className="vsc-tab">
              <span className="vsc-tab-ico spec">TS</span>
              payments.integration.spec.ts
              <span className="vsc-tab-dirty"/>
            </div>
          </div>
          <div className="vsc-code">
            <div className="vsc-gutter">
              {Array.from({length: 24}).map((_, i) => <div key={i} className="vsc-ln">{i+42}</div>)}
            </div>
            <pre className="vsc-src">{`import { stripe } from '../lib/stripe';
import type { Card, Token } from '../types';

export interface TokenizeResult {
  token: Token;
  last4: string;
  brand: string;
}

export async function tokenize(card: Card): Promise<TokenizeResult> {
  if (!card.number) {
    throw new Error('card.number is required');
  }

  const res = await stripe.tokens.create({
    card: {
      number: card.number,
      exp_month: card.expMonth,
      exp_year:  card.expYear,
      cvc:       card.cvc,
    },
  });

  return {
    token: res.id,
    last4: res.card.last4,
    brand: res.card.brand,
  };
}
`}</pre>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="vsc-status">
        <span className="vsc-stat-seg primary">
          <svg width="10" height="10" viewBox="0 0 12 12"><circle cx="3" cy="2.5" r="1.2" stroke="currentColor" strokeWidth="1.1" fill="none"/><circle cx="3" cy="9.5" r="1.2" stroke="currentColor" strokeWidth="1.1" fill="none"/><circle cx="9" cy="5" r="1.2" stroke="currentColor" strokeWidth="1.1" fill="none"/><path d="M3 3.8 L3 8.2 M3 5.5 Q3 5 3.5 5 L7.8 5" stroke="currentColor" strokeWidth="1.1" fill="none"/></svg>
          feat/retry-queue
        </span>
        <span className="vsc-stat-seg">
          <span className="vsc-stat-pipe-dot"/> Pipeline · running · 2m 14s
        </span>
        <span className="vsc-stat-spacer"/>
        <span className="vsc-stat-seg">TypeScript</span>
        <span className="vsc-stat-seg">UTF-8</span>
        <span className="vsc-stat-seg">Ln 47 · Col 12</span>
      </div>
    </div>
  );
}

window.VSCodeFrame = VSCodeFrame;
