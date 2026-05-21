import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "../api/phenomenon.js";
import { SUB_META, IA_TYPES, SUB_IF_EDGES, SUB_CASCADE_FIELDS } from "../constants.js";

export function usePhenomenon() {
  const [contracts, setContracts]   = useState({});
  const [log, setLog]               = useState([]);
  const [loading, setLoading]       = useState(false);
  const [generating, setGenerating] = useState({});
  const pollRef = useRef(null);

  const addLog = useCallback((phase, msg, type = "info") => {
    setLog(prev => [...prev.slice(-199), {
      id: Date.now() + Math.random(), phase, msg, type,
      t: new Date().toLocaleTimeString("es-ES", { hour12: false }),
    }]);
  }, []);

  const loadContracts = useCallback(async () => {
    try {
      const data = await api.listPhenomena();
      const map = {};
      data.forEach(p => { map[p.id] = { ...p, children: p.children || [] }; });
      setContracts(map);
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadContracts();
    pollRef.current = setInterval(loadContracts, 4000);
    return () => clearInterval(pollRef.current);
  }, [loadContracts]);

  // ── Multi-project support ─────────────────────────────────────────────────
  const [activeMasterId, setActiveMasterId] = useState(null);
  const masters = Object.values(contracts).filter(c => !c.parentId);
  const master  = (activeMasterId ? contracts[activeMasterId] : masters[0]) ?? null;
  const masterId = master?.id ?? null;
  const subContracts = master
    ? (master.children || []).map(id => contracts[id]).filter(Boolean)
    : [];

  // ── Project management ────────────────────────────────────────────────────
  const startNewProject = useCallback(async (templateKey, template) => {
    setLoading(true);
    addLog("INIT", `Iniciando proyecto: ${template.label}…`, "init");
    try {
      for (const id of Object.keys(contracts)) {
        try { await api.deletePhenomenon(id); } catch (_) {}
      }
      await api.createPhenomenon({
        name: template.label,
        type: "MASTER",
        parentId: null,
        ess: { partyA: "", partyB: "", jurisdiction: "", effectiveDate: "", expiryDate: "" },
        // Store templateKey so backend homologation knows which fields to check
        ag: { clauses: [], terms: { templateKey } },
        ia_instances: template.iaDefaults ?? [],
      });
      addLog("CREATE", `${template.label} creado`, "init");
      await loadContracts();
    } catch (e) {
      addLog("ERROR", `Error al crear proyecto: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [contracts, addLog, loadContracts]);

  // ── Contract update (auto-cascade after ESS or AG term changes) ──────────
  // We use a ref so the callback doesn't re-create on every contracts poll.
  const contractsRef = useRef(contracts);
  useEffect(() => { contractsRef.current = contracts; }, [contracts]);

  const updateContract = useCallback(async (id, changes) => {
    try {
      await api.updatePhenomenon(id, changes);

      const cached  = contractsRef.current;
      const record  = cached[id];
      const isMaster = record ? !record.parentId : false;

      // Master ESS change → auto-cascade to all sub-contracts
      if (changes.ess && isMaster) {
        for (const [field, value] of Object.entries(changes.ess)) {
          if (!value) continue;
          const result = await api.triggerCascade(id, field, String(value)).catch(() => null);
          if (result?.affected_count > 0)
            addLog("CASCADE", `${field} → ${result.affected_count} sub(s) NEEDS_REVIEW`, "cascade");
        }
      }

      // Sub-contract AG term change → sibling + master cascades
      if (changes.ag?.terms && !isMaster && record?.parentId) {
        const cascadeFields = SUB_CASCADE_FIELDS[record.type] ?? [];
        for (const [field, value] of Object.entries(changes.ag.terms)) {
          if (!cascadeFields.includes(field) || !value) continue;
          const [sibR, revR] = await Promise.all([
            api.triggerSubCascade(id, field, String(value)).catch(() => null),
            api.triggerReverseCascade(id, field, String(value)).catch(() => null),
          ]);
          if (sibR?.affected_count > 0)
            addLog("IF", `${record.type}.${field} → ${sibR.trace.map(t => t.name).join(", ")} NEEDS_REVIEW`, "cascade");
          if (revR?.triggered)
            addLog("IF", `${record.type}.${field} → Maestro NEEDS_REVIEW`, "cascade");
        }
      }

      await loadContracts();
    } catch (e) {
      addLog("ERROR", `Error al actualizar: ${e.message}`, "error");
      throw e;
    }
  }, [addLog, loadContracts]);

  // ── Sub-contract generation ───────────────────────────────────────────────
  const generateSubContract = useCallback(async (type, parentEss, iaDefaults) => {
    const meta = SUB_META[type];
    if (!meta) return;
    setGenerating(prev => ({ ...prev, [type]: "pending" }));
    addLog("CREATE", `Generando ${meta.label}…`, "init");
    try {
      const summary = `${parentEss.partyA ?? ""} y ${parentEss.partyB ?? ""}, ${parentEss.jurisdiction ?? "España"}`;
      const parsed  = await api.generateContract(meta.label, summary, parentEss);
      if (parsed.fallback) addLog("AI", "Cláusulas base cargadas (sin IA). Configure ANTHROPIC_API_KEY para generación personalizada.", "info");
      await api.createPhenomenon({
        name: meta.label, type, parentId: masterId,
        ess: parentEss,
        ag: { clauses: parsed.clauses?.length ? parsed.clauses : [`Cláusula principal de ${meta.label}.`] },
        ia_instances: parsed.ia_instances?.length ? parsed.ia_instances : (iaDefaults ?? ["ad-actio"]),
      });
      addLog("OPUS", `${meta.short}: ACTIVO | Homologación: VÁLIDA ✓`, "opus");
      setGenerating(prev => ({ ...prev, [type]: "done" }));
      await loadContracts();
    } catch (e) {
      addLog("ERROR", `Error al generar ${type}: ${e.message}`, "error");
      setGenerating(prev => ({ ...prev, [type]: "error" }));
    }
  }, [masterId, addLog, loadContracts]);

  // ── Sub-contract cross-cascade (sub → sibling + sub → master) ───────────
  const runSubCascade = useCallback(async (sourceId, field, value) => {
    const source = contracts[sourceId];
    if (!source || !source.parentId) return;
    let reloaded = false;
    try {
      // Sibling cascade (sub → sub)
      const sibResult = await api.triggerSubCascade(sourceId, field, value);
      if (sibResult.affected_count > 0) {
        const names = sibResult.trace.map(t => t.name).join(", ");
        addLog("IF", `${source.type}→IF sibling: «${field}» → ${names} (NEEDS_REVIEW)`, "cascade");
        reloaded = true;
      }
      // Reverse cascade (sub → master)
      const revResult = await api.triggerReverseCascade(sourceId, field, value);
      if (revResult.triggered) {
        addLog("IF", `${source.type}→IF master: ${revResult.reason}`, "cascade");
        reloaded = true;
      }
      if (reloaded) await loadContracts();
    } catch (_) {}
  }, [contracts, addLog, loadContracts]);

  // ── Cascade ───────────────────────────────────────────────────────────────
  const runCascade = useCallback(async (field, value) => {
    if (!masterId) return;
    setLoading(true);
    const oldVal = master?.ess?.[field] ?? "";
    addLog("CASCADE", `"${field}": "${oldVal}" → "${value}"`, "cascade");
    try {
      const result = await api.triggerCascade(masterId, field, value);
      addLog("IF", `Propagado a ${result.affected_count} subcontrato(s)`, "ia");
      const types = result.affected_ids.map(id => contracts[id]?.type).filter(Boolean);
      if (types.length) {
        const { text, fallback } = await api.analyzeCascade(field, oldVal, value, types);
        addLog("AI", text?.slice(0, 180) + "…", "ai");
        if (fallback) addLog("INFO", "Configure ANTHROPIC_API_KEY para análisis de impacto detallado.", "info");
      }
      await loadContracts();
    } catch (e) {
      addLog("ERROR", e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [masterId, master, contracts, addLog, loadContracts]);

  // ── Project management ────────────────────────────────────────────────────
  const renameProject = useCallback(async (id, newName) => {
    await api.updatePhenomenon(id, { name: newName });
    addLog("INIT", `Proyecto renombrado: ${newName}`, "init");
    await loadContracts();
  }, [addLog, loadContracts]);

  const resetProject = useCallback(async (id) => {
    addLog("RESET", "Reiniciando proyecto…", "init");
    await api.resetProject(id);
    addLog("RESET", "Proyecto reiniciado — sub-contratos eliminados", "init");
    await loadContracts();
  }, [addLog, loadContracts]);

  const deleteProject = useCallback(async (id) => {
    addLog("DELETE", "Eliminando proyecto…", "init");
    await api.deletePhenomenon(id); // cascade handled in backend now
    if (activeMasterId === id) setActiveMasterId(null);
    addLog("DELETE", "Proyecto eliminado", "init");
    await loadContracts();
  }, [activeMasterId, addLog, loadContracts]);

  // ── Delete contract ───────────────────────────────────────────────────────
  const deleteContract = useCallback(async (id) => {
    const name = contracts[id]?.name ?? id;
    try {
      await api.deletePhenomenon(id);
      addLog("DELETE", `Subcontrato eliminado: ${name}`, "info");
      await loadContracts();
    } catch (e) {
      addLog("ERROR", `Error al eliminar: ${e.message}`, "error");
      throw e;
    }
  }, [contracts, addLog, loadContracts]);

  // ── Homologation ──────────────────────────────────────────────────────────
  const homologateContract = useCallback(async (id) => {
    const name = contracts[id]?.name ?? id;
    addLog("OPUS", `Iniciando verificación PHENOMENON: ${name}…`, "opus");
    try {
      const result = await api.homologate(id);
      addLog(
        "OPUS",
        result.valid
          ? `✓ Homologación VÁLIDA — ${name}`
          : `✗ Homologación INVÁLIDA — ${result.errors.length} error(es) detectado(s)`,
        result.valid ? "opus" : "error",
      );
      await loadContracts();
      return result;
    } catch (e) {
      addLog("ERROR", `Error en homologación: ${e.message}`, "error");
      return null;
    }
  }, [contracts, addLog, loadContracts]);

  const homologateAll = useCallback(async () => {
    // Sub-contracts must be verified FIRST so the master's ecosystem check
    // sees their current homologation state (VALID/INVALID) when it runs last.
    const ordered = [...subContracts.filter(Boolean), master].filter(Boolean);
    addLog("OPUS", `Iniciando verificación global — ${ordered.length} contratos (subcontratos primero, maestro al final)…`, "opus");
    const results = [];
    for (const c of ordered) {
      await new Promise(r => setTimeout(r, 350)); // stagger for visual effect
      const r = await api.homologate(c.id).catch(() => null);
      if (r) {
        results.push(r);
        addLog(
          "OPUS",
          `${c.name}: ${r.valid ? "✓ VÁLIDO" : `✗ INVÁLIDO (${r.errors.length} error${r.errors.length !== 1 ? "es" : ""})` }`,
          r.valid ? "opus" : "error",
        );
      }
    }
    await loadContracts();
    const valid = results.filter(r => r.valid).length;
    addLog("OPUS", `Verificación completada: ${valid}/${results.length} contratos homologados`, valid === results.length ? "opus" : "error");
    return results;
  }, [master, subContracts, addLog, loadContracts]);

  // ── IA assignment ─────────────────────────────────────────────────────────
  const removeIAFromContract = useCallback(async (contractId, iaType) => {
    const contract = contracts[contractId];
    if (!contract) return;
    const updated = (contract.ia_instances ?? []).filter(ia => ia !== iaType);
    await api.updatePhenomenon(contractId, { ia_instances: updated });
    await loadContracts();
    addLog("IA", `Operador «${iaType}» eliminado de ${contract.name}`, "info");
  }, [contracts, addLog, loadContracts]);

  const addIAToContract = useCallback(async (contractId, iaType) => {
    const contract = contracts[contractId];
    if (!contract) return false;
    const existing = contract.ia_instances ?? [];
    const def = IA_TYPES[iaType];
    const incompatible = existing.filter(e => !def.compatible.includes(e));
    if (incompatible.length) {
      addLog("ERROR", `${iaType} incompatible con: ${incompatible.join(", ")}. Use: ${def.compatible.join(", ")}.`, "error");
      return false;
    }
    await api.updatePhenomenon(contractId, { ia_instances: [...existing, iaType] });
    await loadContracts();
    addLog("IA", `Operador ${iaType} aplicado a ${contract.name}`, "ia");
    return true;
  }, [contracts, addLog, loadContracts]);

  return {
    contracts, master, masterId, subContracts, masters,
    activeMasterId, setActiveMasterId,
    log, loading, generating,
    addLog, loadContracts,
    startNewProject, updateContract,
    generateSubContract, runCascade, runSubCascade,
    addIAToContract, removeIAFromContract,
    deleteContract, homologateContract, homologateAll,
    renameProject, resetProject, deleteProject,
  };
}
