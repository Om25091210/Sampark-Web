// Typed API client for the SAMPARK backend (Fastify, /api/v1). Plain fetch + local
// state per the repo's stack rules — no React Query / axios / global store.
//
// Auth model (ADR-042): email+password, then TOTP for admin/super_admin. Tokens are
// stored in plain (non-httpOnly) cookies so `middleware.ts` can read them server-side
// for real route gating — a step up from the previous sessionStorage flag, which no
// middleware could ever see. This is NOT a claim of bank-grade security (an XSS bug
// could still read the cookie); it matches the scale/complexity this app targets today.

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "https://api.bsmart.net.in/api/v1";

const ACCESS_COOKIE = "sampark_access_token";
const REFRESH_COOKIE = "sampark_refresh_token";
const ROLE_COOKIE = "sampark_role";

// ─── Cookie helpers (client-side only) ─────────────────────────────────────────

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

function storeTokens(accessToken: string, refreshToken: string, role: string) {
  setCookie(ACCESS_COOKIE, accessToken, ACCESS_TTL_SECONDS);
  setCookie(REFRESH_COOKIE, refreshToken, REFRESH_TTL_SECONDS);
  setCookie(ROLE_COOKIE, role, REFRESH_TTL_SECONDS);
}

export function clearSession() {
  clearCookie(ACCESS_COOKIE);
  clearCookie(REFRESH_COOKIE);
  clearCookie(ROLE_COOKIE);
}

export function getRole(): string | null {
  return getCookie(ROLE_COOKIE);
}

export function hasSession(): boolean {
  return getCookie(ACCESS_COOKIE) !== null;
}

// ─── Wire types (camelCase entities, snake_case auth per the backend contract) ──

export interface WireUser {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: "super_admin" | "admin" | "officer" | "viewer";
  designation?: string;
  thana?: string;
  subDivision?: string;
  avatarUrl?: string;
  status?: "active" | "deactivated";
}

export interface AuthedResult {
  status: "authenticated";
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  user: WireUser;
}
export interface TotpRequiredResult {
  status: "totp_required";
  challenge_token: string;
  expires_in: number;
}
export interface TotpEnrollmentResult {
  status: "totp_enrollment";
  challenge_token: string;
  expires_in: number;
  totp_secret: string;
  totp_uri: string;
}
export type LoginResult = AuthedResult | TotpRequiredResult | TotpEnrollmentResult;

export interface DashboardStats {
  totalCadres: number;
  activeAlerts: number;
  reportsThisWeek: number;
  pendingReporting: number;
  byCategory: {
    surrendered: { district: number; other: number; total: number };
    thana: number;
    jail: number;
  };
  alertLevelBreakdown: { normal: number; warning: number; critical: number };
}

export interface HierarchyRow {
  id: number;
  name: string;
  thana: string | null;
  subDivision: string | null;
  assignedCadres: number;
  overdueCadres: number;
  currentCadres: number;
  reportingCompletion: number;
}

export interface HierarchyStats {
  level: "officers" | "sdops" | "thanas";
  rows: HierarchyRow[];
  totalAssigned: number;
  totalCurrent: number;
  overallCompletion: number;
  unassignedCadres: number;
}

export interface WireCadre {
  id: number;
  serialNumber?: string;
  name: string;
  phone: string;
  thana: string;
  currentAddress: string;
  designation: string;
  category: "surrendered" | "thana" | "jail";
  alertLevel: "critical" | "warning" | "normal";
  alertTag?: string;
  aliases: string[];
  avatarUrl?: string;
  assignedOfficerId?: number;
  surrenderOrigin?: "district" | "other";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CadreFacets {
  thanas: string[];
  designations: string[];
}

// ─── Core fetch wrapper: attaches Bearer, retries once through /auth/refresh on 401 ──

class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const refreshToken = getCookie(REFRESH_COOKIE);
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { access_token: string; refresh_token?: string };
    const role = getCookie(ROLE_COOKIE) ?? "";
    setCookie(ACCESS_COOKIE, body.access_token, ACCESS_TTL_SECONDS);
    if (body.refresh_token) setCookie(REFRESH_COOKIE, body.refresh_token, REFRESH_TTL_SECONDS);
    if (role) setCookie(ROLE_COOKIE, role, REFRESH_TTL_SECONDS);
    return true;
  } catch {
    return false;
  }
}

// Single-flight: concurrent 401s during one refresh share the same in-flight promise
// instead of each firing their own POST /auth/refresh (mirrors the mobile client's
// interceptor pattern, src/services/api.ts).
async function refreshOnce(): Promise<boolean> {
  if (refreshInFlight === null) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | string[] | undefined>;
}

function buildQuery(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    } else {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function apiFetch<T>(path: string, opts: RequestOptions = {}, isRetry = false): Promise<T> {
  const accessToken = getCookie(ACCESS_COOKIE);
  const res = await fetch(`${BASE_URL}${path}${buildQuery(opts.query)}`, {
    method: opts.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && !isRetry && accessToken) {
    const refreshed = await refreshOnce();
    if (refreshed) return apiFetch<T>(path, opts, true);
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError(401, "Session expired");
  }

  if (res.status === 204) return undefined as T;

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    const err = body as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(res.status, err?.error?.message ?? res.statusText, err?.error?.code);
  }

  return body as T;
}

// ─── Auth ───────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<LoginResult> {
  const result = await apiFetch<LoginResult>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (result.status === "authenticated") {
    storeTokens(result.access_token, result.refresh_token, result.user.role);
  }
  return result;
}

export async function verifyTwoFactor(challengeToken: string, otp: string): Promise<AuthedResult> {
  const result = await apiFetch<AuthedResult>("/auth/2fa/verify", {
    method: "POST",
    body: { challenge_token: challengeToken, otp },
  });
  storeTokens(result.access_token, result.refresh_token, result.user.role);
  return result;
}

export async function me(): Promise<WireUser> {
  return apiFetch<WireUser>("/auth/me");
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>("/auth/logout", { method: "POST" });
  } finally {
    clearSession();
  }
}

// ─── Stats ──────────────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/stats/dashboard");
}

export async function getHierarchyStats(by?: "thana"): Promise<HierarchyStats> {
  return apiFetch<HierarchyStats>("/stats/hierarchy", { query: { by } });
}

// ─── Cadres ─────────────────────────────────────────────────────────────────────

export interface ListCadresParams {
  category?: string[];
  search?: string;
  thana?: string[];
  alertLevel?: string[];
  page?: number;
  pageSize?: number;
}

export async function listCadres(params: ListCadresParams): Promise<PaginatedResponse<WireCadre>> {
  return apiFetch<PaginatedResponse<WireCadre>>("/cadres", {
    query: {
      category: params.category,
      search: params.search,
      thana: params.thana,
      alertLevel: params.alertLevel,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
}

export async function getCadreFacets(category?: string): Promise<CadreFacets> {
  return apiFetch<CadreFacets>("/cadres/facets", { query: { category } });
}

export { ApiError };
