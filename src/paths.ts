// Prefixo do deploy: "/siteforge" no GitHub Pages, vazio em desenvolvimento e no Docker.
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// Monta um caminho interno com o prefixo correto. Ex.: url("/editor") -> "/siteforge/editor"
export const url = (path: string) => `${BASE}${path}`;

// Caminho atual sem o prefixo, para comparar com as rotas do app.
export const appPath = () => window.location.pathname.replace(/\/+$/, "").slice(BASE.length) || "/";
