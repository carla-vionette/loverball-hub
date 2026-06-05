/**
 * HomeFallback — a self-contained, dependency-free fallback UI for the
 * homepage. Used as the ErrorBoundary fallback (and Suspense fallback)
 * around the Index route so users never see a blank white screen, even
 * if auth/user data is temporarily missing or a render error occurs.
 *
 * Intentionally uses only inline styles + plain anchor tags so it can
 * render even if the design system, router context, or auth provider
 * have failed to mount.
 */
const HomeFallback = () => {
  const handleRetry = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        minHeight: "100dvh",
        background: "#0a0a0a",
        color: "#FAF5E9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        <div
          style={{
            fontFamily: "'Space Mono', ui-monospace, monospace",
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#E85D2F",
            marginBottom: 16,
            fontWeight: 600,
          }}
        >
          Loverball
        </div>
        <h1
          style={{
            fontFamily: "'Anton', Impact, sans-serif",
            fontWeight: 400,
            fontSize: "clamp(36px, 7vw, 56px)",
            lineHeight: 0.95,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
            margin: "0 0 16px",
          }}
        >
          We're warming up
        </h1>
        <p
          style={{
            color: "#B8B8B8",
            fontSize: 15,
            lineHeight: 1.55,
            margin: "0 0 28px",
          }}
        >
          Loverball is taking a moment to load. Check your connection and try
          again — your spot in the club is still here.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={handleRetry}
            style={{
              background: "#E85D2F",
              color: "#fff",
              border: 0,
              fontFamily: "'Space Mono', ui-monospace, monospace",
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              padding: "14px 26px",
              borderRadius: 999,
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: "0 10px 28px -12px rgba(232,93,47,0.6)",
            }}
          >
            Reload
          </button>
          <a
            href="/events"
            style={{
              color: "#FAF5E9",
              border: "1px solid rgba(250,245,233,0.15)",
              fontFamily: "'Space Mono', ui-monospace, monospace",
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              padding: "14px 26px",
              borderRadius: 999,
              fontWeight: 500,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Browse Events
          </a>
        </div>
      </div>
    </div>
  );
};

export default HomeFallback;
