import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const App = lazy(() => import("./App"));
const PublicSite = lazy(() => import("./PublicSite"));

const pathname = window.location.pathname.replace(/\/$/, "") || "/";
const editorRoute = pathname === "/editor" || pathname.startsWith("/editor/") || pathname === "/preview" || pathname === "/projects";
const publicPage = pathname === "/integrations" ? "integrations" : pathname === "/about" ? "about" : pathname === "/work" ? "work" : "home";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<div className="route-loading"><span className="live-dot" /> Loading SiteForge</div>}>
      {editorRoute ? <App /> : <PublicSite page={publicPage} />}
    </Suspense>
  </StrictMode>
);
