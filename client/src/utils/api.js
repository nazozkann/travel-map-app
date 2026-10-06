import { getToken, clearSession } from "./auth";

export const API_URL = import.meta.env.VITE_API_URL || "";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// fetch wrapper: prefixes the API url, sends JSON + auth token, throws ApiError on non-2xx.
export async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (!token) throw new ApiError("You need to be logged in", 401);
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(API_URL + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // empty or non-JSON body
  }

  if (!res.ok) {
    if (res.status === 401 && auth) clearSession();
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status);
  }
  return data;
}
