import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const App = lazy(() => import("./App"));
const PublicSite = lazy(() => import("./PublicSite"));

// Remove o prefixo do deploy (ex.: /siteforge) antes de comparar as rotas.
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const pathname = window.location.pathname.replace(/\/$/, "").slice(basePath.length) || "/";
const editorRoute = pathname === "/editor" || pathname.startsWith("/editor/") || pathname === "/preview" || pathname === "/projects";
const publicPage = pathname === "/integrations" ? "integrations" : pathname === "/about" ? "about" : pathname === "/work" ? "work" : "home";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<div className="route-loading"><span className="live-dot" /> Loading SiteForge</div>}>
      {editorRoute ? <App /> : <PublicSite page={publicPage} />}
    </Suspense>
  </StrictMode>
);
