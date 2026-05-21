export const C = {
  bg: "#050508",
  panel: "#0c0c16",
  border: "#1c1c30",
  borderBright: "#2a2a45",
  gold: "#c9a84c",
  goldDim: "#7a6030",
  goldLight: "#e8c96a",
  cyan: "#38bdf8",
  purple: "#a78bfa",
  green: "#4ade80",
  orange: "#fb923c",
  red: "#f87171",
  pink: "#f472b6",
  text: "#e2e8f0",
  textMuted: "#64748b",
  textDim: "#2d3748",
  // Contract type colors
  nda: "#818cf8",
  sla: "#4ade80",
  payment: "#34d399",
  ip: "#f472b6",
  dpa: "#38bdf8",
};

export const statusColor = (status) =>
  ({ ACTIVE: C.green, MODIFIED: C.gold, NEEDS_REVIEW: C.orange, DRAFT: C.textMuted })[status] ?? C.textMuted;

export const phaseColor = (phase) =>
  ({
    ESS: C.gold, AG: C.purple, IA: C.cyan, VEC: C.cyan,
    "F→IF": C.green, F: C.green, IF: C.green, "IF→": C.green,
    OPUS: C.goldLight, INIT: C.textMuted, CASCADE: C.orange,
    EVAL: C.orange, CREATE: C.gold, AI: C.purple, ERROR: C.red,
  })[phase] ?? C.textMuted;
