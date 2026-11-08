import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { parseCookie, stringifySetCookie } from "cookie";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import { ensureSchema, findOrCreateUser, getProject, getUserByOpenId, saveProject } from "./db.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const isDev = process.argv.includes("--dev");
const port = Number(process.env.PORT || 3000);
const app = express();
app.set("trust proxy", true);

const sessionAppId = "siteforge";
const sessionCookieName = "webdev_app_session";
const oauthStateCookieName = "siteforge_oauth_state";
const pendingOAuthStates = new Map();

function publicOrigin(req) {
  const configuredOrigin = process.env.PUBLIC_APP_ORIGIN?.replace(/\/$/, "");
  if (configuredOrigin && /^https?:\/\/[^/]+$/i.test(configuredOrigin)) return configuredOrigin;
  const forwardedHost = req.get("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const forwardedProto = req.get("x-forwarded-proto");
  const protocol = forwardedProto ? forwardedProto.split(",")[0].trim() : (req.protocol || "http");
  return `${protocol}://${host}`;
}

function setCookie(res, name, value, options = {}) {
  const secure = res.locals.cookieSecure ?? true;
  const serialized = stringifySetCookie({ name, value, httpOnly: true, path: "/", sameSite: secure ? "none" : "lax", secure, ...options });
  res.append("Set-Cookie", serialized);
}

function clearCookie(res, name) {
  setCookie(res, name, "", { maxAge: 0 });
}

function getCookies(req) {
  return parseCookie(req.headers.cookie || "");
}

app.use((req, res, next) => {
  res.locals.cookieSecure = publicOrigin(req).startsWith("https://");
  next();
});

function encodeState(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodeState(value) {
  try { return JSON.parse(Buffer.from(value, "base64url").toString("utf8")); } catch { return null; }
}

function rememberOAuthState(kind, state) {
  const key = `${kind}:${state.nonce}`;
  pendingOAuthStates.set(key, { nonce: state.nonce, redirectUri: state.redirectUri, expiresAt: Date.now() + 10 * 60 * 1000 });
  setTimeout(() => pendingOAuthStates.delete(key), 10 * 60 * 1000).unref?.();
}

function consumeOAuthState(kind, state, cookieValue) {
  if (!state?.nonce || !state.redirectUri) return false;
  const key = `${kind}:${state.nonce}`;
  const pending = pendingOAuthStates.get(key);
  const savedState = decodeState(cookieValue || "");
  const cookieMatches = savedState?.nonce === state.nonce;
  const pendingMatches = pending?.nonce === state.nonce && pending.redirectUri === state.redirectUri && (pending.expiresAt ?? 0) > Date.now();
  pendingOAuthStates.delete(key);
  return Boolean(cookieMatches || pendingMatches);
}

function isOAuthRedirect(redirectUri, req, pathname) {
  try {
    const parsed = new URL(redirectUri);
    return parsed.pathname === pathname && parsed.search === "" && parsed.hash === "" && parsed.host === new URL(publicOrigin(req)).host;
  } catch {
    return false;
  }
}

function sessionFromRequest(req) {
  const token = getCookies(req)[sessionCookieName];
  const secret = process.env.SESSION_JWT_SECRET;
  const appId = sessionAppId;
  if (!token || !secret || !appId) return null;
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (payload.appId !== appId || typeof payload.openId !== "string") return null;
    return { openId: payload.openId };
  } catch {
    return null;
  }
}

async function authenticatedUser(req) {
  const session = sessionFromRequest(req);
  if (!session) return null;
  return getUserByOpenId(session.openId);
}

function safeUser(user) {
  if (!user) return null;
  return { id: user.id, openId: user.openId, email: user.email, name: user.name };
}

function requireUser(handler) {
  return async (req, res) => {
    try {
      const user = await authenticatedUser(req);
      if (!user) return res.status(401).json({ error: "auth_required" });
      req.siteforgeUser = user;
      return handler(req, res);
    } catch (error) {
      console.error("authenticated route failed", error);
      return res.status(500).json({ error: "server_error" });
    }
  };
}

function normalizeProject(input) {
  if (!input || typeof input !== "object") throw new Error("project_payload_invalid");
  const pages = Array.isArray(input.pages) ? input.pages.slice(0, 50) : [];
  const layers = Array.isArray(input.layers) ? input.layers.slice(0, 250) : [];
  if (pages.some((page) => typeof page?.id !== "string" || typeof page?.path !== "string")) throw new Error("project_pages_invalid");
  if (layers.some((layer) => typeof layer?.id !== "string" || typeof layer?.name !== "string")) throw new Error("project_layers_invalid");
  const selectedColor = typeof input.selectedColor === "string" && /^#[\da-f]{6}$/i.test(input.selectedColor) ? input.selectedColor : "#b8ff3d";
  const font = typeof input.font === "string" && input.font.length <= 64 ? input.font : "Space Grotesk";
  return { pages, layers, selectedColor, font };
}

app.get("/_app/health", (_req, res) => res.json({ ok: true, service: "siteforge", timestamp: new Date().toISOString() }));

app.get("/api/auth/login", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(503).send("Google login is not configured in this environment.");
  const redirectUri = `${publicOrigin(req)}/auth/google/callback`;
  const nonce = crypto.randomBytes(24).toString("base64url");
  const state = encodeState({ redirectUri, nonce });
  rememberOAuthState("google", { redirectUri, nonce });
  setCookie(res, oauthStateCookieName, encodeState({ nonce }), { maxAge: 600 });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  res.redirect(url.toString());
});

app.get("/auth/google/callback", async (req, res) => {
  const state = decodeState(String(req.query.state || ""));
  const code = String(req.query.code || "");
  if (!isOAuthRedirect(state?.redirectUri, req, "/auth/google/callback") || !consumeOAuthState("google", state, getCookies(req)[oauthStateCookieName]) || !code) return res.status(400).send("Authentication state expired. Please try again.");
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error("google_oauth_not_configured");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: state.redirectUri, grant_type: "authorization_code" })
    });
    if (!tokenResponse.ok) throw new Error(`google_token_${tokenResponse.status}`);
    const tokens = await tokenResponse.json();
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${tokens.access_token}` } });
    if (!profileResponse.ok) throw new Error(`google_userinfo_${profileResponse.status}`);
    const profile = await profileResponse.json();
    if (!profile.sub) throw new Error("google_identity_missing_sub");
    const user = await findOrCreateUser({ openId: `google:${profile.sub}`, email: profile.email, name: profile.name });
    const secret = process.env.SESSION_JWT_SECRET;
    if (!secret) throw new Error("session_jwt_secret_missing");
    const token = jwt.sign({ appId: sessionAppId, openId: user.openId, name: user.name }, secret, { algorithm: "HS256", expiresIn: "30d" });
    setCookie(res, sessionCookieName, token, { maxAge: 60 * 60 * 24 * 30 });
    clearCookie(res, oauthStateCookieName);
    res.redirect(`${publicOrigin(req)}/editor?auth=success`);
  } catch (error) {
    console.error("google oauth callback failed", error);
    res.status(502).send("Unable to complete Google login. Please try again.");
  }
});

app.get("/api/me", async (req, res) => {
  try { res.json({ user: safeUser(await authenticatedUser(req)) }); } catch (error) { console.error("me failed", error); res.status(500).json({ error: "server_error" }); }
});
app.post("/api/auth/logout", (req, res) => { clearCookie(res, sessionCookieName); res.json({ ok: true }); });
app.get("/api/project", requireUser(async (req, res) => {
  const project = await getProject(req.siteforgeUser.id);
  res.json({ project });
}));
app.put("/api/project", express.json({ limit: "2mb" }), requireUser(async (req, res) => {
  try {
    const payload = normalizeProject(req.body);
    await saveProject(req.siteforgeUser.id, payload);
    res.json({ ok: true, project: payload });
  } catch (error) {
    res.status(400).json({ error: error.message || "project_invalid" });
  }
}));

app.get("/api/integrations", requireUser(async (_req, res) => {
  res.json({ integrations: [
    { id: "github", name: "GitHub", category: "Workflow", status: "available", description: "Sincronize projetos e publique via branches" },
    { id: "notion", name: "Notion", category: "Content", status: "available", description: "Transforme páginas Notion em conteúdo" },
    { id: "analytics", name: "Analytics", category: "Insights", status: "available", description: "Eventos e conversões do seu site" }
  ] });
}));

app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));

if (isDev) {
  // Preview is served through the platform proxy, which does not expose Vite's HMR socket.
  // Disable HMR by default so /@vite/client is not injected into the public Preview page.
  const vite = await createViteServer({ root, server: { middlewareMode: true, allowedHosts: true, hmr: process.env.SITEFORGE_ENABLE_HMR === "true" }, appType: "custom" });
  app.get("/{*splat}", async (req, res, next) => {
    const isDocumentRequest = !path.extname(req.path) && (!req.headers.accept || req.headers.accept.includes("text/html"));
    if (!isDocumentRequest) return next();
    try {
      const source = await readFile(path.join(root, "index.html"), "utf8");
      const html = await vite.transformIndexHtml(req.originalUrl, source);
      res.status(200).type("html").send(html.replace(/\s*<script type="module" src="\/@vite\/client"><\/script>/, ""));
    } catch (error) {
      next(error);
    }
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(root, "dist"), { index: "index.html" }));
  app.get("/{*splat}", (_req, res) => res.sendFile(path.join(root, "dist", "index.html")));
}

ensureSchema().then((status) => console.log(`SiteForge server ready on ${port} (${status.mode})`)).catch((error) => console.error("database schema setup failed", error));
app.listen(port, "0.0.0.0", () => console.log(`SiteForge listening on ${port}`));
