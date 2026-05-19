import { ReactNode } from "react";
import { BrowserRouter, HashRouter } from "react-router-dom";

/**
 * Choose a Router implementation at module load time.
 *
 * Production (`loverball.com`, custom domains) and local dev render under
 * a clean root path, so BrowserRouter works as normal and URLs stay clean.
 *
 * Private preview deploys, however, serve the built bundle from a deep
 * proxied subpath (e.g. `https://<id>.sites.pplx.app/web/direct-files/<id>/dist/index.html`).
 * BrowserRouter would read that whole pathname as the current route, which
 * matches no route in this app and renders NotFound. HashRouter sidesteps
 * the issue by carrying the route in `#/...` — the hash is ignored by the
 * proxy and routing works regardless of how deep the hosting path is.
 *
 * Pure window-based detection — no env vars, no build flag, so the same
 * bundle works in production and on preview hosts unchanged.
 */
function isPreviewHost(): boolean {
  if (typeof window === "undefined") return false;
  const { hostname, pathname } = window.location;
  return (
    hostname.includes("sites.pplx.app") ||
    pathname.includes("/web/direct-files/") ||
    pathname.endsWith("/dist/index.html")
  );
}

const PREVIEW = isPreviewHost();

export function AppRouter({ children }: { children: ReactNode }) {
  if (PREVIEW) {
    return <HashRouter>{children}</HashRouter>;
  }
  return <BrowserRouter>{children}</BrowserRouter>;
}

export default AppRouter;
