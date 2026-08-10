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
  permanentAddress?: string;
  residingVillage?: string;
  designation: string;
  category: "surrendered" | "thana" | "jail";
  priorityCategory?: "A" | "B" | "C" | "jail" | "death";
  permanentStatus?: "deceased" | "government_job" | "gs" | "living_elsewhere";
  alertLevel: "critical" | "warning" | "normal";
  alertDate?: string;
  incident?: string;
  verificationOffice?: string;
  supervisoryOffice?: string;
  alertTag?: string;
  aliases: string[];
  avatarUrl?: string;
  /** ADR-054. Two more independent photo slots, never a fallback for avatarUrl. */
  avatarUrl2?: string;
  avatarUrl3?: string;
  assignedOfficerId?: number;
  surrenderDate?: string;
  surrenderLocation?: string;
  surrenderOrigin?: "district" | "other";
  surrenderYear?: string;
  regiment?: string;
  familyGroupInfo?: string;
  subDivision?: string;
  district?: string;
  dateOfBirth?: string;
  /** Derived server-side from dateOfBirth — never proposed directly. */
  age?: number;
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  gender?: string;
  caste?: string;
  hasAadhaar?: boolean;
  hasBankAccount?: boolean;
  hasAbProforma?: boolean;
  hasAgreementLetter?: boolean;
  nextReportingDueAt?: string;
  /** ADR-023. Latest report's date — absent when the cadre has never reported. */
  lastReportedAt?: string;
  /** ADR-027. Always sent by the API — empty array means nothing pending. */
  pendingFields?: string[];
  lastEditedAt?: string;
  lastEditedBy?: { id: number; name: string };
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
  /** Dashboard "लंबित रिपोर्टिंग" tile drill-down — no live report in the last 30 days. */
  pendingReporting?: boolean;
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
      pendingReporting: params.pendingReporting ? "true" : undefined,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
}

export async function getCadreFacets(category?: string): Promise<CadreFacets> {
  return apiFetch<CadreFacets>("/cadres/facets", { query: { category } });
}

export async function getCadre(id: number): Promise<WireCadre> {
  return apiFetch<WireCadre>(`/cadres/${id}`);
}

// ADR-018. Reassign a cadre to another officer (admin+ — every web session is,
// per ADR-042/056, so this is never role-gated on this client).
export async function transferCadre(cadreId: number, toOfficerId: number): Promise<void> {
  await apiFetch<void>(`/cadres/${cadreId}/transfer`, {
    method: "POST",
    body: { to_officer_id: toOfficerId },
  });
}

// ADR-026. Every cadre field EXCEPT tags/aliases (which write direct, see
// patchCadreDirect below) and the three avatar slots (web does not offer photo
// upload — mirrors mobile's ChangeableFields minus avatarKey/2/3).
export interface ChangeableCadreFields {
  name?: string;
  phone?: string;
  thana?: string;
  currentAddress?: string;
  permanentAddress?: string | null;
  residingVillage?: string | null;
  designation?: string;
  incident?: string | null;
  verificationOffice?: string | null;
  supervisoryOffice?: string | null;
  surrenderDate?: string | null;
  surrenderLocation?: string | null;
  surrenderOrigin?: "district" | "other" | null;
  surrenderYear?: string | null;
  familyGroupInfo?: string | null;
  subDivision?: string | null;
  district?: string | null;
  dateOfBirth?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  spouseName?: string | null;
  gender?: "male" | "female" | null;
  caste?: string | null;
  priorityCategory?: "A" | "B" | "C" | "jail" | "death" | null;
  permanentStatus?: "deceased" | "government_job" | "gs" | "living_elsewhere" | null;
  hasAadhaar?: boolean;
  hasBankAccount?: boolean;
  hasAbProforma?: boolean;
  hasAgreementLetter?: boolean;
}

// Officer/admin → queued for approval; super_admin → applied immediately (still
// recorded, status `applied`). Same call either way — the backend decides which,
// the caller reads `status` off the response to know which happened.
export async function submitCadreChange(
  cadreId: number,
  payload: { changes: ChangeableCadreFields; note?: string },
): Promise<WireCadreChange> {
  return apiFetch<WireCadreChange>(`/cadres/${cadreId}/changes`, {
    method: "POST",
    body: payload,
  });
}

// ADR-026 direct write — tags/aliases ONLY, no approval. Every other field must
// go through submitCadreChange.
export async function patchCadreDirect(
  cadreId: number,
  body: { alertTag?: string | null; aliases?: string[] },
): Promise<void> {
  await apiFetch<void>(`/cadres/${cadreId}`, { method: "PATCH", body });
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

export interface WireReportGps {
  latitude: number;
  longitude: number;
  address: string;
}

// Full shape (matches lib/serialize.ts's toWireReport on the backend, used by
// BOTH GET /reports and GET /cadres/:id/reports/:rid) -- GET /reports already
// returns every field per row, not a thinner list-only pick, so a report
// detail view needs no separate fetch beyond what listReports already got.
export interface WireReport {
  id: number;
  cadreId: number;
  cadre?: WireReportCadre;
  reportingPlace: "thana" | "village";
  specificLocation: string;
  personStatus: "alive" | "dead";
  currentPhone: string;
  currentActivity: string;
  /** ADR-050. "अन्य माओवादियों से समर्पण हुआ विवरण". Absent when not filled. */
  surrenderNetworkDetails?: string;
  /** ADR-050. "अन्य जानकारी" — free-form catch-all. Absent when not filled. */
  otherInformation?: string;
  /** Legacy single-photo URL, for older rows. Prefer photoUrls. */
  photoUrl?: string;
  photoUrls?: string[];
  gpsCoords?: WireReportGps;
  isHomeAddress?: boolean;
  reportedAt: string;
  reportedBy: number;
}

export interface ListReportsParams {
  reportedBy?: string | number;
  search?: string;
  /** Dashboard "इस सप्ताह रिपोर्ट" tile drill-down — reports on/after this ISO instant. */
  reportedAfter?: string;
  page?: number;
  pageSize?: number;
}

export async function listReports(params: ListReportsParams): Promise<PaginatedResponse<WireReport>> {
  return apiFetch<PaginatedResponse<WireReport>>("/reports", {
    query: {
      reportedBy: params.reportedBy !== undefined ? String(params.reportedBy) : undefined,
      search: params.search,
      reportedAfter: params.reportedAfter,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
}

export interface ListCadreReportsParams {
  /** YYYY-MM-DD, India calendar day — matches the mobile date filter (ADR-024). */
  date?: string;
  page?: number;
  pageSize?: number;
}

export async function listReportsByCadre(
  cadreId: number,
  params: ListCadreReportsParams,
): Promise<PaginatedResponse<WireReport>> {
  return apiFetch<PaginatedResponse<WireReport>>(`/cadres/${cadreId}/reports`, {
    query: { date: params.date, page: params.page, pageSize: params.pageSize },
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
  /** ADR-029. Present only for avatarKey/2/3 -- signed preview URLs for the diff. */
  oldUrl?: string;
  newUrl?: string;
}

export interface WireApprovedBy {
  id: number;
  name: string;
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
  adminApprovedBy?: WireApprovedBy;
  adminApprovedAt?: string;
  superAdminApprovedBy?: WireApprovedBy;
  superAdminApprovedAt?: string;
  decidedAt?: string;
  decidedReason?: string;
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

// ─── Cadre CREATE requests (new cadre, same ADR-026/027/028 ladder) ──────────
//
// A whole new record proposed by an officer/admin, not an edit to an existing
// one -- flat resource, no cadreId yet. Same two-rung approval chain as
// cadre-changes, but the payload is a full draft rather than a field diff.

export interface WireCadreDraft {
  name: string;
  phone: string;
  thana: string;
  currentAddress: string;
  designation: string;
  category: "surrendered" | "thana" | "jail";
  permanentAddress?: string | null;
  residingVillage?: string | null;
  verificationOffice?: string | null;
  supervisoryOffice?: string | null;
  incident?: string | null;
  surrenderLocation?: string | null;
  surrenderYear?: string | null;
  surrenderDate?: string | null;
  surrenderOrigin?: "district" | "other" | null;
  familyGroupInfo?: string | null;
  subDivision?: string | null;
  district?: string | null;
  gender?: "male" | "female" | null;
  caste?: string | null;
  dateOfBirth?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  spouseName?: string | null;
  priorityCategory?: "A" | "B" | "C" | "jail" | "death" | null;
  hasAadhaar: boolean;
  hasBankAccount: boolean;
  hasAbProforma: boolean;
  hasAgreementLetter: boolean;
  avatarKey?: string | null;
  avatarKey2?: string | null;
  avatarKey3?: string | null;
  /** Signed preview URLs for whichever avatarKey slots are set (ADR-029). */
  avatarUrl?: string;
  avatarUrl2?: string;
  avatarUrl3?: string;
}

export interface WireDuplicateWarning {
  cadres: { id: number; name: string; serialNumber: string | null; thana: string }[];
  createRequests: { id: number; name: string; submittedBy: string }[];
}

export interface WireCadreCreateRequest {
  id: number;
  draft: WireCadreDraft;
  submittedBy: WireChangeSubmitter;
  submittedAt: string;
  note?: string;
  status: "pending" | "applied" | "rejected" | "cancelled";
  needsAdmin: boolean;
  needsSuperAdmin: boolean;
  adminApprovedBy?: WireApprovedBy;
  adminApprovedAt?: string;
  superAdminApprovedBy?: WireApprovedBy;
  superAdminApprovedAt?: string;
  decidedAt?: string;
  decidedReason?: string;
  awaitingRole?: "admin" | "super_admin";
  cadreId?: number;
  /** Non-blocking -- a possible duplicate match, never prevents submission/approval. */
  duplicateWarning?: WireDuplicateWarning;
}

export interface ListCadreCreateRequestsParams {
  status?: WireCadreCreateRequest["status"];
  submittedBy?: string | number;
  awaitingMe?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listCadreCreateRequests(
  params: ListCadreCreateRequestsParams,
): Promise<PaginatedResponse<WireCadreCreateRequest>> {
  return apiFetch<PaginatedResponse<WireCadreCreateRequest>>("/cadre-create-requests", {
    query: {
      status: params.status,
      submittedBy: params.submittedBy !== undefined ? String(params.submittedBy) : undefined,
      awaitingMe: params.awaitingMe ? "true" : undefined,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
}

export async function approveCadreCreateRequest(id: number): Promise<WireCadreCreateRequest> {
  return apiFetch<WireCadreCreateRequest>(`/cadre-create-requests/${id}/approve`, { method: "POST" });
}

export async function rejectCadreCreateRequest(id: number, reason: string): Promise<WireCadreCreateRequest> {
  return apiFetch<WireCadreCreateRequest>(`/cadre-create-requests/${id}/reject`, {
    method: "POST",
    body: { reason },
  });
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
