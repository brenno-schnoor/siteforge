import { BASE } from "./paths";

// Endereço base do projeto (sem /rest/v1). A chave anon é pública por desenho:
// a segurança dos dados vem das regras de RLS no banco.
// Valores padrão do projeto. Uma variável VITE_* definida no build substitui estes valores.
const DEFAULT_SUPABASE_URL = "https://fxtlzjfsedmnrcmqqzgh.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4dGx6amZzZWRtbnJjbXFxemdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxNTU2NzEsImV4cCI6MjEwOTczMTY3MX0.7sStWJCn5cm2ZJT-z6j9ceuFMdoKkG_IitK88_H0bs0";
const SUPABASE_URL = ((import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL) as string).replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY) as string;
const SESSION_KEY = "siteforge-supabase-session";

type Session = { access_token: string; refresh_token: string; expires_at: number };
export type CloudUser = { id: string; email: string; name: string };

export const supabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

// Depois do login com Google, o Supabase devolve os tokens no fragmento da URL (#access_token=...).
// Guardamos a sessão e limpamos a URL, marcando ?auth=success para a mensagem de boas-vindas.
function captureSessionFromUrl() {
  if (!window.location.hash.includes("access_token=")) return;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get("access_token");
  if (!accessToken) return;
  writeSession({
    access_token: accessToken,
    refresh_token: params.get("refresh_token") ?? "",
    expires_at: Date.now() + Number(params.get("expires_in") ?? 3600) * 1000,
  });
  window.history.replaceState({}, "", `${window.location.pathname}?auth=success`);
}

async function validAccessToken(): Promise<string | null> {
  const session = readSession();
  if (!session) return null;
  if (session.expires_at - 60_000 > Date.now()) return session.access_token;
  if (!session.refresh_token) {
    writeSession(null);
    return null;
  }
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!response.ok) {
    writeSession(null);
    return null;
  }
  const data = await response.json();
  writeSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + Number(data.expires_in) * 1000,
  });
  return data.access_token as string;
}

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await validAccessToken();
  if (!token) throw new Error("not_signed_in");
  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${token}`, ...(init.headers as Record<string, string>) },
  });
}

export async function getCurrentUser(): Promise<CloudUser | null> {
  if (!supabaseConfigured()) return null;
  captureSessionFromUrl();
  const token = await validAccessToken();
  if (!token) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    writeSession(null);
    return null;
  }
  const user = await response.json();
  return {
    id: user.id,
    email: user.email ?? "",
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "",
  };
}

export function beginGoogleLogin() {
  const redirectTo = `${window.location.origin}${BASE}/editor`;
  window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
}

export async function signOutCloud() {
  try {
    const token = await validAccessToken();
    if (token) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${token}` },
      });
    }
  } finally {
    writeSession(null);
  }
}

// Lê o projeto do usuário logado. Com RLS, a consulta só retorna a linha dele.
export async function loadCloudProject(): Promise<unknown | null> {
  const response = await authedFetch("/rest/v1/projects?select=payload");
  if (!response.ok) throw new Error(`load_failed_${response.status}`);
  const rows = (await response.json()) as Array<{ payload: unknown }>;
  return rows[0]?.payload ?? null;
}

// Cria ou atualiza o projeto do usuário. user_id é preenchido por auth.uid() no banco.
export async function saveCloudProject(payload: unknown) {
  const response = await authedFetch("/rest/v1/projects", {
    method: "POST",
    headers: { "content-type": "application/json", prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ payload }),
  });
  if (!response.ok) throw new Error(`save_failed_${response.status}`);
}
