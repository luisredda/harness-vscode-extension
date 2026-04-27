// PipelineCI extension panel — original design, placeholder brand.
// Self-contained React component; attaches to window.PipelinePanel.

const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────────
// Brand mark — abstract pipeline glyph (nodes + flow)
// ─────────────────────────────────────────────────────────────
function BrandMark({ size = 18, primary = 'var(--accent)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="4" cy="4" r="2.2" fill={primary} />
      <circle cx="16" cy="4" r="2.2" fill={primary} opacity="0.55" />
      <circle cx="10" cy="10" r="2.2" fill={primary} />
      <circle cx="4" cy="16" r="2.2" fill={primary} opacity="0.55" />
      <circle cx="16" cy="16" r="2.2" fill={primary} />
      <path d="M4 4 L10 10 M16 4 L10 10 M10 10 L4 16 M10 10 L16 16" stroke={primary} strokeWidth="1" opacity="0.35" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Inline icons (stroke-based, 14px)
// ─────────────────────────────────────────────────────────────
const Ico = {
  chev:    (r=0) => <svg width="10" height="10" viewBox="0 0 10 10" style={{transform:`rotate(${r}deg)`, transition:'transform .15s'}}><path d="M3 2 L6 5 L3 8" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check:   () => <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6.2 L5 8.5 L9.5 3.8" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  x:       () => <svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 3 L9 9 M9 3 L3 9" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg>,
  dot:     () => <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="2.5" fill="currentColor"/></svg>,
  ring:    () => <svg width="12" height="12" viewBox="0 0 12 12" style={{animation:'spin 1.2s linear infinite'}}><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeDasharray="6 14" strokeLinecap="round"/></svg>,
  pause:   () => <svg width="10" height="10" viewBox="0 0 10 10"><rect x="3" y="2" width="1.5" height="6" fill="currentColor"/><rect x="5.5" y="2" width="1.5" height="6" fill="currentColor"/></svg>,
  warn:    () => <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 1 L11 10 L1 10 Z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/><path d="M6 5 L6 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="6" cy="8.8" r="0.6" fill="currentColor"/></svg>,
  ext:     () => <svg width="10" height="10" viewBox="0 0 10 10"><path d="M3 3 L7 3 L7 7 M7 3 L3 7" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  refresh: () => <svg width="12" height="12" viewBox="0 0 12 12"><path d="M10 6 A4 4 0 1 1 6 2 L8.5 2 M8.5 2 L8.5 4.5 M8.5 2 L6.2 4.2" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  pin:     (on=false) => <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 1.5 L9 4.5 L7.5 6 L9 9 L3 9 L4.5 6 L3 4.5 Z M6 9 L6 11" stroke="currentColor" strokeWidth="1.2" fill={on?'currentColor':'none'} strokeLinejoin="round"/></svg>,
  send:    () => <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1.5 6 L10.5 2 L8 10 L6 7 L1.5 6 Z" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.15" strokeLinejoin="round"/></svg>,
  cmd:     () => <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1.5" y="1.5" width="9" height="9" rx="1.2" stroke="currentColor" strokeWidth="1" fill="none"/><path d="M3.5 5 L5.5 7 M5.5 5 L3.5 7 M7 4 L9 4 M7 8 L9 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>,
  menu:    () => <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="3" cy="7" r="1.1" fill="currentColor"/><circle cx="7" cy="7" r="1.1" fill="currentColor"/><circle cx="11" cy="7" r="1.1" fill="currentColor"/></svg>,
  branch:  () => <svg width="11" height="11" viewBox="0 0 12 12"><circle cx="3" cy="2.5" r="1.2" stroke="currentColor" strokeWidth="1.1" fill="none"/><circle cx="3" cy="9.5" r="1.2" stroke="currentColor" strokeWidth="1.1" fill="none"/><circle cx="9" cy="5" r="1.2" stroke="currentColor" strokeWidth="1.1" fill="none"/><path d="M3 3.8 L3 8.2 M3 5.5 Q3 5 3.5 5 L7.8 5" stroke="currentColor" strokeWidth="1.1" fill="none"/></svg>,
  flask:   () => <svg width="12" height="12" viewBox="0 0 12 12"><path d="M4.5 1.5 L4.5 4.5 L2 9.5 Q2 10.5 3 10.5 L9 10.5 Q10 10.5 10 9.5 L7.5 4.5 L7.5 1.5 M4 1.5 L8 1.5" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinejoin="round"/></svg>,
  shield:  () => <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 1 L10 2.5 L10 6 Q10 9 6 11 Q2 9 2 6 L2 2.5 Z" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinejoin="round"/></svg>,
  stack:   () => <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 1.5 L10.5 3.5 L6 5.5 L1.5 3.5 Z M1.5 6 L6 8 L10.5 6 M1.5 8.5 L6 10.5 L10.5 8.5" stroke="currentColor" strokeWidth="1" fill="none" strokeLinejoin="round"/></svg>,
  spark:   () => <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 1.5 L7 5 L10.5 6 L7 7 L6 10.5 L5 7 L1.5 6 L5 5 Z" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.2" strokeLinejoin="round"/></svg>,
  list:    () => <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 3 L10 3 M2 6 L10 6 M2 9 L10 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  clock:   () => <svg width="11" height="11" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.1" fill="none"/><path d="M6 3.5 L6 6 L8 7.5" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round"/></svg>,
  user:    () => <svg width="11" height="11" viewBox="0 0 12 12"><circle cx="6" cy="4" r="2" stroke="currentColor" strokeWidth="1.1" fill="none"/><path d="M2 10.5 Q2 7.5 6 7.5 Q10 7.5 10 10.5" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round"/></svg>,
  gitpr:   () => <svg width="11" height="11" viewBox="0 0 12 12"><circle cx="3" cy="2.8" r="1.2" stroke="currentColor" strokeWidth="1.1" fill="none"/><circle cx="3" cy="9.2" r="1.2" stroke="currentColor" strokeWidth="1.1" fill="none"/><circle cx="9" cy="9.2" r="1.2" stroke="currentColor" strokeWidth="1.1" fill="none"/><path d="M3 4 L3 8" stroke="currentColor" strokeWidth="1.1"/><path d="M9 4.5 L9 8 M9 4.5 Q9 3 7.5 3 L6 3 M6 3 L7 2 M6 3 L7 4" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  commit:  () => <svg width="11" height="11" viewBox="0 0 12 12"><circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.1" fill="none"/><path d="M1.5 6 L4 6 M8 6 L10.5 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
};

// ─────────────────────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────────────────────
function statusIcon(s) {
  switch(s) {
    case 'ok':      return <span className="st-ok"><Ico.check/></span>;
    case 'failed':  return <span className="st-err"><Ico.x/></span>;
    case 'running': return <span className="st-run"><Ico.ring/></span>;
    case 'warn':    return <span className="st-warn"><Ico.warn/></span>;
    case 'waiting': return <span className="st-wait"><Ico.pause/></span>;
    case 'pending': return <span className="st-pend"><Ico.dot/></span>;
    default:        return <span className="st-pend"><Ico.dot/></span>;
  }
}
function statusLabel(s) {
  return {ok:'Success', failed:'Failed', running:'Running', warn:'Warning', waiting:'Awaiting approval', pending:'Pending'}[s] || s;
}

// ─────────────────────────────────────────────────────────────
// Fixture data — 4 scenarios
// ─────────────────────────────────────────────────────────────
const SCENARIOS = {
  running: {
    pipeline: 'payments-api · deploy',
    status: 'running',
    duration: '2m 14s',
    branch: 'feat/retry-queue',
    sha: 'a9f3cd2',
    author: 'eli chen',
    time: '14 min ago',
    commit: 'refactor retry queue with exponential backoff',
    runId: '#4721',
    trigger: 'eli chen',
    triggerKind: 'user',
    pr: 284,
    stages: [
      {id:'s1', name:'Checkout & Install', status:'ok', duration:'38s', steps:[
        {id:'s1-1', name:'git checkout', status:'ok', duration:'2s'},
        {id:'s1-2', name:'npm ci', status:'ok', duration:'36s'},
      ]},
      {id:'s2', name:'Build', status:'ok', duration:'52s', steps:[
        {id:'s2-1', name:'tsc --build', status:'ok', duration:'18s'},
        {id:'s2-2', name:'bundle (esbuild)', status:'ok', duration:'11s'},
        {id:'s2-3', name:'docker build', status:'ok', duration:'23s'},
      ]},
      {id:'s3', name:'Test & Scan', status:'running', duration:'44s', active:true, steps:[
        {id:'s3-1', name:'unit tests (jest)', status:'ok', duration:'18s'},
        {id:'s3-2', name:'integration tests', status:'running', duration:'26s'},
        {id:'s3-3', name:'security scan', status:'pending'},
        {id:'s3-4', name:'license check', status:'pending'},
      ]},
      {id:'s4', name:'Deploy → Staging', status:'pending', steps:[
        {id:'s4-1', name:'helm upgrade', status:'pending'},
        {id:'s4-2', name:'smoke test', status:'pending'},
      ]},
      {id:'s5', name:'Deploy → Production', status:'pending', steps:[]},
    ],
    policy: {passed: 11, warning: 2, errored: 0},
    modules: [
      {tag:'CI',  val:'3 of 4 stages complete', kind:'info'},
      {tag:'CD',  val:'staging ready · prod pending', kind:'muted'},
      {tag:'SEC', val:'scan running…', kind:'info'},
      {tag:'QA',  val:'142 passed · 3 flaky', kind:'warn'},
    ],
    build: [
      { stageId:'s1', stageName:'Checkout & Install', repo:'acme/payments-api', branches:{source:'feat/retry-queue', dest:'main'}, pr:284, commits:[
        {sha:'a9f3cd2', msg:'refactor retry queue with exponential backoff', author:'eli chen'},
        {sha:'78b1ef0', msg:'add jitter to backoff calc', author:'eli chen'},
      ], timeSaved:'42s cache hit', artifacts:[] },
      { stageId:'s2', stageName:'Build', repo:'acme/payments-api', branches:{source:'feat/retry-queue', dest:'main'}, pr:284, commits:[
        {sha:'a9f3cd2', msg:'refactor retry queue with exponential backoff', author:'eli chen'},
      ], timeSaved:'1m 18s layer cache', artifacts:[
        {name:'payments-api', type:'docker', version:'sha-a9f3cd2', size:'142 MB', registry:'ghcr.io/acme'},
        {name:'bundle.js',    type:'file',   version:'—', size:'3.8 MB', registry:'s3://acme-artifacts'},
      ]},
      { stageId:'s3', stageName:'Test & Scan', repo:'acme/payments-api', branches:{source:'feat/retry-queue', dest:'main'}, pr:284, commits:[
        {sha:'a9f3cd2', msg:'refactor retry queue with exponential backoff', author:'eli chen'},
      ], timeSaved:null, artifacts:[
        {name:'junit-report.xml', type:'file', version:'—', size:'214 KB', registry:'s3://acme-artifacts'},
      ]},
    ],
    deploy: [
      { stageId:'s4', stageName:'Deploy → Staging', status:'pending',
        services:[{name:'payments-api', version:'sha-a9f3cd2', delta:'+0.3%', kind:'rolling'}],
        envs:[{name:'staging-us-east', cluster:'eks-stg', region:'us-east-1', url:'staging.payments.internal', status:'pending'}] },
      { stageId:'s5', stageName:'Deploy → Production', status:'pending',
        services:[{name:'payments-api', version:'sha-a9f3cd2', delta:null, kind:'rolling'}],
        envs:[
          {name:'prod-us-east', cluster:'eks-prod-use1', region:'us-east-1', url:'api.payments.acme.com', status:'pending'},
          {name:'prod-eu-west', cluster:'eks-prod-euw1', region:'eu-west-1', url:'api-eu.payments.acme.com', status:'pending'},
        ]},
    ],
    security: {
      scanId:'STO-4721-001',
      critical:{ total:3,  new:1 },
      high:    { total:11, new:4 },
      medium:  { total:24, new:2 },
      low:     { total:38, new:0 },
      info:    { total:52, new:0 },
      exempted:{ total:6,  new:0 },
      running:true,
      tools:['Snyk','Trivy','Semgrep'],
    },
    logs: {
      stepId: 's3-2',
      stepName: 'integration tests',
      lines: [
        {ts:'14:02:11', lvl:'info',  txt:'PASS  test/user.integration.spec.ts'},
        {ts:'14:02:14', lvl:'info',  txt:'PASS  test/session.integration.spec.ts'},
        {ts:'14:02:18', lvl:'info',  txt:'PASS  test/billing.integration.spec.ts'},
        {ts:'14:02:22', lvl:'warn',  txt:'retry queue: 1 transient failure on run 4'},
        {ts:'14:02:25', lvl:'info',  txt:'RUNS  test/payments.integration.spec.ts'},
        {ts:'14:02:29', lvl:'debug', txt:'mock stripe client · latency 84ms'},
        {ts:'14:02:31', lvl:'info',  txt:'  ✓ charges card on valid payload (212ms)'},
        {ts:'14:02:33', lvl:'info',  txt:'  ✓ rejects expired cards (44ms)'},
        {ts:'14:02:36', lvl:'info',  txt:'  ↻ idempotency key collision (retrying)'},
      ],
    },
  },
  passed: {
    pipeline: 'payments-api · deploy',
    status: 'ok',
    duration: '4m 12s',
    branch: 'main',
    sha: 'b2e11a7',
    author: 'eli chen',
    time: '3 min ago',
    commit: 'bump stripe sdk to 14.2',
    runId: '#4718',
    trigger: 'Periodic_Cron',
    triggerKind: 'cron',
    pr: null,
    stages: [
      {id:'s1', name:'Checkout & Install', status:'ok', duration:'31s', steps:[{id:'s1-1', name:'git checkout', status:'ok', duration:'2s'},{id:'s1-2', name:'npm ci', status:'ok', duration:'29s'}]},
      {id:'s2', name:'Build', status:'ok', duration:'48s', steps:[{id:'s2-1', name:'tsc --build', status:'ok', duration:'17s'},{id:'s2-2', name:'bundle', status:'ok', duration:'10s'},{id:'s2-3', name:'docker build', status:'ok', duration:'21s'}]},
      {id:'s3', name:'Test & Scan', status:'ok', duration:'1m 22s', steps:[{id:'s3-1', name:'unit tests', status:'ok', duration:'18s'},{id:'s3-2', name:'integration tests', status:'ok', duration:'42s'},{id:'s3-3', name:'security scan', status:'ok', duration:'14s'},{id:'s3-4', name:'license check', status:'ok', duration:'8s'}]},
      {id:'s4', name:'Deploy → Staging', status:'ok', duration:'42s', steps:[{id:'s4-1', name:'helm upgrade', status:'ok', duration:'33s'},{id:'s4-2', name:'smoke test', status:'ok', duration:'9s'}]},
      {id:'s5', name:'Deploy → Production', status:'ok', duration:'49s', steps:[{id:'s5-1', name:'helm upgrade', status:'ok', duration:'37s'},{id:'s5-2', name:'smoke test', status:'ok', duration:'12s'}]},
    ],
    policy: {passed: 13, warning: 0, errored: 0},
    modules: [
      {tag:'CI',  val:'all stages passed', kind:'ok'},
      {tag:'CD',  val:'deployed to prod-us-east', kind:'ok'},
      {tag:'SEC', val:'0 new critical · 0 high', kind:'ok'},
      {tag:'QA',  val:'212 passed · 0 flaky', kind:'ok'},
    ],
    build: [
      { stageId:'s1', stageName:'Checkout & Install', repo:'acme/payments-api', branches:{source:'main'}, pr:null, commits:[
        {sha:'b2e11a7', msg:'bump stripe sdk to 14.2', author:'eli chen'},
      ], timeSaved:'38s cache hit', artifacts:[] },
      { stageId:'s2', stageName:'Build', repo:'acme/payments-api', branches:{source:'main'}, pr:null, commits:[
        {sha:'b2e11a7', msg:'bump stripe sdk to 14.2', author:'eli chen'},
      ], timeSaved:'1m 04s layer cache', artifacts:[
        {name:'payments-api', type:'docker', version:'sha-b2e11a7', size:'141 MB', registry:'ghcr.io/acme'},
        {name:'bundle.js',    type:'file',   version:'v2.14.0',    size:'3.8 MB', registry:'s3://acme-artifacts'},
      ]},
      { stageId:'s3', stageName:'Test & Scan', repo:'acme/payments-api', branches:{source:'main'}, pr:null, commits:[
        {sha:'b2e11a7', msg:'bump stripe sdk to 14.2', author:'eli chen'},
      ], timeSaved:null, artifacts:[
        {name:'junit-report.xml', type:'file', version:'—', size:'212 KB', registry:'s3://acme-artifacts'},
        {name:'coverage-lcov.info', type:'file', version:'—', size:'1.1 MB', registry:'s3://acme-artifacts'},
      ]},
    ],
    deploy: [
      { stageId:'s4', stageName:'Deploy → Staging', status:'ok',
        services:[{name:'payments-api', version:'sha-b2e11a7', delta:'+2.1% lat', kind:'rolling'}],
        envs:[{name:'staging-us-east', cluster:'eks-stg', region:'us-east-1', url:'staging.payments.internal', status:'ok', deployedAt:'4m ago'}] },
      { stageId:'s5', stageName:'Deploy → Production', status:'ok',
        services:[{name:'payments-api', version:'sha-b2e11a7', delta:null, kind:'rolling'}],
        envs:[
          {name:'prod-us-east', cluster:'eks-prod-use1', region:'us-east-1', url:'api.payments.acme.com', status:'ok', deployedAt:'3m ago'},
          {name:'prod-eu-west', cluster:'eks-prod-euw1', region:'eu-west-1', url:'api-eu.payments.acme.com', status:'ok', deployedAt:'3m ago'},
        ]},
    ],
    security: {
      scanId:'STO-4718-001',
      critical:{ total:0, new:0 },
      high:    { total:0, new:0 },
      medium:  { total:2, new:0 },
      low:     { total:9, new:0 },
      info:    { total:31, new:0 },
      exempted:{ total:6, new:0 },
      running:false,
      tools:['Snyk','Trivy','Semgrep'],
    },
    logs: null,
  },
  failed: {
    pipeline: 'payments-api · deploy',
    status: 'failed',
    duration: '1m 48s',
    branch: 'feat/card-tokens',
    sha: 'd41fe08',
    author: 'eli chen',
    time: '22 min ago',
    commit: 'wip: tokenize card numbers at ingest',
    runId: '#4715',
    trigger: 'eli chen',
    triggerKind: 'user',
    pr: 312,
    error: 'Step failed: integration tests — exit code 1 · 4 tests failed in test/payments.integration.spec.ts',
    stages: [
      {id:'s1', name:'Checkout & Install', status:'ok', duration:'32s', steps:[{id:'s1-1', name:'git checkout', status:'ok', duration:'2s'},{id:'s1-2', name:'npm ci', status:'ok', duration:'30s'}]},
      {id:'s2', name:'Build', status:'ok', duration:'46s', steps:[{id:'s2-1', name:'tsc --build', status:'ok', duration:'16s'},{id:'s2-2', name:'bundle', status:'ok', duration:'9s'},{id:'s2-3', name:'docker build', status:'ok', duration:'21s'}]},
      {id:'s3', name:'Test & Scan', status:'failed', duration:'30s', active:true, steps:[
        {id:'s3-1', name:'unit tests', status:'ok', duration:'17s'},
        {id:'s3-2', name:'integration tests', status:'failed', duration:'13s', failedHere:true},
        {id:'s3-3', name:'security scan', status:'pending'},
        {id:'s3-4', name:'license check', status:'pending'},
      ]},
      {id:'s4', name:'Deploy → Staging', status:'pending', steps:[]},
      {id:'s5', name:'Deploy → Production', status:'pending', steps:[]},
    ],
    policy: {passed: 10, warning: 1, errored: 2},
    modules: [
      {tag:'CI',  val:'2 stages passed · 1 failed', kind:'err'},
      {tag:'CD',  val:'blocked on test failure', kind:'muted'},
      {tag:'SEC', val:'skipped', kind:'muted'},
      {tag:'QA',  val:'208 passed · 4 failed', kind:'err'},
    ],
    build: [
      { stageId:'s1', stageName:'Checkout & Install', repo:'acme/payments-api', branches:{source:'feat/card-tokens', dest:'main'}, pr:312, commits:[
        {sha:'d41fe08', msg:'wip: tokenize card numbers at ingest', author:'eli chen'},
        {sha:'c1a8932', msg:'add tokenize helper', author:'eli chen'},
        {sha:'a02ffed', msg:'scaffold card-tokens module', author:'eli chen'},
      ], timeSaved:'40s cache hit', artifacts:[] },
      { stageId:'s2', stageName:'Build', repo:'acme/payments-api', branches:{source:'feat/card-tokens', dest:'main'}, pr:312, commits:[
        {sha:'d41fe08', msg:'wip: tokenize card numbers at ingest', author:'eli chen'},
      ], timeSaved:'58s layer cache', artifacts:[
        {name:'payments-api', type:'docker', version:'sha-d41fe08', size:'143 MB', registry:'ghcr.io/acme'},
      ]},
      { stageId:'s3', stageName:'Test & Scan', repo:'acme/payments-api', branches:{source:'feat/card-tokens', dest:'main'}, pr:312, commits:[
        {sha:'d41fe08', msg:'wip: tokenize card numbers at ingest', author:'eli chen'},
      ], timeSaved:null, artifacts:[
        {name:'junit-report.xml', type:'file', version:'—', size:'198 KB', registry:'s3://acme-artifacts', failed:true},
      ]},
    ],
    deploy: [
      { stageId:'s4', stageName:'Deploy → Staging', status:'pending', blocked:true,
        services:[{name:'payments-api', version:'sha-d41fe08', delta:null, kind:'rolling'}],
        envs:[{name:'staging-us-east', cluster:'eks-stg', region:'us-east-1', url:'staging.payments.internal', status:'blocked'}] },
      { stageId:'s5', stageName:'Deploy → Production', status:'pending', blocked:true,
        services:[{name:'payments-api', version:'sha-d41fe08', delta:null, kind:'rolling'}],
        envs:[
          {name:'prod-us-east', cluster:'eks-prod-use1', region:'us-east-1', url:'api.payments.acme.com', status:'blocked'},
        ]},
    ],
    security: {
      scanId:'STO-4715-001',
      critical:{ total:0, new:0 },
      high:    { total:0, new:0 },
      medium:  { total:0, new:0 },
      low:     { total:0, new:0 },
      info:    { total:0, new:0 },
      exempted:{ total:0, new:0 },
      skipped:true,
      tools:['Snyk','Trivy','Semgrep'],
    },
    logs: {
      stepId: 's3-2',
      stepName: 'integration tests',
      failed: true,
      lines: [
        {ts:'14:28:02', lvl:'info',  txt:'RUNS  test/payments.integration.spec.ts'},
        {ts:'14:28:08', lvl:'info',  txt:'  ✓ charges card on valid payload (198ms)'},
        {ts:'14:28:11', lvl:'err',   txt:'  ✗ tokenizes card numbers — TypeError: Cannot read property \'token\' of undefined'},
        {ts:'14:28:11', lvl:'err',   txt:'    at tokenize (src/payments/tokenize.ts:47:12)'},
        {ts:'14:28:11', lvl:'err',   txt:'    at Object.<anonymous> (test/payments.integration.spec.ts:88:19)'},
        {ts:'14:28:13', lvl:'err',   txt:'  ✗ rejects expired cards — expected 400, received 500'},
        {ts:'14:28:14', lvl:'err',   txt:'  ✗ handles partial refunds — timeout 5000ms'},
        {ts:'14:28:15', lvl:'err',   txt:'  ✗ retries on 429 — expected 3 attempts, received 1'},
        {ts:'14:28:15', lvl:'info',  txt:'Tests:       4 failed, 38 passed, 42 total'},
        {ts:'14:28:15', lvl:'err',   txt:'exit code 1'},
      ],
    },
  },
  approval: {
    pipeline: 'payments-api · deploy',
    status: 'waiting',
    duration: '6m 04s',
    branch: 'main',
    sha: 'c80a2f4',
    author: 'sam park',
    time: '8 min ago',
    commit: 'release: v2.14.0',
    runId: '#4720',
    trigger: 'sam park',
    triggerKind: 'user',
    pr: 319,
    stages: [
      {id:'s1', name:'Checkout & Install', status:'ok', duration:'30s', steps:[]},
      {id:'s2', name:'Build', status:'ok', duration:'47s', steps:[]},
      {id:'s3', name:'Test & Scan', status:'ok', duration:'1m 18s', steps:[]},
      {id:'s4', name:'Deploy → Staging', status:'ok', duration:'44s', steps:[]},
      {id:'sApprove', name:'Production approval gate', status:'waiting', active:true, approval:{
        groups: ['@platform-leads', '@sre-oncall'],
        required: 2,
        received: 1,
        approvers: ['nora m.'],
      }, steps:[]},
      {id:'s5', name:'Deploy → Production', status:'pending', steps:[]},
    ],
    policy: {passed: 13, warning: 0, errored: 0},
    modules: [
      {tag:'CI', val:'all stages passed', kind:'ok'},
      {tag:'CD', val:'staging healthy · awaiting approval', kind:'info'},
    ],
    build: [
      { stageId:'s1', stageName:'Checkout & Install', repo:'acme/payments-api', branches:{source:'main'}, pr:319, commits:[
        {sha:'c80a2f4', msg:'release: v2.14.0', author:'sam park'},
      ], timeSaved:'36s cache hit', artifacts:[] },
      { stageId:'s2', stageName:'Build', repo:'acme/payments-api', branches:{source:'main'}, pr:319, commits:[
        {sha:'c80a2f4', msg:'release: v2.14.0', author:'sam park'},
      ], timeSaved:'1m 12s layer cache', artifacts:[
        {name:'payments-api', type:'docker', version:'v2.14.0', size:'142 MB', registry:'ghcr.io/acme'},
      ]},
      { stageId:'s3', stageName:'Test & Scan', repo:'acme/payments-api', branches:{source:'main'}, pr:319, commits:[
        {sha:'c80a2f4', msg:'release: v2.14.0', author:'sam park'},
      ], timeSaved:null, artifacts:[
        {name:'junit-report.xml', type:'file', version:'—', size:'216 KB', registry:'s3://acme-artifacts'},
      ]},
    ],
    deploy: [
      { stageId:'s4', stageName:'Deploy → Staging', status:'ok',
        services:[{name:'payments-api', version:'v2.14.0', delta:null, kind:'rolling'}],
        envs:[{name:'staging-us-east', cluster:'eks-stg', region:'us-east-1', url:'staging.payments.internal', status:'ok', deployedAt:'8m ago'}] },
      { stageId:'s5', stageName:'Deploy → Production', status:'pending',
        services:[{name:'payments-api', version:'v2.14.0', delta:null, kind:'rolling'}],
        envs:[
          {name:'prod-us-east', cluster:'eks-prod-use1', region:'us-east-1', url:'api.payments.acme.com', status:'waiting'},
          {name:'prod-eu-west', cluster:'eks-prod-euw1', region:'eu-west-1', url:'api-eu.payments.acme.com', status:'waiting'},
        ]},
    ],
    security: {
      scanId:'STO-4720-001',
      critical:{ total:0, new:0 },
      high:    { total:1, new:0 },
      medium:  { total:3, new:0 },
      low:     { total:12, new:0 },
      info:    { total:41, new:0 },
      exempted:{ total:6, new:0 },
      running:false,
      tools:['Snyk','Trivy','Semgrep'],
    },
    logs: null,
  },
};

const HISTORY = [
  {id:'#4721', status:'running', pipeline:'payments-api · deploy', branch:'feat/retry-queue', sha:'a9f3cd2', author:'eli chen', time:'2m', tags:['ci','cd']},
  {id:'#4720', status:'waiting', pipeline:'payments-api · deploy', branch:'main',            sha:'c80a2f4', author:'sam park', time:'8m', tags:['ci','cd','sec'], current:false},
  {id:'#4719', status:'ok',      pipeline:'payments-api · deploy', branch:'main',            sha:'9e6a1b0', author:'sam park', time:'42m', tags:['ci','cd']},
  {id:'#4718', status:'ok',      pipeline:'payments-api · deploy', branch:'main',            sha:'b2e11a7', author:'eli chen', time:'3h',  tags:['ci','cd'], current:true},
  {id:'#4717', status:'ok',      pipeline:'payments-api · build',  branch:'chore/deps',      sha:'7cc3301', author:'jo liu',   time:'5h',  tags:['ci']},
  {id:'#4716', status:'aborted', pipeline:'payments-api · deploy', branch:'hotfix/rate',     sha:'2fd9820', author:'eli chen', time:'6h',  tags:['ci']},
  {id:'#4715', status:'failed',  pipeline:'payments-api · deploy', branch:'feat/card-tokens',sha:'d41fe08', author:'eli chen', time:'8h',  tags:['ci','qa']},
  {id:'#4714', status:'ok',      pipeline:'payments-api · deploy', branch:'main',            sha:'fd12cc1', author:'jo liu',   time:'1d',  tags:['ci','cd','sec']},
];

// ─────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────
function Header({ onMenu, menuOpen, brandLabel, org, project }) {
  return (
    <div className="hdr">
      <button className="hdr-menu" onClick={onMenu} aria-label="Menu">
        <Ico.menu/>
      </button>
      <div className="hdr-brand">
        <BrandMark/>
        <span className="hdr-wordmark">{brandLabel}</span>
      </div>
      <div className="hdr-ctx">
        <span className="hdr-ctx-chip">{org || '—'}</span>
        <span className="hdr-ctx-sep">/</span>
        <span className="hdr-ctx-chip">{project || '—'}</span>
      </div>
      <div className="hdr-actions">
        <button className="hdr-btn" title="Refresh"><Ico.refresh/></button>
        <button className="hdr-btn" title="Command palette"><Ico.cmd/></button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// App menu (slide-out)
// ─────────────────────────────────────────────────────────────
// Pipelines icon — matches the one used in the "Pipelines" tab in ViewToggle
const PipelinesGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
    <circle cx="4" cy="4" r="1.6" fill="currentColor"/>
    <circle cx="10" cy="4" r="1.6" fill="currentColor" opacity="0.5"/>
    <circle cx="7" cy="10" r="1.6" fill="currentColor"/>
    <path d="M5.2 4.5 L6.5 9 M8.8 4.5 L7.5 9" stroke="currentColor" strokeWidth="1" opacity="0.45"/>
  </svg>
);

function AppMenu({ open, onClose, onPick, active, org, project, onChangeAccount }) {
  const items = [
    {id:'pipelines', icon:<PipelinesGlyph/>, label:'Pipelines', desc:'Execution status & logs'},
  ];
  return (
    <>
      {open && <div className="menu-scrim" onClick={onClose}/>}
      <aside className={`app-menu ${open?'is-open':''}`}>
        <div className="app-menu-hdr">
          <div className="app-menu-brand"><BrandMark size={20}/><span className="hdr-wordmark">Pipeline</span></div>
          <button className="hdr-btn" onClick={onClose}><Ico.x/></button>
        </div>
        <div className="app-menu-section">Products</div>
        {items.map(it => (
          <button key={it.id} className={`app-menu-item ${active===it.id?'on':''}`} onClick={() => { onPick(it.id); onClose(); }}>
            <span className="app-menu-ico">{it.icon}</span>
            <span className="app-menu-text">
              <span className="app-menu-label">{it.label}</span>
              <span className="app-menu-desc">{it.desc}</span>
            </span>
            {active===it.id && <span className="app-menu-dot"/>}
          </button>
        ))}
        <div className="app-menu-section">Account</div>
        <button className="app-menu-item account-item" onClick={() => { onChangeAccount?.(); }}>
          <span className="app-menu-ico account-ico">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <circle cx="6" cy="4.2" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M2 10.5 Q2 7.5 6 7.5 Q10 7.5 10 10.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="app-menu-text">
            <span className="app-menu-label">
              {org && project ? (
                <><span className="acct-org">{org}</span><span className="acct-sep"> / </span><span className="acct-proj">{project}</span></>
              ) : (
                <span className="acct-empty">Not connected</span>
              )}
            </span>
            <span className="app-menu-desc">
              {org && project ? 'Change org & project' : 'Connect your Harness account'}
            </span>
          </span>
          <span className="app-menu-chev">
            <svg width="10" height="10" viewBox="0 0 12 12"><path d="M4 3 L8 6 L4 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/></svg>
          </span>
        </button>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Account picker — mirrors the native VS Code QuickPick flow
// triggered by the `harness.switchProject` command. Real webview
// fires: postMessage({ type:'command', command:'harness.switchProject' })
// which calls runWorkspaceOverride() → two sequential QuickPicks
// (Organization → Project). This is a visual stand-in.
// ─────────────────────────────────────────────────────────────
const ORGS_DATA = [
  { id:'acme',      name:'acme',      desc:'Production org · 42 projects',  projects:[
    {id:'payments', name:'payments', desc:'payments-api, checkout flows'},
    {id:'checkout', name:'checkout', desc:'checkout-web, cart-service'},
    {id:'platform', name:'platform', desc:'shared infra & libs'},
    {id:'mobile',   name:'mobile',   desc:'iOS & Android releases'},
    {id:'data-infra', name:'data-infra', desc:'warehouse, pipelines'},
  ]},
  { id:'acme-labs', name:'acme-labs', desc:'R&D org · 7 projects', projects:[
    {id:'research',    name:'research',    desc:'experiments sandbox'},
    {id:'experiments', name:'experiments', desc:'feature-flag labs'},
  ]},
  { id:'personal',  name:'personal',  desc:'Personal org · 1 project', projects:[
    {id:'sandbox', name:'sandbox', desc:'your playground'},
  ]},
];

function AccountPicker({ open, onClose, org, project, onApply }) {
  // Two-step flow: 'org' → 'project', matching runWorkspaceOverride()
  const [step, setStep] = useState('org');
  const [selOrgId, setSelOrgId] = useState(null);
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setStep('org'); setSelOrgId(null); setQ('');
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const selOrg = ORGS_DATA.find(o => o.id === selOrgId);

  const items = step === 'org'
    ? ORGS_DATA.filter(o => !q || o.name.toLowerCase().includes(q.toLowerCase()) || o.desc.toLowerCase().includes(q.toLowerCase()))
    : (selOrg?.projects || []).filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()));

  const pickOrg = (o) => {
    setSelOrgId(o.id);
    setStep('project');
    setQ('');
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const pickProject = (p) => {
    onApply(selOrg.name, p.name);
    onClose();
  };

  return (
    <div className="qp-scrim" onClick={onClose}>
      <div className="qp-dialog" onClick={e => e.stopPropagation()}>
        <div className="qp-breadcrumb">
          <button className={`qp-crumb ${step==='org'?'on':''}`}
                  onClick={() => { setStep('org'); setQ(''); }}>
            Organization
            {selOrg && step === 'project' && <span className="qp-crumb-val">{selOrg.name}</span>}
          </button>
          <svg width="10" height="10" viewBox="0 0 12 12" style={{color:'var(--fg-3)'}}><path d="M4 3 L8 6 L4 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/></svg>
          <button className={`qp-crumb ${step==='project'?'on':''}`} disabled={!selOrgId}>
            Project
          </button>
          <span className="qp-step-meta">Step {step==='org'?'1':'2'} of 2 · Esc to cancel</span>
        </div>
        <div className="qp-input-wrap">
          <input
            ref={inputRef}
            className="qp-input"
            type="text"
            placeholder={step==='org' ? 'Select a Harness organization…' : `Select a project in ${selOrg?.name}…`}
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <div className="qp-list">
          {items.length === 0 && (
            <div className="qp-empty">No {step==='org'?'organizations':'projects'} match "{q}"</div>
          )}
          {step === 'org' && items.map(o => (
            <button key={o.id} className={`qp-item ${org===o.name?'is-current':''}`} onClick={() => pickOrg(o)}>
              <span className="qp-item-ico">
                <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden>
                  <path d="M2 12 L2 4 L7 1.5 L12 4 L12 12 Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M5 12 L5 8 L9 8 L9 12" fill="none" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
              </span>
              <span className="qp-item-text">
                <span className="qp-item-label">{o.name}{org === o.name && <span className="qp-item-current">current</span>}</span>
                <span className="qp-item-desc">{o.desc}</span>
              </span>
            </button>
          ))}
          {step === 'project' && items.map(p => (
            <button key={p.id} className={`qp-item ${org===selOrg?.name && project===p.name?'is-current':''}`} onClick={() => pickProject(p)}>
              <span className="qp-item-ico">
                <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden>
                  <path d="M1.5 4 A0.8 0.8 0 0 1 2.3 3.2 L5.5 3.2 L7 4.7 L11.7 4.7 A0.8 0.8 0 0 1 12.5 5.5 L12.5 11 A0.8 0.8 0 0 1 11.7 11.8 L2.3 11.8 A0.8 0.8 0 0 1 1.5 11 Z" fill="none" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
              </span>
              <span className="qp-item-text">
                <span className="qp-item-label">{p.name}{org === selOrg?.name && project === p.name && <span className="qp-item-current">current</span>}</span>
                <span className="qp-item-desc">{p.desc}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="qp-ftr">
          <span className="qp-ftr-hint">
            <kbd>↵</kbd> select &nbsp; <kbd>Esc</kbd> cancel
          </span>
          <span className="qp-ftr-cmd mono">harness.switchProject</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pipelines catalog — all pipelines in the Harness project
// ─────────────────────────────────────────────────────────────
const PIPELINES_DATA = [
  { id:'p1', name:'payments-api · deploy', folder:'payments', status:'running',
    lastRun:{ time:'2m ago', actor:'eli chen', branch:'feat/retry-queue', sha:'a9f3cd2', runId:'#4721' },
    history:['ok','ok','failed','ok','running'],
    successRate: 0.92, pinned: true },
  { id:'p2', name:'payments-api · ci', folder:'payments', status:'ok',
    lastRun:{ time:'18m ago', actor:'sam park', branch:'main', sha:'c21e8d4', runId:'#4720' },
    history:['ok','ok','ok','ok','ok'],
    successRate: 0.98, pinned: false },
  { id:'p3', name:'checkout-web · deploy', folder:'checkout', status:'failed',
    lastRun:{ time:'1h ago', actor:'pipeline-bot', branch:'main', sha:'f0e2ba1', runId:'#4716', failingStage:'E2E Tests' },
    history:['ok','failed','ok','failed','failed'],
    successRate: 0.74, pinned: true },
  { id:'p4', name:'checkout-web · ci', folder:'checkout', status:'ok',
    lastRun:{ time:'3h ago', actor:'sam park', branch:'main', sha:'d88471e', runId:'#4712' },
    history:['failed','ok','ok','ok','ok'],
    successRate: 0.89, pinned: false },
  { id:'p5', name:'nightly-e2e', folder:'quality', status:'waiting',
    lastRun:{ time:'6h ago', actor:'Periodic_Cron', branch:'main', sha:'b44c0a7', runId:'#4702' },
    history:['ok','ok','failed','ok','waiting'],
    successRate: 0.81, pinned: false },
  { id:'p6', name:'infra · terraform-plan', folder:'infra', status:'ok',
    lastRun:{ time:'yesterday', actor:'dana liu', branch:'infra/vpc-peering', sha:'e5a21f8', runId:'#4691' },
    history:['ok','ok','ok','ok','ok'],
    successRate: 1.0, pinned: false },
  { id:'p7', name:'infra · terraform-apply', folder:'infra', status:'failed',
    lastRun:{ time:'yesterday', actor:'dana liu', branch:'infra/vpc-peering', sha:'e5a21f8', runId:'#4690', failingStage:'Apply' },
    history:['failed','failed','ok','failed','failed'],
    successRate: 0.55, pinned: false },
  { id:'p8', name:'mobile · release', folder:'mobile', status:'ok',
    lastRun:{ time:'2d ago', actor:'tess arnold', branch:'release/v2.14', sha:'117bb2c', runId:'#4677' },
    history:['aborted','ok','ok','ok','ok'],
    successRate: 0.95, pinned: false },
];

// Run history strip — 5 most recent executions, oldest → newest (left → right)
function RunStrip({ data = [], variant = 'squares', size = 'md' }) {
  if (!data || data.length === 0) return null;
  const label = (s) => ({ok:'Passed', failed:'Failed', running:'Running', waiting:'Waiting', aborted:'Aborted'}[s] || s);
  const items = data.slice(-5); // last 5
  const isLatest = (i) => i === items.length - 1;

  if (variant === 'off') return null;

  if (variant === 'bars' || variant === 'bars-uniform') {
    // Faux durations just for visual rhythm
    const durs = [0.55, 0.72, 0.4, 0.9, 0.65];
    return (
      <div className={`rs rs-${variant} rs-${size}`} role="img" aria-label="Last 5 executions">
        {items.map((s, i) => (
          <span
            key={i}
            className={`rs-bar rs-is-${s} ${isLatest(i) ? 'is-latest' : ''}`}
            style={variant === 'bars' ? { height: `${Math.round((durs[i]||0.6) * 100)}%` } : undefined}
            title={`${label(s)} · ${items.length - i === 1 ? 'latest' : items.length - i + ' runs ago'}`}
            aria-label={label(s)}
          />
        ))}
      </div>
    );
  }

  // dots | squares
  return (
    <div className={`rs rs-${variant} rs-${size}`} role="img" aria-label="Last 5 executions">
      {items.map((s, i) => (
        <span
          key={i}
          className={`rs-cell rs-is-${s} ${isLatest(i) ? 'is-latest' : ''}`}
          title={`${label(s)} · ${items.length - i === 1 ? 'latest' : items.length - i + ' runs ago'}`}
          aria-label={label(s)}
        />
      ))}
    </div>
  );
}

function PipelinesList({ layout = 'cards', onOpenExec, onEditYaml, empty = false, runStrip = 'squares' }) {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [pinned, setPinned] = useState(() => new Set(PIPELINES_DATA.filter(p => p.pinned).map(p => p.id)));
  const [expandedId, setExpandedId] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(() => new Set(['payments','checkout','infra','quality','mobile']));
  const [sortOpen, setSortOpen] = useState(false);

  if (empty) return <PipelinesEmpty/>;

  const togglePin = (id) => {
    setPinned(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const filtered = useMemo(() => {
    let out = PIPELINES_DATA.filter(p => {
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      return true;
    });
    if (sort === 'name') out.sort((a,b) => a.name.localeCompare(b.name));
    // pinned float
    out.sort((a,b) => {
      const pa = pinned.has(a.id) ? 1 : 0;
      const pb = pinned.has(b.id) ? 1 : 0;
      return pb - pa;
    });
    return out;
  }, [q, statusFilter, sort, pinned]);

  const statusCounts = useMemo(() => {
    const c = { failed: 0, running: 0, waiting: 0 };
    PIPELINES_DATA.forEach(p => { if (c[p.status] !== undefined) c[p.status]++; });
    return c;
  }, []);

  return (
    <>
      <div className="pl-filter">
        <div className="pl-search">
          <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
            <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M9 9 L12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search pipelines…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          {q && (
            <button className="pl-clear" onClick={() => setQ('')} aria-label="Clear">
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 2 L8 8 M8 2 L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            </button>
          )}
        </div>
        <div className="pl-chips">
          <button className={`pl-chip ${statusFilter==='all'?'on':''}`} onClick={() => setStatusFilter('all')}>All <span className="pl-chip-n">{PIPELINES_DATA.length}</span></button>
          {statusCounts.failed > 0 && (
            <button className={`pl-chip is-err ${statusFilter==='failed'?'on':''}`} onClick={() => setStatusFilter('failed')}>
              <span className="pl-dot is-failed"/> Failed <span className="pl-chip-n">{statusCounts.failed}</span>
            </button>
          )}
          {statusCounts.running > 0 && (
            <button className={`pl-chip is-run ${statusFilter==='running'?'on':''}`} onClick={() => setStatusFilter('running')}>
              <span className="pl-dot is-running"/> Running <span className="pl-chip-n">{statusCounts.running}</span>
            </button>
          )}
          {statusCounts.waiting > 0 && (
            <button className={`pl-chip is-wait ${statusFilter==='waiting'?'on':''}`} onClick={() => setStatusFilter('waiting')}>
              <span className="pl-dot is-waiting"/> Waiting <span className="pl-chip-n">{statusCounts.waiting}</span>
            </button>
          )}
          <div className="pl-sort-wrap">
            <button className="pl-sort-btn" onClick={() => setSortOpen(v => !v)} aria-label="Sort">
              <svg width="11" height="11" viewBox="0 0 12 12"><path d="M3 3 L3 10 M3 3 L1.5 5 M3 3 L4.5 5 M9 9 L9 2 M9 9 L7.5 7 M9 9 L10.5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/></svg>
            </button>
            {sortOpen && (
              <>
                <div className="rerun-scrim" onClick={() => setSortOpen(false)}/>
                <div className="pl-sort-menu">
                  <button className={`pl-sort-opt ${sort==='recent'?'on':''}`} onClick={() => { setSort('recent'); setSortOpen(false); }}>Most recent</button>
                  <button className={`pl-sort-opt ${sort==='name'?'on':''}`} onClick={() => { setSort('name'); setSortOpen(false); }}>Name (A–Z)</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="panel-scroll">
        {filtered.length === 0 ? (
          <div className="pl-no-results">
            <div className="pl-no-results-t">No pipelines match</div>
            <button className="pl-no-results-btn" onClick={() => { setQ(''); setStatusFilter('all'); }}>Clear filters</button>
          </div>
        ) : layout === 'grouped' ? (
          <PipelinesGrouped items={filtered} pinned={pinned} togglePin={togglePin}
            onOpenExec={onOpenExec} onEditYaml={onEditYaml}
            expandedFolders={expandedFolders} setExpandedFolders={setExpandedFolders}
            runStrip={runStrip}/>
        ) : layout === 'expandable' ? (
          <PipelinesExpandable items={filtered} pinned={pinned} togglePin={togglePin}
            expandedId={expandedId} setExpandedId={setExpandedId}
            onOpenExec={onOpenExec} onEditYaml={onEditYaml}
            runStrip={runStrip}/>
        ) : (
          <PipelinesCards items={filtered} pinned={pinned} togglePin={togglePin}
            onOpenExec={onOpenExec} onEditYaml={onEditYaml}
            runStrip={runStrip}/>
        )}
      </div>
    </>
  );
}

function PipelineRowBase({ p, pinned, togglePin, onOpenExec, onEditYaml, expanded, onToggleExpand, variant = 'card', runStrip = 'squares' }) {
  const stop = (fn) => (e) => { e.stopPropagation(); fn?.(p); };
  const isPinned = pinned.has(p.id);

  const statusChip = (
    <span className={`pl-badge is-${p.status}`}>
      {p.status === 'running' && <span className="pl-badge-pulse"/>}
      {p.status === 'ok' ? 'Passed' : p.status === 'failed' ? 'Failed' : p.status === 'running' ? 'Running' : 'Waiting'}
    </span>
  );

  const metaLine = (
    <div className="pl-meta">
      <span className="pl-meta-seg"><Ico.branch/> {p.lastRun.branch}</span>
      <span className="pl-sep">·</span>
      <span className="pl-meta-seg"><Ico.clock/> {p.lastRun.time}</span>
      <span className="pl-sep">·</span>
      <span className="pl-meta-seg">{p.lastRun.actor}</span>
    </div>
  );

  return (
    <div className={`pl-row variant-${variant} ${expanded?'is-open':''} ${p.status==='failed'?'is-failed':''}`}
         onClick={onToggleExpand ? () => onToggleExpand(p.id) : () => onOpenExec?.(p)}>
      <button className={`pl-pin ${isPinned?'on':''}`} onClick={stop(() => togglePin(p.id))} aria-label={isPinned?'Unpin':'Pin'}>
        <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
          <path d="M6 1 L6 7 M6 7 L3 10 M6 7 L9 10 M3.5 1 L8.5 1"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill={isPinned?'currentColor':'none'}/>
        </svg>
      </button>
      <div className="pl-body">
        <div className="pl-head">
          <span className="pl-name">{p.name}</span>
        </div>
        {metaLine}
        {runStrip && runStrip !== 'off' && p.history && (
          <RunStrip data={p.history} variant={runStrip} size={variant === 'compact' ? 'sm' : 'md'}/>
        )}
        {p.status === 'failed' && p.lastRun.failingStage && (
          <div className="pl-fail">
            <svg width="10" height="10" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.3"/><path d="M6 3 L6 7 M6 9 L6 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            Failed at <span className="pl-fail-stage">{p.lastRun.failingStage}</span>
          </div>
        )}
        {expanded && (
          <div className="pl-expand">
            <div className="pl-stat-grid">
              <div className="pl-stat">
                <span className="pl-stat-l">Last run</span>
                <span className="pl-stat-v mono">{p.lastRun.runId}</span>
              </div>
              <div className="pl-stat">
                <span className="pl-stat-l">Commit</span>
                <span className="pl-stat-v mono">{p.lastRun.sha}</span>
              </div>
              <div className="pl-stat">
                <span className="pl-stat-l">Success</span>
                <span className="pl-stat-v">{Math.round(p.successRate * 100)}%</span>
              </div>
            </div>
            <div className="pl-actions">
              <button className="pl-act pl-act-primary" onClick={stop(onOpenExec)}>View executions</button>
              <button className="pl-act" onClick={stop(onEditYaml)}>
                <svg width="11" height="11" viewBox="0 0 12 12"><path d="M2 10 L2 8 L7 3 L9 5 L4 10 Z M7 3 L8.5 1.5 L10.5 3.5 L9 5" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinejoin="round"/></svg>
                Edit YAML
              </button>
            </div>
          </div>
        )}
      </div>
      {onToggleExpand && (
        <span className={`pl-chev ${expanded?'is-open':''}`}>
          <svg width="10" height="10" viewBox="0 0 12 12"><path d="M4 3 L8 6 L4 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/></svg>
        </span>
      )}
    </div>
  );
}

function PipelinesCards({ items, pinned, togglePin, onOpenExec, onEditYaml, runStrip }) {
  return (
    <div className="pl-list">
      {items.map(p => (
        <PipelineRowBase key={p.id} p={p} pinned={pinned} togglePin={togglePin}
          onOpenExec={onOpenExec} onEditYaml={onEditYaml}
          expanded={false} variant="card" runStrip={runStrip}/>
      ))}
    </div>
  );
}

function PipelinesExpandable({ items, pinned, togglePin, expandedId, setExpandedId, onOpenExec, onEditYaml, runStrip }) {
  return (
    <div className="pl-list pl-list-expandable">
      {items.map(p => (
        <PipelineRowBase key={p.id} p={p} pinned={pinned} togglePin={togglePin}
          onOpenExec={onOpenExec} onEditYaml={onEditYaml}
          expanded={expandedId === p.id}
          onToggleExpand={(id) => setExpandedId(cur => cur === id ? null : id)}
          variant="compact" runStrip={runStrip}/>
      ))}
    </div>
  );
}

function PipelinesGrouped({ items, pinned, togglePin, expandedFolders, setExpandedFolders, onOpenExec, onEditYaml, runStrip }) {
  const groups = useMemo(() => {
    const m = {};
    items.forEach(p => { (m[p.folder] ||= []).push(p); });
    return Object.entries(m);
  }, [items]);

  const toggleFolder = (f) => {
    setExpandedFolders(prev => {
      const n = new Set(prev);
      if (n.has(f)) n.delete(f); else n.add(f);
      return n;
    });
  };

  return (
    <div className="pl-list pl-list-grouped">
      {groups.map(([folder, ps]) => {
        const open = expandedFolders.has(folder);
        const failed = ps.filter(p => p.status === 'failed').length;
        return (
          <div className="pl-folder" key={folder}>
            <button className="pl-folder-hdr" onClick={() => toggleFolder(folder)}>
              <span className={`pl-folder-chev ${open?'is-open':''}`}>
                <svg width="10" height="10" viewBox="0 0 12 12"><path d="M4 3 L8 6 L4 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/></svg>
              </span>
              <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
                <path d="M1 3.5 A1 1 0 0 1 2 2.5 L5 2.5 L6.5 4 L12 4 A1 1 0 0 1 13 5 L13 11 A1 1 0 0 1 12 12 L2 12 A1 1 0 0 1 1 11 Z" fill="none" stroke="currentColor" strokeWidth="1.1"/>
              </svg>
              <span className="pl-folder-name">{folder}</span>
              <span className="pl-folder-count">{ps.length}</span>
              {failed > 0 && <span className="pl-folder-fail">{failed}</span>}
            </button>
            {open && (
              <div className="pl-folder-body">
                {ps.map(p => (
                  <PipelineRowBase key={p.id} p={p} pinned={pinned} togglePin={togglePin}
                    onOpenExec={onOpenExec} onEditYaml={onEditYaml}
                    expanded={false} variant="nested" runStrip={runStrip}/>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PipelinesEmpty() {
  return (
    <div className="pl-empty">
      <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden>
        <circle cx="10" cy="10" r="5" fill="none" stroke="currentColor" strokeWidth="1.4"/>
        <circle cx="38" cy="10" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.5"/>
        <circle cx="24" cy="24" r="5" fill="none" stroke="currentColor" strokeWidth="1.4"/>
        <circle cx="10" cy="38" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.5"/>
        <circle cx="38" cy="38" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.5"/>
        <path d="M14 11 L34 11 M11 14 L22 22 M27 24 L34 35 M14 38 L33 38" stroke="currentColor" strokeWidth="1.1" opacity="0.35" strokeDasharray="2 2"/>
      </svg>
      <div className="pl-empty-t">No pipelines yet</div>
      <div className="pl-empty-d">This Harness project doesn't have any pipelines. Create one to start tracking CI/CD runs here.</div>
      <button className="pl-empty-btn">
        <svg width="11" height="11" viewBox="0 0 12 12"><path d="M6 2 L6 10 M2 6 L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        Create pipeline in Harness
        <svg width="10" height="10" viewBox="0 0 12 12" style={{opacity:0.7}}><path d="M4 2 L10 2 L10 8 M10 2 L3 9" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/></svg>
      </button>
    </div>
  );
}

function ViewToggle({ view, setView, pinned, setPinned, running, filtered }) {
  return (
    <div className="vt">
      <button className={`vt-btn ${view==='pipelines'?'on':''}`} onClick={() => setView('pipelines')}>
        <svg width="11" height="11" viewBox="0 0 14 14" aria-hidden><circle cx="4" cy="4" r="1.6" fill="currentColor"/><circle cx="10" cy="4" r="1.6" fill="currentColor" opacity="0.5"/><circle cx="7" cy="10" r="1.6" fill="currentColor"/><path d="M5.2 4.5 L6.5 9 M8.8 4.5 L7.5 9" stroke="currentColor" strokeWidth="1" opacity="0.45"/></svg>
        Pipelines
      </button>
      <button className={`vt-btn ${view==='all'?'on':''}`} onClick={() => setView('all')}>
        {running && <span className="vt-live"/>}
        Executions
        {filtered && <span className="vt-filter-dot" title={`Filtered: ${filtered}`}/>}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Git context bar
// ─────────────────────────────────────────────────────────────
function GitBar({ branch, sha, time, commit }) {
  return (
    <div className="git-bar">
      <Ico.branch/>
      <span className="git-branch">{branch}</span>
      <span className="git-sep">·</span>
      <span className="git-sha">{sha}</span>
      <span className="git-commit">{commit}</span>
      <span className="git-time"><Ico.clock/>{time}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pipeline card
// ─────────────────────────────────────────────────────────────
function PipelineCard({ s, onRerun }) {
  const terminal = s.status === 'ok' || s.status === 'failed';
  const [menuOpen, setMenuOpen] = useState(false);
  const [rerunning, setRerunning] = useState(false);

  const doRerun = (mode) => {
    setMenuOpen(false);
    setRerunning(true);
    onRerun?.(mode);
    setTimeout(() => setRerunning(false), 1600);
  };

  return (
    <div className={`pip-card is-${s.status}`}>
      <div className="pip-bar"/>
      <div className="pip-body">
        <div className="pip-row">
          <span className="pip-name">{s.pipeline}</span>
          <span className={`pip-badge is-${s.status}`}>
            {statusIcon(s.status)}
            {statusLabel(s.status)}
          </span>
        </div>
        <div className="pip-meta">
          <span className="pip-dur">{s.duration}</span>
          <span className="pip-sep">·</span>
          <span className="pip-trigger">
            {s.triggerKind === 'cron' ? <Ico.clock/> : <Ico.user/>}
            <span>by {s.trigger || s.author}</span>
          </span>
          {s.pr && (
            <>
              <span className="pip-sep">·</span>
              <a className="pip-ctx-pr" href="#" onClick={e=>e.preventDefault()} title={`Pull Request #${s.pr}`}>
                <Ico.gitpr/>
                <span>#{s.pr}</span>
              </a>
            </>
          )}
          <span className="pip-acts">
            {terminal && (
              <button
                className={`pip-ibtn ${rerunning?'is-loading':''}`}
                onClick={() => doRerun('same')}
                disabled={rerunning}
                title="Re-run pipeline"
                aria-label="Re-run pipeline"
              >
                {rerunning ? <span className="btn-spin"><Ico.ring/></span> : <Ico.refresh/>}
              </button>
            )}
            {terminal && (
              <button
                className="pip-ibtn pip-ibtn-more"
                onClick={() => setMenuOpen(o => !o)}
                disabled={rerunning}
                title="More re-run options"
                aria-label="More re-run options"
              >
                {Ico.chev(90)}
              </button>
            )}
            <a className="pip-ibtn" href="#" onClick={e=>e.preventDefault()} title="Open in browser" aria-label="Open in browser"><Ico.ext/></a>
            {menuOpen && (
              <>
                <div className="rerun-scrim" onClick={() => setMenuOpen(false)}/>
                <div className="rerun-menu">
                  <button className="rerun-opt" onClick={() => doRerun('same')}>
                    <Ico.refresh/>
                    <span className="rerun-opt-text">
                      <span className="rerun-opt-lbl">Re-run with same commit</span>
                      <span className="rerun-opt-desc">{s.sha} · {s.branch}</span>
                    </span>
                  </button>
                  {s.status === 'failed' && (
                    <button className="rerun-opt" onClick={() => doRerun('failed')}>
                      <span className="rerun-opt-ic st-err"><Ico.x/></span>
                      <span className="rerun-opt-text">
                        <span className="rerun-opt-lbl">Re-run failed stages only</span>
                        <span className="rerun-opt-desc">Skip stages that already passed</span>
                      </span>
                    </button>
                  )}
                  <button className="rerun-opt" onClick={() => doRerun('debug')}>
                    <Ico.cmd/>
                    <span className="rerun-opt-text">
                      <span className="rerun-opt-lbl">Re-run in debug mode</span>
                      <span className="rerun-opt-desc">Verbose logs · SSH on failure</span>
                    </span>
                  </button>
                  <div className="rerun-sep"/>
                  <button className="rerun-opt" onClick={() => doRerun('latest')}>
                    <Ico.branch/>
                    <span className="rerun-opt-text">
                      <span className="rerun-opt-lbl">Run on latest commit</span>
                      <span className="rerun-opt-desc">HEAD of {s.branch}</span>
                    </span>
                  </button>
                </div>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────
// Build tab — per CI stage: repo, branches, PR, commits, time saved, artifacts
// ─────────────────────────────────────────────────────────────
function TabEmpty({ title, desc }) {
  return (
    <div className="tb-empty">
      <div className="tb-empty-t">{title}</div>
      {desc && <div className="tb-empty-d">{desc}</div>}
    </div>
  );
}

function ArtifactIcon({ type }) {
  if (type === 'docker') {
    return (
      <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
        <rect x="1.5" y="7" width="2" height="2" fill="none" stroke="currentColor" strokeWidth="1"/>
        <rect x="4" y="7" width="2" height="2" fill="none" stroke="currentColor" strokeWidth="1"/>
        <rect x="6.5" y="7" width="2" height="2" fill="none" stroke="currentColor" strokeWidth="1"/>
        <rect x="4" y="4.5" width="2" height="2" fill="none" stroke="currentColor" strokeWidth="1"/>
        <rect x="6.5" y="4.5" width="2" height="2" fill="none" stroke="currentColor" strokeWidth="1"/>
        <rect x="6.5" y="2" width="2" height="2" fill="none" stroke="currentColor" strokeWidth="1"/>
        <path d="M1 10.5 Q2 11.5 4 11.5 L8 11.5 Q11 11.5 12 9.5" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
      <path d="M3 1.5 L9 1.5 L11.5 4 L11.5 12 Q11.5 12.5 11 12.5 L3 12.5 Q2.5 12.5 2.5 12 L2.5 2 Q2.5 1.5 3 1.5 Z" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <path d="M9 1.5 L9 4 L11.5 4" stroke="currentColor" strokeWidth="1.1" fill="none"/>
    </svg>
  );
}

function BuildTab({ s }) {
  const build = s?.build;
  if (!build || build.length === 0) {
    return <TabEmpty title="No build info" desc="This pipeline has no CI stages yet."/>;
  }

  // Totals header
  const totalArtifacts = build.reduce((n, b) => n + (b.artifacts?.length || 0), 0);
  const totalCommits = build.reduce((n, b) => n + (b.commits?.length || 0), 0);
  const savedStages = build.filter(b => b.timeSaved).length;

  return (
    <div className="tb tb-build">
      <div className="tb-summary">
        <div className="tb-sum-item">
          <span className="tb-sum-n">{build.length}</span>
          <span className="tb-sum-l">CI stages</span>
        </div>
        <div className="tb-sum-item">
          <span className="tb-sum-n">{totalArtifacts}</span>
          <span className="tb-sum-l">artifacts</span>
        </div>
        <div className="tb-sum-item">
          <span className="tb-sum-n">{totalCommits}</span>
          <span className="tb-sum-l">commits</span>
        </div>
        {savedStages > 0 && (
          <div className="tb-sum-item tb-sum-saved" title="Stages that benefited from caching">
            <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden><path d="M6 1.5 L3 7 L5.5 7 L4.5 10.5 L9 5 L6.5 5 Z" fill="currentColor"/></svg>
            <span className="tb-sum-n">{savedStages}/{build.length}</span>
            <span className="tb-sum-l">cached</span>
          </div>
        )}
      </div>

      {build.map(b => (
        <div className="tb-stage" key={b.stageId}>
          <div className="tb-stage-hdr">
            <span className="tb-stage-n">{b.stageName}</span>
            {b.timeSaved && (
              <span className="tb-saved" title="Time saved via caching">
                <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden><path d="M6 1.5 L3 7 L5.5 7 L4.5 10.5 L9 5 L6.5 5 Z" fill="currentColor"/></svg>
                <span>saved {b.timeSaved}</span>
              </span>
            )}
          </div>

          <div className="tb-kv">
            <span className="tb-k">Repository</span>
            <span className="tb-v tb-v-repo">
              <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
                <path d="M3 1.5 L9 1.5 Q10 1.5 10 2.5 L10 10 L3 10 Q2 10 2 9 Q2 8 3 8 L10 8" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
              </svg>
              <span className="mono">{b.repo}</span>
            </span>
          </div>

          <div className="tb-kv">
            <span className="tb-k">Branch{b.branches.dest ? 'es' : ''}</span>
            <span className="tb-v">
              <span className="tb-branch mono"><Ico.branch/> {b.branches.source}</span>
              {b.branches.dest && (
                <>
                  <span className="tb-arrow">→</span>
                  <span className="tb-branch mono is-dest"><Ico.branch/> {b.branches.dest}</span>
                </>
              )}
            </span>
          </div>

          {b.pr && (
            <div className="tb-kv">
              <span className="tb-k">Pull request</span>
              <a className="tb-v tb-pr" href="#" onClick={e=>e.preventDefault()}>
                <Ico.gitpr/>
                <span>#{b.pr}</span>
                <Ico.ext/>
              </a>
            </div>
          )}

          <div className="tb-kv tb-kv-stack">
            <span className="tb-k">Commits <span className="tb-k-n">{b.commits.length}</span></span>
            <div className="tb-commits">
              {b.commits.map(c => (
                <a key={c.sha} className="tb-commit" href="#" onClick={e=>e.preventDefault()}>
                  <span className="tb-commit-sha mono">{c.sha}</span>
                  <span className="tb-commit-msg">{c.msg}</span>
                  <span className="tb-commit-author">{c.author}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="tb-kv tb-kv-stack">
            <span className="tb-k">Artifacts {b.artifacts.length > 0 && <span className="tb-k-n">{b.artifacts.length}</span>}</span>
            {b.artifacts.length === 0 ? (
              <span className="tb-v tb-muted">None produced</span>
            ) : (
              <div className="tb-arts">
                {b.artifacts.map(a => (
                  <div key={a.name} className={`tb-art ${a.failed?'is-failed':''}`}>
                    <span className="tb-art-ic"><ArtifactIcon type={a.type}/></span>
                    <div className="tb-art-body">
                      <div className="tb-art-r1">
                        <span className="tb-art-name mono">{a.name}</span>
                        {a.version !== '—' && <span className="tb-art-ver mono">{a.version}</span>}
                      </div>
                      <div className="tb-art-r2">
                        <span className="tb-art-reg mono">{a.registry}</span>
                        <span className="tb-sep">·</span>
                        <span className="tb-art-size">{a.size}</span>
                      </div>
                    </div>
                    <a className="tb-art-ext" href="#" onClick={e=>e.preventDefault()} aria-label="Open"><Ico.ext/></a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Deploy tab — per CD stage: services (artifact ver) + environments
// ─────────────────────────────────────────────────────────────
function DeployTab({ s }) {
  const deploy = s?.deploy;
  if (!deploy || deploy.length === 0) {
    return <TabEmpty title="No deploy info" desc="This pipeline has no CD stages yet."/>;
  }

  const totalSvc = deploy.reduce((n, d) => n + (d.services?.length || 0), 0);
  const totalEnv = deploy.reduce((n, d) => n + (d.envs?.length || 0), 0);
  const deployedEnv = deploy.reduce((n, d) => n + (d.envs?.filter(e => e.status === 'ok').length || 0), 0);

  const stMap = (status) => ({
    ok: { cls:'ok', label:'Deployed' },
    pending: { cls:'pending', label:'Pending' },
    waiting: { cls:'waiting', label:'Awaiting approval' },
    blocked: { cls:'blocked', label:'Blocked' },
    failed: { cls:'failed', label:'Failed' },
  }[status] || { cls:'pending', label: status });

  return (
    <div className="tb tb-deploy">
      <div className="tb-summary">
        <div className="tb-sum-item">
          <span className="tb-sum-n">{deploy.length}</span>
          <span className="tb-sum-l">CD stages</span>
        </div>
        <div className="tb-sum-item">
          <span className="tb-sum-n">{totalSvc}</span>
          <span className="tb-sum-l">services</span>
        </div>
        <div className="tb-sum-item">
          <span className="tb-sum-n">{deployedEnv}<span className="tb-sum-sep">/</span>{totalEnv}</span>
          <span className="tb-sum-l">envs live</span>
        </div>
      </div>

      {deploy.map(d => {
        const stageStat = stMap(d.status);
        return (
          <div className={`tb-stage tb-cd-stage is-${stageStat.cls} ${d.blocked?'is-blocked':''}`} key={d.stageId}>
            <div className="tb-stage-hdr">
              <span className="tb-stage-n">{d.stageName}</span>
              <span className={`tb-stage-chip is-${stageStat.cls}`}>{stageStat.label}</span>
            </div>

            <div className="tb-kv tb-kv-stack">
              <span className="tb-k">Services {d.services.length > 0 && <span className="tb-k-n">{d.services.length}</span>}</span>
              <div className="tb-svcs">
                {d.services.map(sv => (
                  <div className="tb-svc" key={sv.name}>
                    <div className="tb-svc-head">
                      <span className="tb-svc-ic">
                        <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
                          <path d="M7 1.5 L12 4 L7 6.5 L2 4 Z M2 4 L2 10 L7 12.5 L12 10 L12 4 M7 6.5 L7 12.5" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <span className="tb-svc-name">{sv.name}</span>
                      <span className="tb-svc-ver mono">{sv.version}</span>
                    </div>
                    <div className="tb-svc-meta">
                      <span className="tb-svc-kind">{sv.kind} deploy</span>
                      {sv.delta && <><span className="tb-sep">·</span><span className="tb-svc-delta">{sv.delta}</span></>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="tb-kv tb-kv-stack">
              <span className="tb-k">Environments {d.envs.length > 0 && <span className="tb-k-n">{d.envs.length}</span>}</span>
              <div className="tb-envs">
                {d.envs.map(e => {
                  const est = stMap(e.status);
                  return (
                    <div className={`tb-env is-${est.cls}`} key={e.name}>
                      <span className={`tb-env-dot is-${est.cls}`}/>
                      <div className="tb-env-body">
                        <div className="tb-env-r1">
                          <span className="tb-env-name">{e.name}</span>
                          <span className="tb-env-region mono">{e.region}</span>
                        </div>
                        <div className="tb-env-r2">
                          <span className="tb-env-cluster mono">{e.cluster}</span>
                          <span className="tb-sep">·</span>
                          <span className="tb-env-url mono">{e.url}</span>
                        </div>
                        {e.deployedAt && (
                          <div className="tb-env-r3">
                            <span className={`tb-env-stat is-${est.cls}`}>{est.label}</span>
                            <span className="tb-sep">·</span>
                            <span className="tb-env-time">{e.deployedAt}</span>
                          </div>
                        )}
                        {!e.deployedAt && (
                          <div className="tb-env-r3">
                            <span className={`tb-env-stat is-${est.cls}`}>{est.label}</span>
                          </div>
                        )}
                      </div>
                      <a className="tb-env-ext" href="#" onClick={ev=>ev.preventDefault()} aria-label="Open service in Harness"><Ico.ext/></a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Security tab — severity tiles, new-vuln deltas, STO link
// ─────────────────────────────────────────────────────────────
function SecurityTab({ s }) {
  const sec = s?.security;
  if (!sec) return <TabEmpty title="No security scan" desc="This pipeline has no security scan configured."/>;

  if (sec.skipped) {
    return (
      <div className="tb tb-sec">
        <div className="sec-skipped">
          <Ico.shield/>
          <div>
            <div className="sec-skipped-t">Security scan skipped</div>
            <div className="sec-skipped-d">Earlier stage failed — scan did not run on this execution.</div>
          </div>
        </div>
      </div>
    );
  }

  const cats = [
    { id:'critical', label:'Critical', kind:'crit' },
    { id:'high',     label:'High',     kind:'high' },
    { id:'medium',   label:'Medium',   kind:'med' },
    { id:'low',      label:'Low',      kind:'low' },
    { id:'info',     label:'Info',     kind:'info' },
    { id:'exempted', label:'Exempted', kind:'exempt' },
  ];

  const totalFindings = cats.reduce((n, c) => n + (sec[c.id]?.total || 0), 0);
  const newCount = cats.reduce((n, c) => n + (sec[c.id]?.new || 0), 0);

  return (
    <div className="tb tb-sec">
      <div className="sec-scan-bar">
        <div className="sec-scan-l">
          <Ico.shield/>
          <span className="sec-scan-id mono">{sec.scanId}</span>
          {sec.running && <span className="sec-scan-live"><span className="sec-scan-live-dot"/> scanning…</span>}
        </div>
        <div className="sec-scan-r">
          {sec.tools?.map(t => <span key={t} className="sec-tool">{t}</span>)}
        </div>
      </div>

      <div className="sec-grid">
        {cats.map(c => {
          const v = sec[c.id] || { total: 0, new: 0 };
          return (
            <button key={c.id} className={`sev sev-${c.kind} ${v.total===0?'is-empty':''}`}>
              <span className="sev-lbl">{c.label}</span>
              <span className="sev-n">{v.total}</span>
              {v.new > 0 && (
                <span className="sev-new" title={`${v.new} new in this scan`}>
                  <span className="sev-new-arrow">▲</span>
                  {v.new} new
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="sec-total">
        <div className="sec-total-row">
          <span className="sec-total-l">Total findings</span>
          <span className="sec-total-n">{totalFindings}</span>
        </div>
        {newCount > 0 && (
          <div className="sec-total-row sec-total-row-new">
            <span className="sec-total-l">
              <span className="sec-new-ic">▲</span>
              New in this scan
            </span>
            <span className="sec-total-n sec-total-n-new">{newCount}</span>
          </div>
        )}
      </div>

      <a className="sec-sto-btn" href="#" onClick={e=>e.preventDefault()}>
        <Ico.shield/>
        <span className="sec-sto-l">Open in Harness STO</span>
        <Ico.ext/>
      </a>

      <div className="sec-meta">
        Scan triggered automatically by this pipeline. Findings include container images, IaC, SCA dependencies, and SAST.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function Tabs({ tab, setTab, policy, secTotals }) {
  const critHigh = (secTotals?.critical?.total || 0) + (secTotals?.high?.total || 0);
  const tabs = [
    {id:'main', label:'Pipeline'},
    {id:'ci',   label:'Build'},
    {id:'cd',   label:'Deploy'},
    {id:'sec',  label:'Security', badge: critHigh ? String(critHigh) : null, badgeKind:'err'},
  ];
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button key={t.id} className={`tab ${tab===t.id?'on':''}`} onClick={() => setTab(t.id)}>
          {t.label}
          {t.badge && <span className={`tab-badge ${t.badgeKind||''}`}>{t.badge}</span>}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stage / Step tree
// ─────────────────────────────────────────────────────────────
function StageTree({ stages, expanded, setExpanded, onPickStep, activeStepId, onApprove, onReject }) {
  return (
    <div className="stages">
      {stages.map((st, idx) => {
        const isOpen = expanded.has(st.id);
        const isLast = idx === stages.length - 1;
        return (
          <div key={st.id} className={`stage ${st.active?'is-active':''}`}>
            <button className="stage-row" onClick={() => {
              const n = new Set(expanded);
              if (n.has(st.id)) n.delete(st.id); else n.add(st.id);
              setExpanded(n);
            }}>
              <span className="stage-chev">{Ico.chev(isOpen?90:0)}</span>
              <span className={`stage-rail is-${st.status}`}/>
              <span className={`stage-stat is-${st.status}`}>{statusIcon(st.status)}</span>
              <span className={`stage-name is-${st.status}`}>{st.name}</span>
              {st.duration && <span className="stage-dur">{st.duration}</span>}
            </button>
            {isOpen && (st.steps?.length > 0) && (
              <div className="steps">
                {st.steps.map(step => (
                  <button key={step.id} className={`step-row ${activeStepId===step.id?'on':''} is-${step.status}`} onClick={() => onPickStep(step.id)}>
                    <span className={`step-stat is-${step.status}`}>{statusIcon(step.status)}</span>
                    <span className="step-name">{step.name}</span>
                    {step.duration && <span className="step-dur">{step.duration}</span>}
                    {step.status !== 'pending' && <span className="step-ext"><Ico.ext/></span>}
                  </button>
                ))}
              </div>
            )}
            {isOpen && st.approval && (
              <div className="approval">
                <div className="approval-hdr">
                  <Ico.shield/>
                  <span>Manual approval required</span>
                  <span className="approval-count">{st.approval.received}/{st.approval.required}</span>
                </div>
                <div className="approval-body">
                  <div className="approval-groups">
                    {st.approval.groups.map(g => <span key={g} className="approval-chip">{g}</span>)}
                  </div>
                  {st.approval.approvers?.length > 0 && (
                    <div className="approval-received">
                      <span className="approval-check"><Ico.check/></span>
                      Approved by {st.approval.approvers.join(', ')}
                    </div>
                  )}
                  <div className="approval-acts">
                    <button className="btn-approve" onClick={onApprove}><Ico.check/> Approve</button>
                    <button className="btn-reject" onClick={onReject}><Ico.x/> Reject</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Error banner
// ─────────────────────────────────────────────────────────────
function ErrorBanner({ text }) {
  return (
    <div className="err-banner">
      <span className="err-ic"><Ico.warn/></span>
      <div className="err-text">
        <strong>Pipeline failed</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Policy strip
// ─────────────────────────────────────────────────────────────
function PolicyStrip({ p }) {
  if (!p) return null;
  return (
    <div className="policy">
      <div className="policy-lbl">Policy</div>
      <div className="policy-vals">
        <span className="policy-val ok"><span className="dot"/>{p.passed} passed</span>
        {p.warning > 0 && <span className="policy-val warn"><span className="dot"/>{p.warning} warning</span>}
        {p.errored > 0 && <span className="policy-val err"><span className="dot"/>{p.errored} blocked</span>}
      </div>
      <a href="#" className="policy-ext" onClick={e=>e.preventDefault()}><Ico.ext/></a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Module rows
// ─────────────────────────────────────────────────────────────
function Modules({ mods }) {
  if (!mods?.length) return null;
  return (
    <div className="mods">
      <div className="mods-lbl">Modules</div>
      {mods.map(m => (
        <div key={m.tag} className="mod-row">
          <span className="mod-tag">{m.tag}</span>
          <span className={`mod-val is-${m.kind}`}>{m.val}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Log snippet
// ─────────────────────────────────────────────────────────────
function LogSnippet({ logs, onExpand }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);
  if (!logs) return null;
  return (
    <div className={`logs ${logs.failed?'is-failed':''}`}>
      <div className="logs-hdr">
        <span className="logs-title">
          <span className="logs-title-lbl">Logs</span>
          <span className="logs-title-step">{logs.stepName}</span>
          {logs.failed && <span className="logs-fail-chip">failed</span>}
        </span>
        <button className="logs-exp" onClick={onExpand} title="Open full log in a VS Code editor tab">Open in editor <Ico.ext/></button>
      </div>
      <div className="logs-body" ref={ref}>
        {logs.lines.map((l, i) => (
          <div key={i} className="log-line">
            <span className="log-ts">{l.ts}</span>
            <span className={`log-lvl lvl-${l.lvl}`}>{l.lvl.toUpperCase().padEnd(5,' ')}</span>
            <span className="log-txt">{l.txt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AI bar
// ─────────────────────────────────────────────────────────────
function AiBar() {
  const [val, setVal] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [focused, setFocused] = useState(false);
  const submit = () => {
    if (!val.trim()) return;
    setMsgs(m => [...m, {role:'user', text: val}, {role:'ai', text: 'Looking at the failed test in test/payments.integration.spec.ts · line 88 — `tokenize` is called before the stripe mock is initialized. Try moving the `beforeEach` setup into the describe block.'}]);
    setVal('');
  };
  return (
    <div className="ai">
      {msgs.length > 0 && (
        <div className="ai-msgs">
          {msgs.map((m, i) => (
            <div key={i} className={`ai-msg is-${m.role}`}>
              {m.role==='ai' && <span className="ai-msg-ic"><BrandMark size={12}/></span>}
              <span className="ai-msg-text">{m.text}</span>
            </div>
          ))}
        </div>
      )}
      <div className="ai-bar">
        <span className="ai-avatar"><BrandMark size={12}/></span>
        <input
          className="ai-input"
          placeholder="Ask about this pipeline…"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key==='Enter' && submit()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <button className="ai-send" onClick={submit} disabled={!val.trim()}><Ico.send/></button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty / idle state
// ─────────────────────────────────────────────────────────────
function EmptyState({ branch, sha }) {
  return (
    <div className="empty">
      <div className="empty-mark">
        <BrandMark size={32}/>
      </div>
      <div className="empty-title">No pipeline for this commit yet</div>
      <div className="empty-desc">Watching <span className="mono">{sha}</span> on <span className="mono">{branch}</span> — if you push a commit, it'll show up here.</div>
      <div className="empty-tips">
        <div className="empty-tip"><span className="empty-tip-k">⏱</span>Polls every 10s</div>
        <div className="empty-tip"><span className="empty-tip-k">↻</span>Refresh manually</div>
        <div className="empty-tip"><span className="empty-tip-k">⌘K</span>Pick another project</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// History list
// ─────────────────────────────────────────────────────────────
function HistoryList({ onPick }) {
  const [filter, setFilter] = React.useState('all');
  const [currentOnly, setCurrentOnly] = React.useState(false);

  // map prototype statuses → filter buckets
  const matches = (h) => {
    if (filter === 'failed')  return h.status === 'failed' || h.status === 'aborted';
    if (filter === 'success') return h.status === 'ok';
    if (filter === 'waiting') return h.status === 'waiting' || h.status === 'running';
    return true; // all
  };
  const rows = HISTORY.filter(h => matches(h) && (!currentOnly || h.current));

  const F = ({ id, label, count }) => (
    <button
      className={`f-pill ${filter===id?'on':''}`}
      onClick={() => setFilter(id)}
    >
      <span className="f-pill-lbl">{label}</span>
      {count != null && <span className="f-pill-count">{count}</span>}
    </button>
  );

  const counts = {
    all:     HISTORY.length,
    failed:  HISTORY.filter(h => h.status==='failed' || h.status==='aborted').length,
    success: HISTORY.filter(h => h.status==='ok').length,
    waiting: HISTORY.filter(h => h.status==='waiting' || h.status==='running').length,
  };

  return (
    <div className="history">
      <div className="hist-toolbar">
        <div className="hist-filters">
          <F id="all"     label="All"       count={counts.all}/>
          <F id="failed"  label="✕ Failed"  count={counts.failed}/>
          <F id="success" label="✓ Success" count={counts.success}/>
          <F id="waiting" label="⏱ Waiting" count={counts.waiting}/>
        </div>
        <label className={`hist-check ${currentOnly?'on':''}`} title="Only executions on your current checked-out commit">
          <input
            type="checkbox"
            checked={currentOnly}
            onChange={(e) => setCurrentOnly(e.target.checked)}
          />
          <span className="hist-check-box" aria-hidden="true">
            <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1.5 4.5 L3.5 6.5 L7.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <span className="hist-check-lbl">Current commit</span>
        </label>
      </div>

      <div className="history-hdr">
        <span>Executions</span>
        <span className="history-count">{rows.length}{rows.length !== HISTORY.length && <span className="history-count-total"> / {HISTORY.length}</span>}</span>
      </div>

      {rows.length === 0 ? (
        <div className="hist-empty">
          <div className="hist-empty-icon">○</div>
          <div className="hist-empty-lbl">No executions match these filters</div>
          <button className="hist-empty-reset" onClick={() => { setFilter('all'); setCurrentOnly(false); }}>Clear filters</button>
        </div>
      ) : rows.map(h => (
        <button key={h.id} className={`hist-row ${h.current?'is-current':''}`} onClick={() => onPick(h)}>
          <span className={`hist-dot is-${h.status}`}/>
          <div className="hist-body">
            <div className="hist-line-1">
              <span className="hist-id">{h.id}</span>
              <span className={`hist-badge is-${h.status}`}>{statusLabel(h.status)}</span>
              {h.current && <span className="hist-cur">your commit</span>}
            </div>
            <div className="hist-line-2">
              <span className="hist-branch">{h.branch}</span>
              <span className="hist-sha">{h.sha}</span>
              <span className="hist-sep">·</span>
              <span className="hist-author">{h.author}</span>
              <span className="hist-sep">·</span>
              <span className="hist-time">{h.time} ago</span>
            </div>
          </div>
          <div className="hist-tags">
            {h.tags.map(t => <span key={t} className={`hist-tag tag-${t}`}>{t.toUpperCase()}</span>)}
          </div>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Log detail view (full panel)
// ─────────────────────────────────────────────────────────────
function LogDetail({ scenario, onBack }) {
  const logs = scenario.logs || SCENARIOS.failed.logs;
  return (
    <div className="log-detail">
      <div className="back-bar">
        <button className="back-btn" onClick={onBack}>← Pipeline</button>
        <span className="back-sep">/</span>
        <span className="back-crumb">Test & Scan</span>
        <span className="back-sep">/</span>
        <span className="back-crumb on">{logs.stepName}</span>
      </div>
      <div className="logd-hdr">
        <div className="logd-title">
          <span className={`logd-stat is-${logs.failed?'failed':'ok'}`}>{statusIcon(logs.failed?'failed':'ok')}</span>
          <span className="logd-name">{logs.stepName}</span>
          <span className="logd-dur">13s · exit 1</span>
        </div>
        <div className="logd-acts">
          <button className="logd-btn">Re-run</button>
          <button className="logd-btn">Open full log</button>
        </div>
      </div>
      <div className="logd-body">
        {logs.lines.map((l, i) => (
          <div key={i} className={`log-line big lvl-line-${l.lvl}`}>
            <span className="log-lno">{String(i+1).padStart(3,' ')}</span>
            <span className="log-ts">{l.ts}</span>
            <span className={`log-lvl lvl-${l.lvl}`}>{l.lvl.toUpperCase().padEnd(5,' ')}</span>
            <span className="log-txt">{l.txt}</span>
          </div>
        ))}
      </div>
      <div className="logd-adj">
        <button className="adj-btn">← Previous step<span className="adj-name">unit tests</span></button>
        <button className="adj-btn disabled">Next step →<span className="adj-name">security scan</span></button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────
function PipelinePanel({ scenarioKey = 'running', variant = 'classic', showAiBar = true, showGitBar = true, brandLabel = 'Pipeline', pipelinesLayout = 'cards', pipelinesRunStrip = 'squares', initialView }) {
  const startView = initialView
    || (scenarioKey === 'history' ? 'all'
        : scenarioKey === 'pipelinesempty' ? 'pipelines'
        : 'commit');
  const [view, setView] = useState(startView);
  const [pinned, setPinned] = useState(false);
  const [tab, setTab] = useState('main');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('pipelines');
  const [acctOpen, setAcctOpen] = useState(false);
  const [acct, setAcct] = useState({ org: 'acme', project: 'payments' });
  const [filteredPipeline, setFilteredPipeline] = useState(null);
  const [viewMode, setViewMode] = useState(scenarioKey === 'logdetail' ? 'logdetail' : 'main');
  const [activeStepId, setActiveStepId] = useState(null);
  const [logOpenedToast, setLogOpenedToast] = useState(false);

  const scenario = scenarioKey === 'empty' ? null : (SCENARIOS[scenarioKey] || SCENARIOS.running);
  const defaultExpanded = useMemo(() => {
    const s = new Set();
    if (!scenario) return s;
    const stages = scenario.stages;
    // Find the "current" stage: first running/waiting/failed; otherwise the last stage.
    const currentIdx = stages.findIndex(st => st.status === 'running' || st.status === 'waiting' || st.status === 'failed');
    const focusIdx = currentIdx === -1 ? stages.length - 1 : currentIdx;
    if (stages[focusIdx]) s.add(stages[focusIdx].id);
    return s;
  }, [scenarioKey]);
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => { setExpanded(defaultExpanded); }, [scenarioKey]);

  const activeLogs = useMemo(() => {
    if (!scenario?.logs) return null;
    if (activeStepId && activeStepId !== scenario.logs.stepId) {
      // pretend to show different log for different step
      return { ...scenario.logs, stepName: scenario.stages.flatMap(s=>s.steps).find(st=>st.id===activeStepId)?.name || scenario.logs.stepName };
    }
    return scenario.logs;
  }, [scenario, activeStepId]);

  if (viewMode === 'logdetail' && scenario) {
    return (
      <div className={`panel variant-${variant}`}>
        <Header onMenu={() => setMenuOpen(true)} brandLabel={brandLabel} org={acct.org} project={acct.project}/>
        <AppMenu open={menuOpen} onClose={() => setMenuOpen(false)} onPick={setActiveSection} active={activeSection} org={acct.org} project={acct.project} onChangeAccount={() => { setMenuOpen(false); setAcctOpen(true); }}/>
        <AccountPicker open={acctOpen} onClose={() => setAcctOpen(false)} org={acct.org} project={acct.project} onApply={(org, project) => setAcct({org, project})}/>
        <LogDetail scenario={scenario} onBack={() => setViewMode('main')}/>
        <AiBar/>
      </div>
    );
  }

  return (
    <div className={`panel variant-${variant}`}>
      <Header onMenu={() => setMenuOpen(true)} brandLabel={brandLabel} org={acct.org} project={acct.project}/>
      <AppMenu open={menuOpen} onClose={() => setMenuOpen(false)} onPick={setActiveSection} active={activeSection} org={acct.org} project={acct.project} onChangeAccount={() => { setMenuOpen(false); setAcctOpen(true); }}/>
      <AccountPicker open={acctOpen} onClose={() => setAcctOpen(false)} org={acct.org} project={acct.project} onApply={(org, project) => setAcct({org, project})}/>

      <ViewToggle view={view} setView={setView} pinned={pinned} setPinned={setPinned} running={scenario?.status==='running'} filtered={filteredPipeline?.name}/>

      {view === 'pipelines' ? (
        <PipelinesList
          layout={pipelinesLayout}
          runStrip={pipelinesRunStrip}
          empty={scenarioKey === 'pipelinesempty'}
          onOpenExec={(p) => { setFilteredPipeline(p); setView('all'); }}
          onEditYaml={(p) => console.log('edit yaml', p.id)}
        />
      ) : view === 'all' ? (
        <div className="panel-scroll">
          {filteredPipeline && (
            <div className="exec-filter-chip">
              <svg width="10" height="10" viewBox="0 0 12 12"><circle cx="4" cy="4" r="1.5" fill="currentColor"/><circle cx="9" cy="4" r="1.5" fill="currentColor" opacity="0.55"/><circle cx="6" cy="9" r="1.5" fill="currentColor"/></svg>
              <span className="exec-filter-name">{filteredPipeline.name}</span>
              <button className="exec-filter-x" onClick={() => setFilteredPipeline(null)} aria-label="Clear filter">
                <svg width="9" height="9" viewBox="0 0 10 10"><path d="M2 2 L8 8 M8 2 L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              </button>
            </div>
          )}
          <HistoryList onPick={() => setView('commit')}/>
        </div>
      ) : scenario ? (
        <>
          {showGitBar && <GitBar branch={scenario.branch} sha={scenario.sha} time={scenario.time} commit={scenario.commit}/>}
          <PipelineCard s={scenario} onRerun={(m) => console.log('rerun', m)}/>
          <Tabs tab={tab} setTab={setTab} policy={scenario.policy} secTotals={scenario.security}/>
          <div className="panel-scroll">
            {tab === 'main' && <>
              {scenario.status === 'failed' && scenario.error && <ErrorBanner text={scenario.error}/>}
              <StageTree
                stages={scenario.stages}
                expanded={expanded}
                setExpanded={setExpanded}
                onPickStep={(id) => { setActiveStepId(id); }}
                activeStepId={activeStepId || scenario.logs?.stepId}
                onApprove={() => alert('Approved')}
                onReject={() => alert('Rejected')}
              />
              <PolicyStrip p={scenario.policy}/>
              <Modules mods={scenario.modules}/>
            </>}
            {tab === 'ci'  && <BuildTab s={scenario}/>}
            {tab === 'cd'  && <DeployTab s={scenario}/>}
            {tab === 'sec' && <SecurityTab s={scenario}/>}
          </div>
          {tab === 'main' && activeLogs && <LogSnippet logs={activeLogs} onExpand={() => { setLogOpenedToast(true); setTimeout(()=>setLogOpenedToast(false), 2400); }}/>}
          {logOpenedToast && (
            <div className="toast">
              <span className="toast-ic"><Ico.ext/></span>
              <span>Opened log in editor tab</span>
            </div>
          )}
        </>
      ) : (
        <>
          <GitBar branch="feat/onboarding" sha="3ac912f" time="just now" commit="draft: onboarding polish"/>
          <div className="panel-scroll">
            <EmptyState branch="feat/onboarding" sha="3ac912f"/>
          </div>
        </>
      )}

      {showAiBar && <AiBar/>}
    </div>
  );
}

window.PipelinePanel = PipelinePanel;
window.BrandMark = BrandMark;
window.SCENARIOS = SCENARIOS;
