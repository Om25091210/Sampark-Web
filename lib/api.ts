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
  // ADR-041/046. The 4 reporting-recency tiers as counts that PARTITION every
  // live cadre in scope by days since their latest report; the four sum to
  // totalCadres. सामान्य/सतर्क/जोखिम/उच्च जोखिम.
  reportingRecency: {
    current: number;
    overdue1m: number;
    overdue2m: number;
    overdue3m: number;
  };
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
  // ADR-055: an SDOP (admin) caller gets "officers" (their own roster), HQ
  // (super_admin) gets "admins" (one row per SDOP), ?by=thana gets "thanas".
  // "sdops" was never a real value the backend returns -- fixed to match.
  level: "officers" | "admins" | "thanas";
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

// ─── Officers (admin+) ────────────────────────────────────────────────────────

export interface WireOfficer extends WireUser {
  assignedCadreCount: number;
}

export interface ListOfficersParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listOfficers(params: ListOfficersParams): Promise<PaginatedResponse<WireOfficer>> {
  return apiFetch<PaginatedResponse<WireOfficer>>("/officers", {
    query: { search: params.search, page: params.page, pageSize: params.pageSize },
  });
}

// ─── Reports (aggregate feed, ADR-021) ───────────────────────────────────────

export interface WireReportCadre {
  id: number;
  name: string;
  phone: string;
  avatarUrl?: string;
}

export interface WireReport {
  id: number;
  cadreId: number;
  cadre?: WireReportCadre;
  reportingPlace: "thana" | "village";
  personStatus: "alive" | "dead";
  currentActivity: string;
  reportedAt: string;
  reportedBy: number;
}

export interface ListReportsParams {
  reportedBy?: string | number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listReports(params: ListReportsParams): Promise<PaginatedResponse<WireReport>> {
  return apiFetch<PaginatedResponse<WireReport>>("/reports", {
    query: {
      reportedBy: params.reportedBy !== undefined ? String(params.reportedBy) : undefined,
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
}

// ─── Notifications (ADR-048) ─────────────────────────────────────────────────

export interface WireNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  cadreId?: number;
  cadreChangeId?: number;
  cadreCreateRequestId?: number;
  readAt?: string;
  createdAt: string;
}

export interface ListNotificationsParams {
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listNotifications(
  params: ListNotificationsParams,
): Promise<PaginatedResponse<WireNotification>> {
  return apiFetch<PaginatedResponse<WireNotification>>("/notifications", {
    query: { unreadOnly: params.unreadOnly ? "true" : undefined, page: params.page, pageSize: params.pageSize },
  });
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await apiFetch<{ count: number }>("/notifications/unread-count");
  return res.count;
}

export async function markNotificationRead(id: number): Promise<void> {
  return apiFetch<void>(`/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead(): Promise<void> {
  return apiFetch<void>("/notifications/read-all", { method: "POST" });
}

// ─── Users (Phase 2 — web User Management, super_admin only) ────────────────────

export interface ListUsersParams {
  role?: string;
  thana?: string;
  subDivision?: string;
  status?: "active" | "deactivated" | "all";
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateUserBody {
  name: string;
  email: string;
  role: WireUser["role"];
  password?: string;
  thana?: string;
  subDivision?: string;
  designation?: string;
}

export interface UpdateUserBody {
  role?: WireUser["role"];
  thana?: string | null;
  subDivision?: string | null;
  designation?: string | null;
}

export async function listUsers(params: ListUsersParams): Promise<PaginatedResponse<WireUser>> {
  return apiFetch<PaginatedResponse<WireUser>>("/users", {
    query: {
      role: params.role,
      thana: params.thana,
      subDivision: params.subDivision,
      status: params.status,
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
}

export async function getUser(userId: number): Promise<WireUser> {
  return apiFetch<WireUser>(`/users/${userId}`);
}

export async function createUser(body: CreateUserBody): Promise<WireUser> {
  return apiFetch<WireUser>("/users", { method: "POST", body });
}

export async function updateUser(userId: number, body: UpdateUserBody): Promise<WireUser> {
  return apiFetch<WireUser>(`/users/${userId}`, { method: "PATCH", body });
}

export async function setUserPassword(userId: number, password: string): Promise<void> {
  return apiFetch<void>(`/users/${userId}/password`, { method: "POST", body: { password } });
}

export async function deactivateUser(userId: number): Promise<void> {
  return apiFetch<void>(`/users/${userId}`, { method: "DELETE" });
}

// ─── Cadre changes (approval ladder, ADR-026/027/028) ────────────────────────

export interface WireChangeCadre {
  id: number;
  name: string;
  serialNumber?: string;
}

export interface WireChangeSubmitter {
  id: number;
  name: string;
  role: WireUser["role"];
}

export interface WireChangeFieldDiff {
  old: unknown;
  new: unknown;
}

export interface WireCadreChange {
  id: number;
  cadreId: number;
  cadre?: WireChangeCadre;
  changes: Record<string, WireChangeFieldDiff>;
  submittedBy: WireChangeSubmitter;
  submittedAt: string;
  note?: string;
  status: "pending" | "applied" | "rejected" | "cancelled" | "stale";
  needsAdmin: boolean;
  needsSuperAdmin: boolean;
  awaitingRole: "admin" | "super_admin" | null;
}

export interface ListCadreChangesParams {
  status?: WireCadreChange["status"];
  submittedBy?: string | number;
  cadreId?: number;
  /** The approver queue: only what the caller can act on next. */
  awaitingMe?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listCadreChanges(
  params: ListCadreChangesParams,
): Promise<PaginatedResponse<WireCadreChange>> {
  return apiFetch<PaginatedResponse<WireCadreChange>>("/changes", {
    query: {
      status: params.status,
      submittedBy: params.submittedBy !== undefined ? String(params.submittedBy) : undefined,
      cadreId: params.cadreId,
      awaitingMe: params.awaitingMe ? "true" : undefined,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
}

export async function approveCadreChange(id: number): Promise<WireCadreChange> {
  return apiFetch<WireCadreChange>(`/changes/${id}/approve`, { method: "POST" });
}

export async function rejectCadreChange(id: number, reason: string): Promise<WireCadreChange> {
  return apiFetch<WireCadreChange>(`/changes/${id}/reject`, { method: "POST", body: { reason } });
}

// ─── Config (Phase 6 — Configuration page, super_admin only, ADR-059) ───────────

export interface WireConfig {
  sheetsSyncUrl: string | null;
  updatedAt: string;
  updatedById: number | null;
}

export interface WireSyncLogEntry {
  id: number;
  eventType: string;
  targetKey: string | null;
  status: "success" | "error";
  error: string | null;
  createdAt: string;
}

export async function getConfig(): Promise<WireConfig> {
  return apiFetch<WireConfig>("/config");
}

export async function updateConfig(sheetsSyncUrl: string | null): Promise<WireConfig> {
  return apiFetch<WireConfig>("/config", { method: "PATCH", body: { sheetsSyncUrl } });
}

export async function listSyncLog(limit = 20): Promise<WireSyncLogEntry[]> {
  return apiFetch<WireSyncLogEntry[]>("/config/sync-log", { query: { limit } });
}

export { ApiError };
