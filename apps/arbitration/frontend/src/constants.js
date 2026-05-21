export const C = {
  bg:"#F5F3EE", bgAlt:"#EDEAE3", bgInput:"#FAFAF8",
  white:"#FFFFFF", navy:"#1E2B45", navyDeep:"#0F1729",
  border:"#E5E0D8", borderStrong:"#C9C5BC",
  gold:"#C9A84C", goldDim:"#8B6F2E", goldLight:"#E8C470", goldBg:"#FDF7E9",
  blue:"#2563EB", blueBg:"#EFF6FF",
  green:"#059669", greenBg:"#ECFDF5",
  orange:"#D97706", orangeBg:"#FFFBEB",
  red:"#DC2626", redBg:"#FEF2F2",
  purple:"#7C3AED", purpleBg:"#F5F3FF",
  cyan:"#0891B2", cyanBg:"#ECFEFF",
  textDark:"#111827", textBody:"#374151",
  textMuted:"#6B7280", textLight:"#9CA3AF",
};
export const font = { ui:"'Inter',system-ui,sans-serif", serif:"'Playfair Display',Georgia,serif", mono:"'JetBrains Mono','Courier New',monospace" };

export const IA_CFG = {
  "ad-actio":      { label:"Claim",                labelEs:"Pretensión",          icon:"→", color:"#C9A84C", desc:"Positive assertion: claimant projects vector toward tribunal. Each head of relief.",        siac:"Statement of Claim — Rule 6 SIAC 2025", formType:"direction"   },
  "non":           { label:"Preliminary Objection", labelEs:"Objeción Preliminar", icon:"✕", color:"#DC2626", desc:"Jurisdictional / admissibility exclusion threshold. MUST raise in Response or waiver risk.", siac:"Response — Rule 7 SIAC 2025 — waiver risk if not raised!",    formType:"position"    },
  "de-actio":      { label:"Defense",               labelEs:"Defensa",             icon:"←", color:"#6B7280", desc:"Retroactive argument: force majeure, prior breach, limitation, termination.",               siac:"Statement of Defense — substantive, not jurisdictional",      formType:"retroaction" },
  "co-implication":{ label:"Counterclaim",          labelEs:"Contrademanda",       icon:"⇄", color:"#7C3AED", desc:"Mutual obligation / reciprocal claim. Both parties bound by same instrument.",               siac:"No filing fee under SIAC 2025 — file with Response",          formType:"plication"   },
};

export const CLAIM_TYPES = [
  { key:"breach",   label:"Breach of Contract",        icon:"⚖",  color:"#C9A84C" },
  { key:"payment",  label:"Non-Payment / Debt",         icon:"💰", color:"#059669" },
  { key:"damages",  label:"Damages / Loss of Chance",   icon:"📉", color:"#DC2626" },
  { key:"guarantee",label:"Guarantee Enforcement",      icon:"🔐", color:"#7C3AED" },
  { key:"treaty",   label:"Treaty Violation (BIT/ECT)", icon:"🌐", color:"#2563EB" },
  { key:"tort",     label:"Tort / Fraud",               icon:"⚡", color:"#D97706" },
  { key:"ip",       label:"IP / Technology Dispute",    icon:"💡", color:"#0891B2" },
  { key:"other",    label:"Other",                      icon:"◈",  color:"#6B7280" },
];

export const DISPUTE_TYPES = {
  SIAC_COMMERCIAL:  { label:"International Commercial",   icon:"⬡", color:C.gold,   complexity:3, siacRule:"Standard / Expedited ≤ SGD 10M", iaDefaults:["ad-actio","co-implication"] },
  SIAC_INVESTMENT:  { label:"Investment Treaty (BIT)",    icon:"◈", color:C.blue,   complexity:5, siacRule:"Standard — Investor-State",       iaDefaults:["ad-actio","co-implication"] },
  SIAC_CONSTRUCTION:{ label:"Construction / FIDIC",       icon:"◉", color:C.cyan,   complexity:4, siacRule:"Standard / DAB procedure first",  iaDefaults:["ad-actio","co-implication"] },
  SIAC_MA:          { label:"M&A / SPA / JV Dispute",    icon:"◆", color:C.purple, complexity:4, siacRule:"Standard — cross-border enforcement",iaDefaults:["ad-actio","co-implication"] },
  SIAC_ENERGY:      { label:"Energy / Natural Resources", icon:"⚡", color:C.orange, complexity:4, siacRule:"Standard",                        iaDefaults:["ad-actio","co-implication"] },
  SIAC_EMERGENCY:   { label:"Emergency Arbitrator",       icon:"🚨", color:C.red,    complexity:2, siacRule:"Schedule 1 — 14 day award / PPO", iaDefaults:["ad-actio","non"]            },
};

export const SIAC_PROCEDURES = {
  streamlined: { label:"Streamlined",     threshold:"≤ SGD 1M",   awardMonths:3,  color:C.green,  rule:"Schedule 2 SIAC 2025 — written only, no hearing" },
  expedited:   { label:"Expedited",       threshold:"≤ SGD 10M",  awardMonths:6,  color:C.gold,   rule:"Rule 9 / Schedule 3 SIAC 2025 — sole arbitrator" },
  standard:    { label:"Standard",        threshold:"Any amount", awardDays:90,   color:C.blue,   rule:"Default — full procedure, 1 or 3 arbitrators" },
  emergency:   { label:"Emergency Arb.",  threshold:"Any amount", awardDays:14,   color:C.red,    rule:"Schedule 1 SIAC 2025 — SGD 30,000 deposit" },
};

export const SIAC_TIMELINES = [
  { day:0,   event:"Commencement",          desc:"Complete NoA received (Rule 3)",                color:C.gold   },
  { day:14,  event:"Response due",          desc:"Response incl. counterclaims (Rule 7)",         color:C.blue   },
  { day:21,  event:"Sole arb. nomination",  desc:"Joint nomination window (Rule 21)",             color:C.green  },
  { day:28,  event:"Co-arb. nominations",   desc:"Party-nominated co-arbitrators (Rule 22)",      color:C.green  },
  { day:49,  event:"Presiding arb.",        desc:"21d after both co-arbs confirmed (Rule 22)",    color:C.green  },
  { day:"T+30d", event:"Award timeline",    desc:"Tribunal discloses proposed schedule (Rule 52)",color:C.orange },
  { day:"T+90d", event:"Draft → SIAC",     desc:"Mandatory scrutiny (Rule 55)",                  color:C.red    },
];

// SIAC fee schedule (approximate, 2025)
export function siacFee(amount) {
  if (!amount || amount <= 0) return null;
  const a = parseFloat(amount);
  let fee = 0;
  if (a <= 100000)       fee = 3270;
  else if (a <= 500000)  fee = 3270 + (a-100000)*0.0228;
  else if (a <= 2000000) fee = 12390 + (a-500000)*0.0138;
  else if (a <= 10000000)fee = 33090 + (a-2000000)*0.0083;
  else                   fee = 99490 + (a-10000000)*0.0034;
  return Math.round(fee);
}

export const CASE_STRENGTHS = [
  { key:"strong",   label:"Strong",        color:C.green,  icon:"✅", desc:"ESS complete, AG well-founded, IA coherent, evidence solid" },
  { key:"moderate", label:"Moderate",      color:C.orange, icon:"⚠️", desc:"Some gaps in evidence or legal basis — needs work" },
  { key:"weak",     label:"Weak",          color:C.red,    icon:"❌", desc:"Significant structural deficiencies — reconsider strategy" },
  { key:"fatal",    label:"Fatal Flaw",    color:"#7F1D1D",icon:"💀", desc:"Structural defect makes this argument untenable" },
];

export const DISCLAIMER_EN = "PHENOMENON AppS is a structural analysis tool. It does NOT constitute legal advice, creates NO attorney-client relationship, and confers NO legal obligations on any party. All analysis must be reviewed and verified by qualified legal counsel before use in any arbitral or court proceeding. SIAC Rules 2025 procedural information is provided for structural analysis purposes only.";
export const DISCLAIMER_ES = "PHENOMENON AppS es una herramienta de análisis estructural. NO constituye asesoramiento jurídico, NO crea relación abogado-cliente y NO genera obligaciones legales. Todo análisis debe ser revisado por letrado cualificado antes de su uso en procedimientos arbitrales o judiciales.";
export const FINAL_RULE = "PHENOMENON transforms chaotic and fluidic reality into geometrically structured and vectorially operable systems.";
