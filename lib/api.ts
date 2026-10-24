export interface User {
  id: string;
  username: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Guest {
  id: string;
  full_name: string;
  phone: string;
  room_number: string;
  check_in_date: string;
  check_out_date: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface GuestInput {
  full_name: string;
  phone: string;
  room_number: string;
  check_in_date: string;
  check_out_date: string;
  note?: string;
}

export interface GuestListResponse {
  data: Guest[];
  total: number;
  limit: number;
  offset: number;
}

export interface GuestFilters {
  limit?: number;
  offset?: number;
  room_number?: string;
  phone?: string;
}

const STORAGE_KEY_TOKEN = "hotel_auth_token";
const STORAGE_KEY_USER = "hotel_auth_user";
const STORAGE_KEY_API_URL = "hotel_api_base_url";

export const DEFAULT_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return DEFAULT_API_URL;
  }
  return localStorage.getItem(STORAGE_KEY_API_URL) || DEFAULT_API_URL;
}

export function setApiBaseUrl(url: string): void {
  if (typeof window === "undefined") return;
  if (!url) {
    localStorage.removeItem(STORAGE_KEY_API_URL);
  } else {
    localStorage.setItem(STORAGE_KEY_API_URL, url.replace(/\/+$/, ""));
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_USER);
}

export class ApiError extends Error {
  status: number;
  details?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    details?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  customToken?: string | null,
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (
    options.body &&
    typeof options.body === "string" &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  const token = customToken !== undefined ? customToken : getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Не удалось подключиться к серверу";
    throw new ApiError(`Ошибка сети: ${errorMsg}`, 0);
  }

  if (res.status === 204) {
    return {} as T;
  }

  let data: {
    error?: string;
    message?: string;
    details?: Record<string, string>;
  } | null = null;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) ||
      `Запрос завершился с ошибкой: ${res.status} ${res.statusText}`;
    throw new ApiError(message, res.status, data?.details);
  }

  return data as T;
}

export const api = {
  async checkHealth(): Promise<{ status: string }> {
    return request<{ status: string }>("/health");
  },

  async register(username: string, password: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (data.token && data.user) {
      setAuthSession(data.token, data.user);
    }
    return data;
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (data.token && data.user) {
      setAuthSession(data.token, data.user);
    }
    return data;
  },

  async getGuests(filters: GuestFilters = {}): Promise<GuestListResponse> {
    const params = new URLSearchParams();
    if (filters.limit !== undefined)
      params.append("limit", filters.limit.toString());
    if (filters.offset !== undefined)
      params.append("offset", filters.offset.toString());
    if (filters.room_number)
      params.append("room_number", filters.room_number.trim());
    if (filters.phone) params.append("phone", filters.phone.trim());

    const qs = params.toString();
    const endpoint = `/api/v1/guests${qs ? `?${qs}` : ""}`;
    return request<GuestListResponse>(endpoint);
  },

  async getGuest(id: string): Promise<Guest> {
    return request<Guest>(`/api/v1/guests/${id}`);
  },

  async createGuest(input: GuestInput): Promise<Guest> {
    return request<Guest>("/api/v1/guests", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateGuest(id: string, input: GuestInput): Promise<Guest> {
    return request<Guest>(`/api/v1/guests/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  async deleteGuest(id: string): Promise<void> {
    await request<void>(`/api/v1/guests/${id}`, {
      method: "DELETE",
    });
  },
};
