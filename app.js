const State = { UNDER_REVIEW:'Under Review', AWAITING:'Awaiting Customer', PENDING:'Pending Checker Review', ESCALATED:'Escalated', CLOSED:'Closed' };
const order = { close:1, rfi:2, escalate:3 };
const labels = { close:'Close', rfi:'Request More Information', escalate:'Escalate' };
let lifecycle = State.UNDER_REVIEW;
let caseRecommendation = 'rfi';
let activeRecommendation = 'rfi';
let action = 'rfi';
let audit = [...CASE.initialAudit];
let pendingProposal = null;
let overrideClosure = null;
let escalation = null;
let seniorCaseOpen = false;

const $ = id => document.getElementById(id);
const escapeHtml = text => String(text).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const now = () => 'Now';
function addAudit(actor, event, detail, expandedText='') { audit.push([now(), actor, event, detail, expandedText]); renderAudit(); renderSenior(); }
function statusClass() { return ({[State.UNDER_REVIEW]:'open',[State.AWAITING]:'await',[State.PENDING]:'pending',[State.ESCALATED]:'escalated',[State.CLOSED]:'closed'})[lifecycle]; }
function setLifecycle(next) { lifecycle=next; ['headerStatus','queueStatus'].forEach(id=>{ const e=$(id); e.className='chip '+statusClass(); e.textContent=next; }); renderPanel(); renderGaps(); renderOverride(); renderSenior(); }
function defaultRecommendation() { return lifecycle===State.UNDER_REVIEW ? caseRecommendation : caseRecommendation; }
function renderAudit() {
  const rows=audit.map(r => `<tr><td>${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td>${r[4]?`<details><summary>${r[3]}</summary><pre>${escapeHtml(r[4])}</pre></details>`:r[3]}</td></tr>`).join('');
  $('auditRows').innerHTML = rows;
  $('seniorAuditRows').innerHTML = rows;
  $('auditCount').textContent=audit.length;
}
function renderGaps() {
  const initial = caseRecommendation==='rfi';
  const gaps = initial ? [
    ['MISSING','Supporting document for SGD 14K to Meridian Trading FZE; relationship evidence for all three new counterparties; explanation for six-transfer split.'],
    ['UNAVAILABLE','Corporate-registry ownership lookup for Meridian Trading FZE temporarily unavailable — this is not a no-risk finding.'],
    ['PARTIAL','Available invoices reconcile SGD 34K of SGD 48K.']
  ] : [
    ['RECEIVED','Meridian invoice, purchase-order evidence, commercial relationship context, and explanation for the six-transfer split received.'],
    ['AVAILABLE','Corporate-registry lookup recovered; Meridian is confirmed as an active electronics supplier with no identified ownership/director linkage to Northstar.'],
    ['RESOLVED','Supporting documents now reconcile all SGD 48K across six transfers.']
  ];
  $('gapsContent').innerHTML=gaps.map(g=>`<div class="gap ${initial?'':'resolved'}"><b>${g[0]}</b><span>${g[1]}</span></div>`).join('');
}
function renderOverride(){
  const callout=$('overrideCallout');
  if(!overrideClosure){ callout.classList.add('hide'); return; }
  callout.classList.remove('hide');
  callout.innerHTML=`<b>Closed via checker-approved analyst override</b><br>AI recommendation at disposition: ${labels[overrideClosure.recommendation]} · Analyst proposed: ${labels[overrideClosure.action]}. Independent checker approved closure despite unresolved evidence gaps. Analyst and checker rationale are retained in the audit trail.`;
}
function renderAssessment() {
  $('aiRec').textContent=labels[activeRecommendation];
  $('aiReason').textContent=CASE.recommendations[activeRecommendation];
  const resolved=caseRecommendation==='close';
  $('evidenceComplete').textContent=`Evidence completeness: ${resolved?'High':'Medium'}`;
  $('reasoningConfidence').textContent=`Reasoning confidence: ${resolved?'High':'Medium'}`;
  $('evidenceHealth').textContent=`Evidence health: ${resolved?'9/9':'7/9'} areas available`;
  $('demoAI').value=activeRecommendation;
}
function renderSenior(){
  const available=lifecycle===State.ESCALATED;
  $('seniorQueueEmpty').classList.toggle('hide',available);
  $('seniorCase').classList.toggle('hide',!available);
  if(!available){ $('seniorDetail').classList.add('hide'); $('seniorEmpty').classList.remove('hide'); return; }
  $('seniorQueueReason').textContent=`Escalated: ${escalation?.reason||'Analyst handoff'}`;
  const owner=escalation?.owner||'Senior Compliance / Investigation Team';
  $('seniorQueueOwner').textContent=owner; $('seniorOwner').textContent=owner;
  if(!seniorCaseOpen) return;
  $('seniorEmpty').classList.add('hide'); $('seniorDetail').classList.remove('hide');
  $('seniorSummary').innerHTML=`<p><b>Escalated by:</b> ${CASE.analyst}</p><p><b>Reason:</b> ${escapeHtml(escalation.reason)}</p><p><b>Analyst rationale:</b> ${escapeHtml(escalation.rationale)}</p><p><b>Priority:</b> P1 · High</p><p><b>Escalation timestamp:</b> ${escalation.time}</p>`;
  $('seniorAi').textContent=`${labels[escalation.recommendation]} — ${CASE.recommendations[escalation.recommendation]}`;
  $('seniorGaps').innerHTML=caseRecommendation==='rfi' ? 'Unresolved: missing support for SGD 14K, partial documents (SGD 34K / SGD 48K), and unavailable Meridian registry lookup. Northstar is a medium-risk Singapore electronics wholesaler; Meridian is a first UAE beneficiary.' : 'Evidence resolved: all SGD 48K reconciled; Meridian registry recovered and relationship context received.';
  $('seniorWorkflow').textContent=`Prior analyst workflow is retained in the audit trail. ${audit.some(r=>r[2]==='RFI v1 sent')?'RFI history and customer response are available. ':''}${audit.some(r=>r[2].startsWith('Checker'))?'Checker decision is available. ':''}`;
  if(escalation.owner){ $('takeOwnership').disabled=true; $('takeOwnership').textContent='Ownership accepted'; $('seniorActionText').textContent='Senior investigation continues outside MVP prototype.'; }
}
function setAction(next) { if (lifecycle!==State.UNDER_REVIEW) return; action=next; document.querySelectorAll('.action').forEach(b=>b.classList.toggle('selected',b.dataset.action===action)); renderPanel(); }
function isLowerScrutiny() { return order[action] < order[activeRecommendation]; }
function lockDisposition() { return lifecycle!==State.UNDER_REVIEW; }
function renderPanel() {
  const locked=lockDisposition();
  document.querySelectorAll('.action').forEach(b=>b.disabled=locked);
  $('demoAI').disabled=locked;
  $('resetAI').disabled=locked;
  $('handoff').classList.toggle('hide', lifecycle!==State.ESCALATED);
  if(lifecycle===State.ESCALATED) $('handoff').innerHTML='<b>Ownership moved</b><br>Destination: Senior Compliance / Investigation Team.';
  if(lifecycle===State.AWAITING){ $('controlText').className='control info'; $('controlText').innerHTML='<b>Analyst Work SLA Paused</b><br>Customer Response Timer Running. Disposition actions are locked while supporting information is outstanding.'; $('submitBtn').disabled=false; $('submitBtn').textContent='Simulate Customer Response'; return; }
  if(lifecycle===State.PENDING){ $('controlText').className='control warn'; $('controlText').innerHTML='<b>Independent review pending</b><br>The analyst proposal is locked until checker approval or rejection.'; $('submitBtn').disabled=true; $('submitBtn').textContent='Awaiting checker review'; return; }
  if(lifecycle===State.CLOSED){ $('controlText').className='control ok'; $('controlText').innerHTML='<b>Case closed</b><br>No further analyst disposition actions are available.'; $('submitBtn').disabled=true; $('submitBtn').textContent='Case closed'; return; }
  if(lifecycle===State.ESCALATED){ $('controlText').className='control info'; $('controlText').innerHTML='<b>Escalation handed off</b><br>Senior Compliance / Investigation Team owns the next step.'; $('submitBtn').disabled=true; $('submitBtn').textContent='Case escalated'; return; }
  const c=$('controlText'), btn=$('submitBtn'); btn.disabled=false;
  if(isLowerScrutiny()){ c.className='control warn'; c.innerHTML='<b>Independent review required</b><br>You are proposing a lower level of scrutiny than the active AI recommendation. Add your rationale and submit for checker review.'; btn.textContent='Submit for checker review'; }
  else if(activeRecommendation!==action){ c.className='control ok'; c.innerHTML='<b>More scrutiny allowed</b><br>Your action applies more scrutiny than the active AI recommendation. No checker is required.'; btn.textContent=action==='rfi'?'Prepare RFI':'Submit decision'; }
  else { c.className='control'; c.innerHTML='<b>Policy check</b><br>Action matches the active AI recommendation. No independent checker is required for P1 alone.'; btn.textContent=action==='rfi'?'Prepare RFI':'Submit decision'; }
}
function setRecommendation(next, source='demo') {
  activeRecommendation=next; renderAssessment(); renderPanel();
  if(source==='demo') addAudit('System','Prototype control changed',`Active simulated AI recommendation set to ${labels[next]} for control demonstration.`);
}
function resetRecommendation(){ setRecommendation(caseRecommendation,'reset'); addAudit('System','Prototype control reset',`Active AI recommendation restored to the case recommendation: ${labels[caseRecommendation]}.`); }
function setFieldError(inputId,errorId,show){ $(inputId).classList.toggle('field-invalid',show); $(errorId).classList.toggle('hide',!show); }
function requireRationale(){ const rationale=$('rationale').value.trim(); const missing=!rationale; setFieldError('rationale','rationaleError',missing); if(missing){ $('rationale').focus(); return null; } return rationale; }
function requireCheckerRationale(){ const rationale=$('checkerRationaleInput').value.trim(); const missing=!rationale; setFieldError('checkerRationaleInput','checkerRationaleError',missing); if(missing){ $('checkerRationaleInput').focus(); return null; } return rationale; }
function submitDecision(){
  if(lifecycle===State.AWAITING){ $('responseModal').classList.add('show'); return; }
  if(lifecycle!==State.UNDER_REVIEW) return;
  const rationale=requireRationale(); if(!rationale) return;
  if(isLowerScrutiny()) { pendingProposal={action,rationale,recommendation:activeRecommendation}; addAudit(CASE.analyst,'Control trigger',`Lower-scrutiny override proposed: AI ${labels[activeRecommendation]}, analyst ${labels[action]}.`); addAudit('System','Case transition','Case moved to Pending Checker Review; independent review is required before the proposed disposition can be executed.'); setLifecycle(State.PENDING); populateChecker(); $('checkerModal').classList.add('show'); return; }
  executeAction(action,rationale);
}
function executeAction(next,rationale,fromChecker=false,checkerRationale=''){
  if(next==='rfi'){ $('rfiText').value=CASE.rfiText; $('rfiModal').classList.add('show'); return; }
  if(next==='close'){
    addAudit(CASE.analyst,'Final case disposition','Closed: '+escapeHtml(rationale)); setLifecycle(State.CLOSED); return;
  }
  escalation={reason:labels.escalate+' required',rationale,recommendation:activeRecommendation,time:now(),owner:null};
  addAudit(CASE.analyst,'Case escalated',`Handoff to Senior Compliance / Investigation Team. Reason: ${escapeHtml(rationale)}. AI recommendation at escalation: ${labels[activeRecommendation]}.`); setLifecycle(State.ESCALATED);
}
function sendRfi(){
  const finalText=$('rfiText').value.trim(); if(!finalText){ $('rfiText').focus(); return; }
  $('rfiModal').classList.remove('show'); addAudit(CASE.analyst,'Analyst decision',`Request More Information selected. Analyst rationale: ${escapeHtml($('rationale').value.trim())}`); addAudit('System','RFI v1 sent','Exact RFI retained for review.',finalText); addAudit('System','Case transition','Case moved to Awaiting Customer; analyst work SLA paused and customer response timer started.'); setLifecycle(State.AWAITING);
}
function applyResponse(){
  $('responseModal').classList.remove('show'); caseRecommendation='close'; activeRecommendation='close';
  addAudit('Customer','Response received','Missing invoice uploaded; six purchase orders and relationship context explained.');
  addAudit('System','Evidence status changed','Previously missing and partial documents resolved; registry lookup recovered and is now available.');
  addAudit('AI Copilot','AI reassessment','Simulated output recommends Close; evidence now reconciles to all six transfers.');
  setLifecycle(State.UNDER_REVIEW); $('rationale').value='Customer response and recovered registry evidence establish a plausible commercial purpose; documents reconcile to all transfers.'; $('invoiceEvidence').innerHTML='<i class="icon green"></i>Supporting documents now reconcile all six payments (SGD 48K).'; action='close'; document.querySelectorAll('.action').forEach(b=>b.classList.toggle('selected',b.dataset.action===action)); renderGaps(); renderAssessment(); renderPanel();
}
function populateChecker(){ $('checkerAi').textContent=labels[pendingProposal.recommendation]; $('checkerAction').textContent=labels[pendingProposal.action]; $('checkerRationale').textContent=pendingProposal.rationale; $('checkerRationaleInput').value=''; setFieldError('checkerRationaleInput','checkerRationaleError',false); }
function checkerAuditDetail(decision,proposal,checkerRationale){ return `${decision}. AI recommendation at review: ${labels[proposal.recommendation]}. Analyst proposed: ${labels[proposal.action]}. Analyst rationale: ${escapeHtml(proposal.rationale)}. Checker rationale: ${escapeHtml(checkerRationale)}.`; }
function approveChecker(){ if(!pendingProposal) return; const checkerRationale=requireCheckerRationale(); if(!checkerRationale) return; const proposal=pendingProposal; $('checkerModal').classList.remove('show'); addAudit(CASE.checker,'Checker approval',checkerAuditDetail('Approved analyst decision',proposal,checkerRationale)); if(proposal.action==='close') overrideClosure={recommendation:proposal.recommendation,action:proposal.action,checkerRationale}; pendingProposal=null; if(proposal.action==='rfi'){ setLifecycle(State.UNDER_REVIEW); executeAction('rfi',proposal.rationale,true,checkerRationale); } else executeAction(proposal.action,proposal.rationale,true,checkerRationale); }
function rejectChecker(){ if(!pendingProposal) return; const checkerRationale=requireCheckerRationale(); if(!checkerRationale) return; const proposal=pendingProposal; $('checkerModal').classList.remove('show'); addAudit(CASE.checker,'Checker rejection',checkerAuditDetail('Returned proposal to analyst review',proposal,checkerRationale)); pendingProposal=null; setLifecycle(State.UNDER_REVIEW); }
function setRole(role){
  const senior=role==='senior';
  $('analystShell').classList.toggle('hide',senior); $('panelBtn').classList.toggle('hide',senior); $('seniorView').classList.toggle('hide',!senior);
  document.querySelectorAll('[data-role]').forEach(b=>b.classList.toggle('active',b.dataset.role===role));
  if(senior) renderSenior();
}
function openSeniorCase(){ if(lifecycle!==State.ESCALATED) return; seniorCaseOpen=true; renderSenior(); }
function takeOwnership(){ if(lifecycle!==State.ESCALATED || escalation?.owner) return; escalation.owner='A. Tan'; addAudit('A. Tan','Ownership accepted','Senior Compliance / Investigation Team handoff accepted; senior investigation continues outside MVP prototype.'); renderSenior(); }
function bind(){
  document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>setAction(b.dataset.action)));
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{ const auditTab=b.dataset.tab==='audit'; $('workspace').style.display=auditTab?'none':'block'; $('audit').classList.toggle('show',auditTab); document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b)); }));
  $('submitBtn').addEventListener('click',submitDecision); $('demoAI').addEventListener('change',e=>setRecommendation(e.target.value)); $('resetAI').addEventListener('click',resetRecommendation); $('cancelRfi').addEventListener('click',()=>$('rfiModal').classList.remove('show')); $('sendRfi').addEventListener('click',sendRfi); $('applyResponse').addEventListener('click',applyResponse); $('approveChecker').addEventListener('click',approveChecker); $('rejectChecker').addEventListener('click',rejectChecker); $('panelBtn').addEventListener('click',()=>$('decisionPanel').classList.toggle('show')); $('rationale').addEventListener('input',e=>{if(e.target.value.trim())setFieldError('rationale','rationaleError',false)}); $('checkerRationaleInput').addEventListener('input',e=>{if(e.target.value.trim())setFieldError('checkerRationaleInput','checkerRationaleError',false)}); document.querySelectorAll('[data-role]').forEach(b=>b.addEventListener('click',()=>setRole(b.dataset.role))); $('seniorCase').addEventListener('click',openSeniorCase); $('takeOwnership').addEventListener('click',takeOwnership);
}
bind(); renderAudit(); renderGaps(); renderAssessment(); renderPanel(); renderOverride(); renderSenior();
