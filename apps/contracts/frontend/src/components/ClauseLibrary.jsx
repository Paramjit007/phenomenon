import { useState, useMemo } from "react";
import { C, font } from "../constants.js";
import { getClausesForType, getCategories } from "../data/clauseLibrary.js";

export default function ClauseLibrary({ contractType, onAddClause }) {
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("Todas");
  const [draggingId, setDraggingId] = useState(null);

  const allClauses  = useMemo(() => getClausesForType(contractType), [contractType]);
  const categories  = useMemo(() => ["Todas", ...getCategories(allClauses)], [allClauses]);

  const filtered = allClauses.filter(c => {
    const matchesCat  = category === "Todas" || c.category === category;
    const matchesSrch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.text.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSrch;
  });

  function dragStart(e, clause) {
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "clause", text: clause.text }));
    e.dataTransfer.effectAllowed = "copy";
    setDraggingId(clause.id);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.white }}>

      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.textDark, fontFamily: font.ui, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          📚 Biblioteca de Cláusulas
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: font.ui, marginBottom: 10 }}>
          Arrastra las cláusulas al editor o haz clic en + para añadir.
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar cláusulas…"
          style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${C.border}`, borderRadius: 5, background: C.bgInput, fontFamily: font.ui, outline: "none", marginBottom: 8 }}
        />

        {/* Category filter */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, border: `1px solid ${category === cat ? C.blue : C.border}`, background: category === cat ? C.blueBg : "none", color: category === cat ? C.blue : C.textMuted, cursor: "pointer", fontFamily: font.ui }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Clause list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {filtered.length === 0 && (
          <div style={{ padding: "20px 12px", textAlign: "center", color: C.textLight, fontSize: 12, fontFamily: font.ui }}>
            No se encontraron cláusulas para esta búsqueda.
          </div>
        )}
        {filtered.map(clause => (
          <div
            key={clause.id}
            draggable
            onDragStart={e => dragStart(e, clause)}
            onDragEnd={() => setDraggingId(null)}
            style={{
              padding: "10px 12px",
              marginBottom: 6,
              border: `1px solid ${draggingId === clause.id ? C.blue : C.border}`,
              borderRadius: 7,
              background: draggingId === clause.id ? C.blueBg : C.bgAlt,
              cursor: "grab",
              transition: "all 0.15s",
              userSelect: "none",
            }}
          >
            {/* Title row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textDark, fontFamily: font.ui, lineHeight: 1.3, flex: 1 }}>
                {clause.title}
              </div>
              <button
                onClick={() => onAddClause(clause.text)}
                title="Añadir cláusula"
                style={{ background: C.blue, color: C.white, border: "none", borderRadius: 4, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13, flexShrink: 0, paddingBottom: 1 }}
              >+</button>
            </div>

            {/* Law ref */}
            {clause.law && (
              <div style={{ fontSize: 9, color: C.blue, fontFamily: font.mono, marginBottom: 5, letterSpacing: "0.04em" }}>
                {clause.law}
              </div>
            )}

            {/* Preview (first 100 chars) */}
            <div style={{ fontSize: 11, color: C.textMuted, fontFamily: font.serif, lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {clause.text}
            </div>

            {/* Drag hint */}
            <div style={{ marginTop: 6, fontSize: 9, color: C.textLight, fontFamily: font.mono, textAlign: "right" }}>
              ⠿ arrastra al editor
            </div>
          </div>
        ))}
      </div>

      {/* Footer count */}
      <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.textLight, fontFamily: font.mono, flexShrink: 0 }}>
        {filtered.length} cláusula{filtered.length !== 1 ? "s" : ""} · Tipo: {contractType}
      </div>
    </div>
  );
}
