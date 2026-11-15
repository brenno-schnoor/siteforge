import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./mobile.css";
import "./glass.css";
import { appPath } from "./paths";
import ErrorBoundary from "./ErrorBoundary";

const App = lazy(() => import("./App"));
const PublicSite = lazy(() => import("./PublicSite"));
const NotFound = lazy(() => import("./NotFound"));

// Rotas sem o prefixo do deploy (ex.: /siteforge/about vira /about).
const pathname = appPath();
const editorRoute = pathname === "/editor" || pathname.startsWith("/editor/") || pathname === "/preview" || pathname === "/projects";
const publicRoutes = ["/", "/work", "/about", "/integrations"];
const knownRoute = editorRoute || publicRoutes.includes(pathname);
const publicPage = pathname === "/integrations" ? "integrations" : pathname === "/about" ? "about" : pathname === "/work" ? "work" : "home";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<div className="route-loading"><span className="live-dot" /> Loading SiteForge</div>}>
      <ErrorBoundary>{!knownRoute ? <NotFound /> : editorRoute ? <App /> : <PublicSite page={publicPage} />}</ErrorBoundary>
    </Suspense>
  </StrictMode>
);
