import { clearAuth, getAuth } from "../auth/session";

export async function api(path, options = {}) {
  const auth = getAuth();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;

  const response = await fetch(path, {
    ...options,
    headers,
  });
  const payload = await response.json();
  if (!response.ok) {
    if (response.status === 401) clearAuth();
    throw new Error(payload.error || "操作失败");
  }
  return payload;
}
