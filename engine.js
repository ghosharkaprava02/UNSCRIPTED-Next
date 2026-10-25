/* Shared, deterministic permission engine. No model, network or transaction access. */
(function (root) {
  'use strict';
  /**
   * @typedef {{id:string,kind:'career'|'finance'|'privacy'|'routine',title:string,amount?:number,recipient:string,dataCategories:string[],sourcePreference?:{text:string,date:string,context?:string},stakes:'low'|'high',reversibility:'easy'|'difficult'|'irreversible',deadline?:string}} ProposedAction
   * @typedef {{enabled:boolean,scope:string,cap?:number,expires:string,confirmationRequired:boolean,freshnessDays:number,allowedRecipients:string[],context:string}} IntentContract
   * @typedef {{id:string,timestamp:string,agentProposal:ProposedAction,sourcePreference:Object,humanFirstChoice:Object|null,contractSnapshot:IntentContract,evaluation:Evaluation,authorization:Object,outcome:string,seeded:boolean}} DecisionPassport
   */
  const NOW = '2040-10-24T09:00:00+05:30';
  const defaults = () => ({
    career: { enabled: true, scope: 'career', expires: '2040-12-31', confirmationRequired: true, freshnessDays: 365, allowedRecipients: ['tokyo-employer.example'], context: 'Career correspondence; final job decisions remain mine.' },
    finance: { enabled: true, scope: 'finance', cap: 25000, expires: '2040-12-31', confirmationRequired: true, freshnessDays: 365, allowedRecipients: ['investment-platform.example'], context: 'One proposed investment per authorization. No portfolio-wide mandate.' },
    privacy: { enabled: true, scope: 'privacy', expires: '2040-12-31', confirmationRequired: false, freshnessDays: 365, allowedRecipients: ['plan-service.example'], context: 'Generic planning only. Never disclose another person’s sensitive data.' },
    routine: { enabled: true, scope: 'routine', cap: 1500, expires: '2040-12-31', confirmationRequired: false, freshnessDays: 365, allowedRecipients: ['grocer.example', 'calendar.local'], context: 'Groceries and calendar housekeeping within the agreed limits.' }
  });
  const actions = {
    tokyo: { id: 'tokyo-offer', kind: 'career', title: 'Reject the Tokyo offer', recipient: 'tokyo-employer.example', dataCategories: [], sourcePreference: { text: 'I want to stay in India.', date: '2036-06-18', context: 'Location preference recorded four years ago' }, stakes: 'high', reversibility: 'difficult', deadline: '2040-10-26T09:00:00+05:30' },
    finance: { id: 'investment', kind: 'finance', title: 'Invest ₹2,00,000', amount: 200000, recipient: 'investment-platform.example', dataCategories: [], sourcePreference: { text: 'Invest surplus income for long-term growth.', date: '2040-10-01' }, stakes: 'high', reversibility: 'difficult' },
    privacy: { id: 'private-plan', kind: 'privacy', title: 'Send a friend’s private details', recipient: 'plan-service.example', dataCategories: ['third-party-private-chat', 'third-party-contact', 'third-party-health'], sourcePreference: { text: 'Arrange a weekend trip with friends.', date: '2040-10-23' }, stakes: 'high', reversibility: 'irreversible' },
    minimized: { id: 'generic-plan', kind: 'privacy', title: 'Request a generic weekend itinerary', recipient: 'plan-service.example', dataCategories: [], sourcePreference: { text: 'Arrange a weekend trip with friends.', date: '2040-10-23' }, stakes: 'low', reversibility: 'easy' },
    routine: { id: 'groceries', kind: 'routine', title: 'Reorder weekly groceries', amount: 820, recipient: 'grocer.example', dataCategories: [], sourcePreference: { text: 'Reorder my weekly essentials.', date: '2040-10-21' }, stakes: 'low', reversibility: 'easy' }
  };
  /** @typedef {{route:'EXECUTE'|'REVIEW'|'BLOCK', ruleIds:string[], rationale:string[], checks:Object[]}} Evaluation */
  function evaluate(action, contract, opts = {}) {
    const now = opts.now || NOW;
    const checks = [];
    const add = (dimension, rule, status, reason) => checks.push({ dimension, rule, status, reason });
    const valid = contract && contract.enabled && contract.scope === action.kind;
    add('Authority', 'AUTH-01', valid ? 'PASS' : 'BLOCK', valid ? 'Action is inside the enabled contract scope.' : 'No enabled contract grants this action scope.');
    if (!valid) return finish(checks);
    const fresh = /^\d{4}-\d{2}-\d{2}$/.test(contract.expires) && contract.expires >= now.slice(0, 10);
    add('Intent', 'INT-01', fresh ? 'PASS' : 'BLOCK', fresh ? 'Contract is within its validity period.' : 'Contract expired or has an invalid expiry. Renew it before proceeding.');
    const recipientOK = contract.allowedRecipients.includes(action.recipient);
    add('Authority', 'AUTH-02', recipientOK ? 'PASS' : 'BLOCK', recipientOK ? 'Recipient is explicitly allowed.' : 'Recipient is outside the allowed list.');
    if (action.amount !== undefined) {
      const under = Number.isFinite(contract.cap) && contract.cap >= 0 && action.amount <= contract.cap;
      add('Authority', 'AUTH-03', under ? 'PASS' : 'BLOCK', under ? `₹${action.amount.toLocaleString('en-IN')} is within the ₹${contract.cap.toLocaleString('en-IN')} cap.` : `₹${action.amount.toLocaleString('en-IN')} exceeds the ₹${Number(contract.cap || 0).toLocaleString('en-IN')} cap.`);
    }
    const sensitive = (action.dataCategories || []).some(x => x.startsWith('third-party-'));
    // The prototype has no verified third-party consent infrastructure; a user toggle cannot grant it.
    add('Privacy', 'PRIV-01', sensitive ? 'BLOCK' : 'PASS', sensitive ? 'Another person’s sensitive information has no verified, recipient-specific disclosure basis.' : 'No third-party private data is in this payload.');
    if (action.sourcePreference) {
      const age = (new Date(now) - new Date(action.sourcePreference.date)) / 86400000;
      const stale = !Number.isFinite(age) || age < 0 || age > contract.freshnessDays;
      add('Intent', 'INT-02', stale ? 'REVIEW' : 'PASS', stale ? 'The source preference is stale or invalid. Capture current intent.' : 'Source preference is within the freshness window.');
    }
    const consequential = action.stakes === 'high' || action.reversibility !== 'easy';
    add('Consequence', 'CONS-01', consequential || contract.confirmationRequired ? 'REVIEW' : 'PASS', consequential || contract.confirmationRequired ? 'This action needs a present, action-specific human authorization.' : 'Routine, reversible action can proceed within the contract.');
    return finish(checks);
  }
  function finish(checks) {
    const route = checks.some(c => c.status === 'BLOCK') ? 'BLOCK' : checks.some(c => c.status === 'REVIEW') ? 'REVIEW' : 'EXECUTE';
    const relevant = checks.filter(c => route === 'EXECUTE' || c.status === route);
    return { route, ruleIds: relevant.map(c => c.rule), rationale: relevant.map(c => c.reason), checks };
  }
  function authorize(action, contract, authorization, now = NOW) {
    const evaluation = evaluate(action, contract, { now });
    if (evaluation.route === 'BLOCK') return { allowed: false, evaluation, reason: 'Policy block must be resolved before authorization.' };
    if (evaluation.route === 'EXECUTE') return { allowed: true, evaluation, reason: 'Delegated action is inside the contract.' };
    const current = authorization && authorization.actionId === action.id && authorization.explicit === true && authorization.choice === 'approve' && authorization.at === now;
    return { allowed: !!current, evaluation, reason: current ? 'Current, explicit authorization for this exact action.' : 'Waiting for current, action-specific authorization.' };
  }
  const api = { NOW, defaults, actions, evaluate, authorize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Sovereignty = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
