/**
 * dummyDataBuilder.js
 *
 * Generates realistic Spanish-legal dummy values for any contract template
 * or sub-contract type by reading the placeholder/options metadata already
 * defined in constants.js. The output is a {fieldKey: value} dict ready to
 * PATCH into a contract's `ag.terms` or `ess`.
 *
 * Why this exists: the user wants "open a blank contract → click one button
 * → every field filled with correct data → instant homologation across the
 * 3 main cases (Seguros, KPMG, Compraventa) and every other template".
 *
 * Strategy per field type:
 *   - `select` → pick the first option from `field.options` (it's the
 *                most-conservative legal choice in our constants)
 *   - `date`   → use a sensible date relative to today (effectiveDate=today,
 *                expiryDate=today+1y, dates that imply "future" get today+1y)
 *   - `number` → use `field.placeholder` as the value (placeholders are
 *                realistic example numbers in our constants)
 *   - `textarea` → use `field.placeholder` (rich legal example text)
 *   - `text`    → use `field.placeholder`
 *
 * Existing values in the contract are PRESERVED — quick-fill only fills
 * fields that are empty/missing. This means the user can partially fill
 * and then click the button to complete the rest.
 */
import { CONTRACT_TEMPLATES, SUB_FIELDS } from "../constants.js";

// ── Date helpers ─────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function plusYearsISO(years) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

function plusMonthsISO(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// Per-field-key special defaults — used when the placeholder is missing
// or when a more semantically-meaningful value is needed. Add entries as
// new templates introduce date fields that need specific semantics.
const SPECIAL_DATE_DEFAULTS = {
  effectiveDate:           todayISO,
  expiryDate:              () => plusYearsISO(1),
  // KPMG: construction is normally 2 years out
  constructionTarget:      () => plusYearsISO(2),
  // Insurance dates
  coverageActivationDate:  todayISO,
  medicalExamDate:         () => plusMonthsISO(-1),  // examined last month
  premiumReviewDate:       () => plusYearsISO(1),
  validationDate:          () => plusMonthsISO(-1),
  peritacionDeadline:      () => plusYearsISO(1),
  // Corporate governance
  reviewDeadline:          () => plusMonthsISO(3),
  auditDate:               todayISO,
  approvalDate:            todayISO,
  approvalDeadline:        () => plusMonthsISO(3),
  meetingDate:             todayISO,
  boardMeetingDate:        () => plusMonthsISO(1),
};

// ── Field-level dummy value resolver ─────────────────────────────────
function dummyValueForField(field) {
  if (!field) return "";
  const { key, type, placeholder, options } = field;

  // Dates need actual ISO strings; placeholders are usually unset on date inputs
  if (type === "date") {
    const fn = SPECIAL_DATE_DEFAULTS[key];
    return fn ? fn() : todayISO();
  }

  // Select fields: pick the first option (most-conservative legal default)
  if (type === "select" && Array.isArray(options) && options.length > 0) {
    return options[0];
  }

  // Number / text / textarea: use the placeholder, which is always a
  // realistic example in our constants
  if (placeholder != null && String(placeholder).trim().length > 0) {
    return String(placeholder);
  }

  // Fallback: empty string (engine will flag it on homologation,
  // pointing the user to fill it manually)
  return "";
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Build dummy ESS + terms (party fields + contract fields) for a master
 * template. Returns: { ess: {...}, terms: {...} }
 *
 * Pass an `existing` object with current values; those are preserved.
 */
export function buildDummyMasterData(templateKey, existing = {}) {
  const tpl = CONTRACT_TEMPLATES[templateKey];
  if (!tpl) return { ess: {}, terms: {} };

  const existingEss   = existing.ess   || {};
  const existingTerms = existing.terms || {};
  const ess   = { ...existingEss };
  const terms = { ...existingTerms };

  // ESS (required identity fields)
  (tpl.requiredEss || []).forEach(f => {
    if (!ess[f.key] || String(ess[f.key]).trim() === "") {
      ess[f.key] = dummyValueForField(f);
    }
  });

  // Party fields (CIF, addresses, representatives — visible but optional in some templates)
  (tpl.partyFields || []).forEach(f => {
    if (!terms[f.key] || String(terms[f.key]).trim() === "") {
      terms[f.key] = dummyValueForField(f);
    }
  });

  // Contract fields (the meat of the template — "Condiciones Económicas y Comerciales")
  (tpl.contractFields || []).forEach(f => {
    if (!terms[f.key] || String(terms[f.key]).trim() === "") {
      terms[f.key] = dummyValueForField(f);
    }
  });

  // templateKey marker preserved (or set, if absent)
  if (!terms.templateKey) terms.templateKey = templateKey;

  return { ess, terms };
}

/**
 * Build dummy terms for a sub-contract type. Returns: { terms: {...} }
 *
 * `existing` is the contract's current `ag.terms` (so we only fill empties).
 */
export function buildDummySubData(subType, existing = {}) {
  const sections = SUB_FIELDS[subType];
  if (!sections) return { terms: { ...existing } };

  const terms = { ...existing };

  // SUB_FIELDS is structured as: [{ section: "...", fields: [{key, ...}, ...] }, ...]
  sections.forEach(section => {
    (section.fields || []).forEach(f => {
      if (!terms[f.key] || String(terms[f.key]).trim() === "") {
        terms[f.key] = dummyValueForField(f);
      }
    });
  });

  return { terms };
}

/**
 * Convenience: given a contract record (master or sub) and the active template,
 * return the PATCH-shape `{ ess?, ag }` to send to the backend.
 *
 * For masters: preserves existing clauses + ia_instances, fills empty terms/ess.
 * For subs:    preserves clauses, fills empty terms.
 */
export function buildPatchForContract(contract, templateKey) {
  const isMaster = !contract.parentId;
  if (isMaster) {
    const { ess, terms } = buildDummyMasterData(templateKey, {
      ess: contract.ess || {},
      terms: contract.ag?.terms || {},
    });
    return {
      ess,
      ag: { terms, clauses: contract.ag?.clauses || [] },
    };
  } else {
    const { terms } = buildDummySubData(contract.type, contract.ag?.terms || {});
    return {
      ag: { terms, clauses: contract.ag?.clauses || [] },
    };
  }
}
