import { useState, useRef, useEffect } from "react";
import { C, font } from "../constants.js";

export default function ProjectManager({
  masters, activeMaster, onSwitch, onNew, onRename, onReset, onDelete,
}) {
  const [open,      setOpen]      = useState(false);
  const [renaming,  setRenaming]  = useState(false);
  const [newName,   setNewName]   = useState("");
  const [confirming, setConfirming] = useState(null); // "reset" | "delete"
  const panelRef = useRef(null);

  useEffect(() => {
    function close(e) { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); }
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function startRename() {
    setNewName(activeMaster?.name ?? "");
    setRenaming(true);
  }

  async function submitRename() {
    if (newName.trim()) await onRename(activeMaster.id, newName.trim());
    setRenaming(false);
    setOpen(false);
  }

  async function confirmAction() {
    if (confirming === "reset")  await onReset(activeMaster.id);
    if (confirming === "delete") await onDelete(activeMaster.id);
    setConfirming(null);
    setOpen(false);
  }

  const btnBase = {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 14px", width: "100%", background: "none",
    border: "none", cursor: "pointer", fontSize: 13,
    fontFamily: font.ui, textAlign: "left", borderRadius: 5,
    transition: "background 0.12s",
  };

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(p => !p); setRenaming(false); setConfirming(null); }}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: open ? C.bgAlt : C.white,
          border: `1px solid ${open ? C.gold : C.border}`,
          color: C.textBody, borderRadius: 6, padding: "5px 12px",
          cursor: "pointer", fontFamily: font.ui, fontSize: 12,
          maxWidth: 240, transition: "all 0.15s",
          boxShadow: open ? `0 0 0 2px ${C.gold}20` : "none",
        }}
      >
        <span style={{ color: C.gold, fontSize: 13 }}>◈</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {activeMaster?.name ?? "Sin proyecto"}
        </span>
        <span style={{ color: C.textMuted, fontSize: 10 }}>{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0,
          width: 280, background: C.white, border: `1px solid ${C.border}`,
          borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,0.14)",
          zIndex: 1000, overflow: "hidden",
        }}>

          {/* Project list */}
          {masters.length > 0 && (
            <div style={{ borderBottom: `1px solid ${C.border}`, padding: "6px 6px" }}>
              <div style={{ fontSize: 10, color: C.textMuted, fontFamily: font.mono, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 8px 6px" }}>Proyectos guardados</div>
              {masters.map(m => (
                <button key={m.id}
                  onClick={() => { onSwitch(m.id); setOpen(false); }}
                  onMouseEnter={e => e.currentTarget.style.background = C.bgAlt}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                  style={{ ...btnBase, color: m.id === activeMaster?.id ? C.gold : C.textBody }}
                >
                  <span style={{ fontSize: 14 }}>{m.id === activeMaster?.id ? "●" : "○"}</span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                  <span style={{ fontSize: 10, color: C.textLight, fontFamily: font.mono }}>{(m.children?.length ?? 0)} sub</span>
                </button>
              ))}
            </div>
          )}

          {/* Actions for active project */}
          {activeMaster && (
            <div style={{ padding: "6px 6px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, color: C.textMuted, fontFamily: font.mono, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 8px 6px" }}>Proyecto activo</div>

              {/* Rename inline */}
              {renaming ? (
                <div style={{ padding: "6px 8px", display: "flex", gap: 6 }}>
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") submitRename(); if (e.key === "Escape") setRenaming(false); }}
                    style={{ flex: 1, padding: "6px 10px", fontSize: 13, border: `1.5px solid ${C.blue}`, borderRadius: 5, fontFamily: font.ui, outline: "none" }}
                  />
                  <button onClick={submitRename}
                    style={{ background: C.blue, color: C.white, border: "none", borderRadius: 5, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: font.ui }}>
                    OK
                  </button>
                </div>
              ) : (
                <button onClick={startRename}
                  onMouseEnter={e => e.currentTarget.style.background = C.bgAlt}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                  style={{ ...btnBase, color: C.textBody }}>
                  <span>✏️</span> Renombrar proyecto
                </button>
              )}

              {/* Reset confirm */}
              {confirming === "reset" ? (
                <div style={{ padding: "8px 14px", background: C.orangeBg, borderRadius: 5, margin: "4px 6px" }}>
                  <div style={{ fontSize: 12, color: C.orange, fontFamily: font.ui, marginBottom: 7 }}>¿Reiniciar? Se eliminarán todos los subcontratos y campos.</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={confirmAction} style={{ background: C.orange, color: C.white, border: "none", borderRadius: 5, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontFamily: font.ui, fontWeight: 600 }}>Reiniciar</button>
                    <button onClick={() => setConfirming(null)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 5, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontFamily: font.ui }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirming("reset")}
                  onMouseEnter={e => e.currentTarget.style.background = C.orangeBg}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                  style={{ ...btnBase, color: C.orange }}>
                  <span>🔄</span> Reiniciar proyecto
                </button>
              )}

              {/* Delete confirm */}
              {confirming === "delete" ? (
                <div style={{ padding: "8px 14px", background: C.redBg, borderRadius: 5, margin: "4px 6px" }}>
                  <div style={{ fontSize: 12, color: C.red, fontFamily: font.ui, marginBottom: 7 }}>¿Eliminar "{activeMaster.name}"? Esta acción no se puede deshacer.</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={confirmAction} style={{ background: C.red, color: C.white, border: "none", borderRadius: 5, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontFamily: font.ui, fontWeight: 600 }}>Eliminar</button>
                    <button onClick={() => setConfirming(null)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 5, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontFamily: font.ui }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirming("delete")}
                  onMouseEnter={e => e.currentTarget.style.background = C.redBg}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                  style={{ ...btnBase, color: C.red }}>
                  <span>🗑</span> Eliminar proyecto
                </button>
              )}
            </div>
          )}

          {/* New project */}
          <div style={{ padding: "6px 6px" }}>
            <button onClick={() => { setOpen(false); onNew(); }}
              onMouseEnter={e => e.currentTarget.style.background = C.goldBg}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
              style={{ ...btnBase, color: C.goldDim, fontWeight: 600 }}>
              <span>＋</span> Nuevo proyecto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
