// src/components/ErrorBoundary.jsx
// React Error Boundary — catches render errors in child trees, logs them,
// and shows a recovery UI instead of a blank/crashed screen.
// Must be a class component (React does not support hooks for error boundaries).

import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log for debugging; swap `console.error` for Sentry.captureException in production
    console.error("[ErrorBoundary] Caught render error:", error, info.componentStack);
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { label = "This section" } = this.props;

    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "280px",
        padding: "2rem",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "20px",
        textAlign: "center",
        gap: "1rem",
      }}>
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
        }}>
          ⚠️
        </div>

        <div>
          <h3 style={{ color: "#f4f4f5", fontWeight: 700, marginBottom: "0.4rem", fontSize: "1.1rem" }}>
            {label} failed to load
          </h3>
          <p style={{ color: "#a1a1aa", fontSize: "0.875rem", lineHeight: 1.6, maxWidth: "360px" }}>
            A temporary issue occurred. This won&apos;t affect the rest of the app.
          </p>
        </div>

        <button
          onClick={this.reset}
          style={{
            padding: "0.6rem 1.5rem",
            borderRadius: "99px",
            background: "rgba(0,229,255,0.1)",
            border: "1px solid rgba(0,229,255,0.3)",
            color: "#00e5ff",
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(0,229,255,0.2)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(0,229,255,0.1)")}
        >
          ↻ Try Again
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
