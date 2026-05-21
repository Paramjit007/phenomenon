/**
 * ErrorBoundary — catches render errors and shows a useful fallback
 * instead of letting the whole app go blank.
 *
 * Use one at the app root (final safety net) and one around each major
 * panel/tab so a local bug stays local.
 *
 *   <ErrorBoundary scope="seguros">
 *     <SegurosComparativeView ... />
 *   </ErrorBoundary>
 *
 * Props:
 *   scope?: string         — short label shown in the fallback ("seguros", "graph", "app")
 *   fallback?: ReactNode   — custom fallback element; replaces the default UI
 *   onError?: (err, info)  — optional callback (telemetry hook)
 *   children: ReactNode
 *
 * The boundary tracks its own reset count so users can retry rendering after
 * fixing root state (e.g., clicking "Try again" re-mounts the subtree).
 */
import { Component } from "react";
import { C } from "../constants.js";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null, resetKey: 0, showStack: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    try {
      // Visible in the browser console + any backend log shipper.
      console.error(
        `[ErrorBoundary:${this.props.scope || "unknown"}]`,
        error,
        info?.componentStack,
      );
    } catch {
      /* never let logging itself crash */
    }
    if (typeof this.props.onError === "function") {
      try { this.props.onError(error, info); } catch { /* swallow */ }
    }
  }

  handleReset = () => {
    this.setState((s) => ({
      error: null,
      info: null,
      resetKey: s.resetKey + 1,
      showStack: false,
    }));
  };

  handleReload = () => {
    try { window.location.reload(); } catch { /* noop */ }
  };

  render() {
    const { error, info, showStack } = this.state;
    if (!error) {
      // Keying the children on resetKey forces a fresh mount after retry.
      return <div key={this.state.resetKey} style={{ display: "contents" }}>{this.props.children}</div>;
    }

    if (this.props.fallback) return this.props.fallback;

    const scope = this.props.scope || "componente";
    const message = error?.message || String(error);
    const stack = info?.componentStack || error?.stack || "";

    return (
      <div
        data-testid={`error-boundary-${scope}`}
        role="alert"
        style={{
          padding: 24,
          margin: 12,
          border: `1px solid ${C.red}`,
          borderRadius: 8,
          background: C.redBg,
          color: C.textDark,
          fontFamily: "system-ui, -apple-system, sans-serif",
          maxWidth: "100%",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: C.red, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 16, flexShrink: 0,
            }}
          >!</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.red }}>
            Error en: <code style={{ background: "rgba(220,38,38,0.1)", padding: "2px 6px", borderRadius: 4 }}>{scope}</code>
          </div>
        </div>

        <div style={{ fontSize: 13, marginBottom: 12, color: C.textBody, lineHeight: 1.45 }}>
          Esta sección no se pudo renderizar. El resto de la aplicación sigue funcionando.
          Puedes reintentar o recargar la página completa.
        </div>

        <div style={{
          background: "#fff", border: `1px solid ${C.border}`,
          borderRadius: 6, padding: "10px 12px", marginBottom: 12,
          fontFamily: "ui-monospace, 'Cascadia Code', monospace",
          fontSize: 12.5, color: C.textBody, wordBreak: "break-word",
        }}>
          {message}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={this.handleReset}
            data-testid={`error-boundary-${scope}-retry`}
            style={{
              padding: "7px 14px", border: `1px solid ${C.red}`,
              background: C.red, color: "#fff", borderRadius: 5,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >Reintentar</button>
          <button
            onClick={this.handleReload}
            style={{
              padding: "7px 14px", border: `1px solid ${C.borderStrong}`,
              background: "#fff", color: C.textDark, borderRadius: 5,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >Recargar página</button>
          {stack ? (
            <button
              onClick={() => this.setState((s) => ({ showStack: !s.showStack }))}
              style={{
                padding: "7px 14px", border: `1px solid ${C.borderStrong}`,
                background: "transparent", color: C.textMuted, borderRadius: 5,
                fontSize: 13, cursor: "pointer",
              }}
            >{showStack ? "Ocultar detalles" : "Ver detalles técnicos"}</button>
          ) : null}
        </div>

        {showStack && stack ? (
          <pre style={{
            marginTop: 14, padding: 12, fontSize: 11.5,
            background: "#1f2937", color: "#e5e7eb",
            borderRadius: 6, overflow: "auto", maxHeight: 280,
            fontFamily: "ui-monospace, 'Cascadia Code', monospace",
            whiteSpace: "pre-wrap",
          }}>{stack}</pre>
        ) : null}
      </div>
    );
  }
}

export default ErrorBoundary;
