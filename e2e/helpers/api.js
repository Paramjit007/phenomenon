/**
 * API helpers — direct HTTP calls to the PHENOMENON backend.
 * Used in test beforeAll/beforeEach hooks to set up deterministic state.
 */
// Node.js (test runner process) needs host.docker.internal when running via WSL/Git Bash.
// The Playwright browser itself uses localhost (it's a native Windows process).
const BACKEND = process.env.BACKEND_URL || 'http://host.docker.internal:8000';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BACKEND}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${options.method || 'GET'} ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** Seed the Seguros demo (4 insurance masters + 12 subs = 16 contracts). */
async function seedSeguros() {
  return apiFetch('/demo/seguros/seed', { method: 'POST' });
}

/** Seed the KPMG demo (1 master + 3 subs = 4 contracts). */
async function seedKPMG() {
  return apiFetch('/demo/kpmg/seed', { method: 'POST' });
}

/** Get all contracts from the DB. */
async function getContracts() {
  return apiFetch('/phenomena/');
}

/** Delete every contract (children first to avoid FK errors). */
async function deleteAllContracts() {
  const all = await getContracts();
  const subs     = all.filter(c => c.parentId);
  const masters  = all.filter(c => !c.parentId);
  for (const c of [...subs, ...masters]) {
    await apiFetch(`/phenomena/${c.id}`, { method: 'DELETE' }).catch(() => {});
  }
}

/** Declare a siniestro on a contract. */
async function declareSiniestro(contractId, resolution = '') {
  return apiFetch('/demo/seguros/siniestro', {
    method: 'POST',
    body: JSON.stringify({ contract_id: contractId, resolution }),
  });
}

/** Unblock a BLOCKED coverage contract. */
async function unblockCoverage(contractId) {
  return apiFetch('/demo/seguros/unblock-coverage', {
    method: 'POST',
    body: JSON.stringify({ contract_id: contractId }),
  });
}

/** Find a contract by type in the current DB state. */
async function findByType(type) {
  const all = await getContracts();
  return all.find(c => c.type === type) || null;
}

/** PATCH a contract — merges into ag/terms or ess. */
async function patchContract(contractId, patch) {
  return apiFetch(`/phenomena/${contractId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

/** Run homologation on one contract. */
async function homologate(contractId) {
  return apiFetch(`/phenomena/${contractId}/homologate`, { method: 'POST' });
}

/** Trigger sub-cascade (mirrors what the frontend does on field save). */
async function subCascade(sourceId, field, newValue) {
  return apiFetch('/cascade/sub-trigger', {
    method: 'POST',
    body: JSON.stringify({ source_id: sourceId, field, new_value: newValue }),
  });
}

/** Health check — returns true if backend is reachable. */
async function isBackendReady() {
  try {
    const r = await fetch(`${BACKEND}/health`);
    return r.ok;
  } catch {
    return false;
  }
}

module.exports = {
  seedSeguros,
  seedKPMG,
  getContracts,
  deleteAllContracts,
  declareSiniestro,
  unblockCoverage,
  findByType,
  patchContract,
  homologate,
  subCascade,
  isBackendReady,
};
