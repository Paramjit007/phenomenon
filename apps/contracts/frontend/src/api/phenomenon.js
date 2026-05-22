const BASE = "/api";

async function req(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`${opts.method || "GET"} ${path} [${r.status}]: ${text.slice(0, 200)}`);
  }
  return r.json();
}

export const listPhenomena      = ()           => req("/phenomena/");
export const getPhenomenon      = (id)         => req(`/phenomena/${id}`);
export const createPhenomenon   = (body)       => req("/phenomena/",       { method: "POST",   body });
export const updatePhenomenon   = (id, body)   => req(`/phenomena/${id}`,  { method: "PATCH",  body });
export const updateEss          = (id, body)   => req(`/phenomena/${id}/ess`, { method: "PATCH", body });
export const deletePhenomenon   = (id)         => req(`/phenomena/${id}`,  { method: "DELETE" });
export const homologate       = (id)         => req(`/phenomena/${id}/homologate`, { method: "POST" });
export const resetProject     = (id)         => req(`/phenomena/${id}/reset`,       { method: "POST" });
export const getOpusLevel     = (id)         => req(`/phenomena/${id}/opus`);
export const registerContract = (id, body)   => req(`/phenomena/${id}/register`,   { method: "PATCH", body });
export const triggerCascade    = (master_id, field, new_value) =>
  req("/cascade/trigger", { method: "POST", body: { master_id, field, new_value } });

export const terminateContract = (id) =>
  req(`/phenomena/${id}/terminate`, { method: "POST" });

export const triggerSubCascade = (source_id, field, new_value) =>
  req("/cascade/sub-trigger", { method: "POST", body: { source_id, field, new_value } });

export const triggerReverseCascade = (source_id, field, new_value) =>
  req("/cascade/reverse-trigger", { method: "POST", body: { source_id, field, new_value } });

export async function generateContract(contract_type, master_summary, ess) {
  const data = await req("/ai/generate-contract", {
    method: "POST", body: { contract_type, master_summary, ess },
  });
  let parsed = { clauses: [], ia_instances: [], special_terms: "", fallback: data.fallback };
  try {
    const raw = (data.result || "").replace(/```json|```/g, "").trim();
    Object.assign(parsed, JSON.parse(raw));
  } catch (_) {}
  parsed.fallback = data.fallback;
  return parsed;
}

// ─── Demo endpoints ───────────────────────────────────────────────────────────
export const seedKPMGDemo      = ()                             => req("/demo/kpmg/seed", { method: "POST" });
export const getAmortization   = (principal, euribor, spread, termYears, months = 24) =>
  req(`/demo/amortization?principal=${principal}&euribor=${euribor}&spread=${spread}&term_years=${termYears}&months=${months}`);
export const updateEuribor     = (body)                         => req("/demo/kpmg/update-euribor", { method: "POST", body });

// ─── Seguros demo endpoints ───────────────────────────────────────────────────
export const seedSegurosDemo   = ()       => req("/demo/seguros/seed", { method: "POST" });
export const declareSiniestro  = (body)   => req("/demo/seguros/siniestro",        { method: "POST", body });
export const unblockCoverage   = (body)   => req("/demo/seguros/unblock-coverage", { method: "POST", body });

// ─── Ecosystem endpoints ──────────────────────────────────────────────────────
export const getEcosystem             = (masterId)          => req(`/ecosystem/${masterId}`);
export const ecosystemHomologate      = (masterId)          => req(`/ecosystem/${masterId}/homologate`, { method: "POST" });
export const addPartyToEcosystem      = (masterId, body)    => req(`/ecosystem/${masterId}/add-party`,   { method: "POST", body });
export const addContractToEcosystem   = (masterId, body)    => req(`/ecosystem/${masterId}/add-contract`,{ method: "POST", body });

export async function analyzeCascade(field, old_value, new_value, affected_types) {
  const data = await req("/ai/analyze-cascade", {
    method: "POST", body: { field, old_value, new_value, affected_types },
  });
  return { text: data.analysis || "", fallback: data.fallback };
}

export async function generateClause({ contractId, prompt }) {
  return req("/ai/generate-clause", {
    method: "POST", body: { contract_id: contractId, prompt },
  });
}
