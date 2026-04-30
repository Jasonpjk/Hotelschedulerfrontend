const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

function getToken(): string | null {
  return localStorage.getItem("hotel_token");
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isForm = false
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isForm && body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isForm
      ? (body as BodyInit)
      : body != null
      ? JSON.stringify(body)
      : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem("hotel_token");
    localStorage.removeItem("hotel_user");
    window.location.href = "/";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string)                          => request<T>("GET",    path),
  post:   <T>(path: string, body?: unknown)          => request<T>("POST",   path, body),
  patch:  <T>(path: string, body?: unknown)          => request<T>("PATCH",  path, body),
  delete: <T>(path: string)                          => request<T>("DELETE", path),
  postForm: <T>(path: string, form: FormData | URLSearchParams) =>
    request<T>("POST", path, form, true),
};

/* ── 인증 ─────────────────────────────────────────── */
export interface LoginResponse {
  access_token: string;
  token_type: string;
}
export interface UserInfo {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "scheduler" | "employee";
  hotel_id: number | null;
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  return api.postForm<LoginResponse>("/auth/login", form);
}

export async function getMeApi(): Promise<UserInfo> {
  return api.get<UserInfo>("/auth/me");
}

/* ── 호텔 ─────────────────────────────────────────── */
export function getHotelsApi() {
  return api.get<any[]>("/hotels/");
}
export function getHotelApi(id: number) {
  return api.get<any>(`/hotels/${id}`);
}
export function updateHotelApi(id: number, data: unknown) {
  return api.patch<any>(`/hotels/${id}`, data);
}

/* ── 사용자 관리 (관리자) ──────────────────────────── */
export function getPendingUsersApi() {
  return api.get<any[]>("/auth/users/pending");
}
export function approveUserApi(userId: number) {
  return api.post<any>(`/auth/users/${userId}/approve`);
}
export function rejectUserApi(userId: number) {
  return api.post<any>(`/auth/users/${userId}/reject`);
}
export function getUsersApi(hotelId: number) {
  return api.get<any[]>(`/auth/users?hotel_id=${hotelId}`);
}
export function updateHotelPolicyApi(hotelId: number, data: unknown) {
  return api.patch<any>(`/hotels/${hotelId}`, data);
}

/* ── 직원 ─────────────────────────────────────────── */
export function getEmployeesApi(hotelId: number) {
  return api.get<any[]>(`/employees/?hotel_id=${hotelId}`);
}
export function createEmployeeApi(data: unknown) {
  return api.post<any>("/employees/", data);
}
export function updateEmployeeApi(id: number, data: unknown) {
  return api.patch<any>(`/employees/${id}`, data);
}
export function deleteEmployeeApi(id: number) {
  return api.delete<void>(`/employees/${id}`);
}

/* ── 스케줄 ───────────────────────────────────────── */
export function generateScheduleApi(data: unknown) {
  return api.post<any>("/schedules/generate", data);
}
export function getTaskApi(taskId: string) {
  return api.get<any>(`/schedules/task/${taskId}`);
}
export function getScheduleVersionsApi(hotelId: number, year: number, month: number) {
  return api.get<any[]>(`/schedules/versions?hotel_id=${hotelId}&year=${year}&month=${month}`);
}
export function getMonthlyScheduleApi(versionId: number) {
  return api.get<any>(`/schedules/${versionId}/monthly`);
}
export function editScheduleEntryApi(data: unknown) {
  return api.patch<any>("/schedules/entries/edit", data);
}
export function finalizeScheduleApi(versionId: number) {
  return api.post<any>(`/schedules/${versionId}/finalize`);
}
export function getFairnessApi(versionId: number) {
  return api.get<any>(`/schedules/${versionId}/fairness`);
}
export function nlAdjustApi(versionId: number, instruction: string) {
  return api.post<any>(`/schedules/${versionId}/nl-adjust`, { instruction });
}

/* ── 수요예측 ─────────────────────────────────────── */
export function getDemandForecastApi(hotelId: number, year: number, month: number) {
  return api.get<any>(`/demand/forecast/${hotelId}?year=${year}&month=${month}`);
}
export function generateDemandForecastApi(data: unknown) {
  return api.post<any>("/demand/forecast/generate", data);
}

/* ── 근태 ─────────────────────────────────────────── */
export function getLeavesApi(hotelId: number, year: number, month: number) {
  return api.get<any[]>(`/leaves/?hotel_id=${hotelId}&year=${year}&month=${month}`);
}
export function requestLeaveApi(data: unknown) {
  return api.post<any>("/leaves/", data);
}
export function approveLeaveApi(id: number) {
  return api.patch<any>(`/leaves/${id}/approve`);
}
export function rejectLeaveApi(id: number) {
  return api.patch<any>(`/leaves/${id}/reject`);
}
