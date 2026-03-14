const API_BASE = import.meta.env.VITE_API_BASE || "";

export interface ApiError extends Error {
  status: number;
  data?: unknown;
}

const defaultHeaders = {
  "Content-Type": "application/json",
};

const serialize = (params?: Record<string, unknown>): string => {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
};

export const buildUrl = (path: string, params?: Record<string, unknown>): string => {
  return `${path}${serialize(params)}`;
};

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(defaultHeaders);
  if (options.headers) {
    new Headers(options.headers).forEach((value, key) => headers.set(key, value));
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => undefined) : await response.text().catch(() => undefined);

  if (!response.ok) {
    const error: ApiError = Object.assign(new Error(payload?.detail || response.statusText || "Request failed"), {
      status: response.status,
      data: payload,
    });
    throw error;
  }

  return (isJson ? payload : (payload as unknown)) as T;
}
