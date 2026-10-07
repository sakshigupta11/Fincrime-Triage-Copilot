const CASE = {
  analyst: 'Meera Shah', checker: 'A. Tan · Independent Checker',
  rfiText: `Please provide:\n• Invoice, purchase order, or contract supporting the SGD 14,000 payment to Meridian Trading FZE.\n• An explanation of the commercial relationship with Apex Components Ltd, Orion Supply Co, and Meridian Trading FZE.\n• The reason SGD 48,000 was split across six transfers.\n• Confirmation of the goods or services purchased.`,
  recommendations: {
    close: 'Supporting documents reconcile to all six transfers and registry information establishes a plausible operating counterparty with no identified customer ownership linkage.',
    rfi: 'The anomaly is clear, but economic purpose is not sufficiently established.',
    escalate: 'The evidence pattern warrants senior review before a final disposition is made.'
  },
  initialAudit: [
    ['09:06','System','Alert created','New beneficiary and velocity rules triggered.'],
    ['09:06','System','Case created','FC-2026-01842 assigned to Meera Shah.'],
    ['09:09','System','Evidence retrieved','Transactions, profile, screening and available documents linked.'],
    ['09:10','System','Evidence status recorded','7/9 investigation areas available; Meridian registry unavailable.'],
    ['09:11','AI Copilot','Investigation generated','Simulated output recommends Request More Information.'],
    ['09:12','Meera Shah','Case opened','Analyst began investigation.']
  ]
};
