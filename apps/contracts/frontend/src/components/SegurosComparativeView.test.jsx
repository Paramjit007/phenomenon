/**
 * Behaviour tests for SegurosComparativeView tab navigation
 * and PhenomenonIIIFlowGraph interactive phase toggle.
 *
 * Infrastructure: Vitest + @testing-library/react + jsdom
 * Run: npx vitest run src/components/SegurosComparativeView.test.jsx
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SegurosComparativeView from "./SegurosComparativeView";
import { PhenomenonIIIFlowGraph, CircularMeter } from "./SegurosComparativeView";

// ── Helpers ───────────────────────────────────────────────────────────────────
const noOp = () => {};

// Minimal insurance master contract — enough to render policy columns (not empty state)
const minimalInsuranceMaster = {
  id: "master-vida-test",
  type: "SEGURO_VIDA",
  name: "Seguro Vida Test",
  status: "ACTIVE",
  parentId: null,
  ess: { partyA: "Test S.L.", partyB: "Test B S.A.", jurisdiction: "Madrid", effectiveDate: "2026-01-01", expiryDate: "2027-01-01" },
  ag: { terms: { templateKey: "SEGURO_VIDA" }, clauses: [] },
  ia_instances: ["ad-actio"],
  vectors: [],
  opus: { status: "PARTIAL", homologation: "PENDING" },
};
const contractsWithPolicy = { "master-vida-test": minimalInsuranceMaster };
const emptyContracts = {};

// ── Tab navigation ────────────────────────────────────────────────────────────
describe("SegurosComparativeView — tab navigation", () => {

  it("shows empty state when no policies are loaded", () => {
    render(
      <SegurosComparativeView
        contracts={emptyContracts}
        onSelectContract={noOp}
        onLoadContracts={async () => {}}
        addLog={noOp}
      />
    );
    expect(screen.getByText(/Caso Seguros no iniciado/i)).toBeInTheDocument();
  });

  it("shows tab buttons when at least one policy is loaded", () => {
    render(
      <SegurosComparativeView
        contracts={contractsWithPolicy}
        onSelectContract={noOp}
        onLoadContracts={async () => {}}
        addLog={noOp}
      />
    );
    // Tab button text is "⚡ Flujómetro" — use the tab switcher container specifically
    expect(screen.getByText(/🛡 Cartera/)).toBeInTheDocument();
    expect(screen.getByText(/⚡ Flujómetro/)).toBeInTheDocument();
  });

  it("switches to Flujómetro tab on button click", () => {
    render(
      <SegurosComparativeView
        contracts={contractsWithPolicy}
        onSelectContract={noOp}
        onLoadContracts={async () => {}}
        addLog={noOp}
      />
    );
    // The tab button is "⚡ Flujómetro"; the mini-map header says just "Flujómetro" in a separate span
    fireEvent.click(screen.getByText(/⚡ Flujómetro/));
    expect(screen.getByText(/Motor fenomenológico del seguro/i)).toBeInTheDocument();
  });

  it("returns to cartera tab on 'Volver a Cartera' click", () => {
    render(
      <SegurosComparativeView
        contracts={contractsWithPolicy}
        onSelectContract={noOp}
        onLoadContracts={async () => {}}
        addLog={noOp}
      />
    );
    fireEvent.click(screen.getByText(/⚡ Flujómetro/));
    expect(screen.getByText(/Motor fenomenológico del seguro/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Volver a Cartera/i));
    expect(screen.queryByText(/Motor fenomenológico del seguro/i)).not.toBeInTheDocument();
  });

});

// ── PhenomenonIIIFlowGraph — phase expand/collapse ────────────────────────────
// The redesigned FlowGraph shows all metric values always visible on each card.
// Clicking a card expands/collapses a sub-type detail panel below the card row.
describe("PhenomenonIIIFlowGraph — phase expand/collapse", () => {
  const defaultProps = {
    policies: [],
    hasSiniestro: false,
    indemnizacionPagada: false,
    totalPremium: 0,
    totalCoverage: 0,
    totalDamage: 0,
    totalIndemnizacion: 0,
    riskLevel: 0,
  };

  it("renders all three phase cards by default", () => {
    render(<PhenomenonIIIFlowGraph {...defaultProps} />);
    // F1 / F2 / F3 labels are always visible on the cards
    expect(screen.getByText("F1")).toBeInTheDocument();
    expect(screen.getByText("F2")).toBeInTheDocument();
    expect(screen.getByText("F3")).toBeInTheDocument();
  });

  it("shows no sub-type detail panel before any card is clicked", () => {
    render(<PhenomenonIIIFlowGraph {...defaultProps} />);
    // The expanded detail section header contains "sub-tipos detallados"
    expect(screen.queryByText(/sub-tipos detallados/i)).not.toBeInTheDocument();
  });

  it("expands sub-type detail panel when F1 card is clicked", () => {
    render(<PhenomenonIIIFlowGraph {...defaultProps} />);
    // Click the F1 card (identified by the always-visible "Cobertura" label)
    fireEvent.click(screen.getByText("Cobertura"));
    expect(screen.getByText(/sub-tipos detallados/i)).toBeInTheDocument();
  });

  it("collapses sub-type detail panel on second click of same card", () => {
    render(<PhenomenonIIIFlowGraph {...defaultProps} />);
    fireEvent.click(screen.getByText("Cobertura")); // expand
    expect(screen.getByText(/sub-tipos detallados/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cobertura")); // collapse
    expect(screen.queryByText(/sub-tipos detallados/i)).not.toBeInTheDocument();
  });

  it("shows 'Siniestro ⚡' label on F2 card when siniestro is active", () => {
    render(<PhenomenonIIIFlowGraph {...defaultProps} hasSiniestro={true} totalDamage={50000} />);
    // When hasSiniestro=true the F2 card header changes from "Siniestro" to "Siniestro ⚡"
    expect(screen.getByText(/Siniestro ⚡/)).toBeInTheDocument();
  });

  it("renders circular meters (SVGs) instead of text rows in phase cards", () => {
    const { container } = render(<PhenomenonIIIFlowGraph {...defaultProps} />);
    // 3 cards × 4 meters each = 12 SVG ring gauges
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(12);
  });

  it("no NaN in any circular meter ring when all values are zero", () => {
    const { container } = render(<PhenomenonIIIFlowGraph {...defaultProps} />);
    container.querySelectorAll("circle").forEach(c => {
      const da = c.getAttribute("stroke-dasharray");
      if (da) expect(da).not.toContain("NaN");
    });
  });

  it("clicking a meter shows its per-metric detail panel, not the sub-types panel", () => {
    render(<PhenomenonIIIFlowGraph {...defaultProps} />);
    fireEvent.click(screen.getByText("Prima total anual"));
    // Metric detail header appears inside the card
    expect(screen.getAllByText("Prima total anual").length).toBeGreaterThan(1);
    // Sub-types expansion panel must NOT appear
    expect(screen.queryByText(/sub-tipos detallados/i)).not.toBeInTheDocument();
  });

  it("clicking the same meter twice closes its detail panel", () => {
    render(<PhenomenonIIIFlowGraph {...defaultProps} />);
    fireEvent.click(screen.getByText("Prima total anual")); // open
    expect(screen.getAllByText("Prima total anual").length).toBeGreaterThan(1);
    fireEvent.click(screen.getAllByText("Prima total anual")[0]); // close
    expect(screen.getAllByText("Prima total anual").length).toBe(1);
  });

  it("clicking the card header clears the active metric detail panel", () => {
    render(<PhenomenonIIIFlowGraph {...defaultProps} />);
    // Open a metric detail panel
    fireEvent.click(screen.getByText("Prima total anual"));
    expect(screen.getAllByText("Prima total anual").length).toBeGreaterThan(1);
    // Click the card header (Cobertura) — should clear the metric panel
    fireEvent.click(screen.getByText("Cobertura"));
    expect(screen.getAllByText("Prima total anual").length).toBe(1);
    // Sub-type panel should now be visible
    expect(screen.getByText(/sub-tipos detallados/i)).toBeInTheDocument();
  });

});

// ── CircularMeter — SVG ring geometry ────────────────────────────────────────
describe("CircularMeter — SVG ring geometry", () => {
  const R = 34;
  const CIRC = 2 * Math.PI * R;

  const getFillDash = (container) => {
    const circles = container.querySelectorAll("circle");
    return parseFloat(circles[1].getAttribute("stroke-dasharray").split(" ")[0]);
  };

  it("renders zero-fill ring when pct=0", () => {
    const { container } = render(
      <CircularMeter label="Prima" value="—" icon="💶" pct={0} color="#2563EB" onClick={() => {}} />
    );
    expect(getFillDash(container)).toBeCloseTo(0, 1);
  });

  it("renders full-fill ring when pct=100", () => {
    const { container } = render(
      <CircularMeter label="Cobertura" value="100%" icon="🛡" pct={100} color="#2563EB" onClick={() => {}} />
    );
    expect(getFillDash(container)).toBeCloseTo(CIRC, 1);
  });

  it("clamps negative pct to 0 (no negative dasharray)", () => {
    const { container } = render(
      <CircularMeter label="X" value="—" icon="⚠" pct={-50} color="#f97316" onClick={() => {}} />
    );
    expect(getFillDash(container)).toBeCloseTo(0, 1);
  });

  it("clamps pct above 100 to full ring", () => {
    const { container } = render(
      <CircularMeter label="X" value="150%" icon="⚠" pct={150} color="#f97316" onClick={() => {}} />
    );
    expect(getFillDash(container)).toBeCloseTo(CIRC, 1);
  });

  it("does not produce NaN in stroke-dasharray", () => {
    const { container } = render(
      <CircularMeter label="Prima" value="0€" icon="💶" pct={0} color="#2563EB" onClick={() => {}} />
    );
    const circles = container.querySelectorAll("circle");
    circles.forEach(c => {
      const da = c.getAttribute("stroke-dasharray");
      if (da) expect(da).not.toContain("NaN");
    });
  });

  it("calls onClick when clicked", () => {
    const handler = vi.fn();
    render(
      <CircularMeter label="Test" value="50%" icon="⚡" pct={50} color="#f97316" onClick={handler} />
    );
    fireEvent.click(screen.getByText("Test"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("truncates display value when string exceeds 10 chars", () => {
    const { container } = render(
      <CircularMeter label="Tipo" value="P3.1 Causante directo" icon="👤" pct={100} color="#7c3aed" onClick={() => {}} />
    );
    expect(container.querySelector("text:last-of-type").textContent).toBe("P3.1 Caus…");
  });

  it("applies minimum font size for 10-char truncated display value", () => {
    const { container } = render(
      <CircularMeter label="Tipo" value="P3.1 Causante directo" icon="👤" pct={100} color="#7c3aed" onClick={() => {}} />
    );
    expect(container.querySelector("text:last-of-type").getAttribute("font-size")).toBe("9");
  });

});
