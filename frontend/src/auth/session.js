const AUTH_KEY = "course_checkin_auth";

export function getAuth() {
  const cached = sessionStorage.getItem(AUTH_KEY);
  if (!cached) return null;

  try {
    const auth = JSON.parse(cached);
    if (auth.expires_at && Date.parse(auth.expires_at) <= Date.now()) {
      clearAuth();
      return null;
    }
    return auth;
  } catch {
    sessionStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export function setAuth(auth) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  if (auth?.token && auth?.expires_at) {
    const maxAge = Math.max(0, Math.floor((Date.parse(auth.expires_at) - Date.now()) / 1000));
    document.cookie = `course_checkin_token=${auth.token}; max-age=${maxAge}; path=/; SameSite=Lax`;
  }
}

export function clearAuth() {
  sessionStorage.removeItem(AUTH_KEY);
  document.cookie = "course_checkin_token=; max-age=0; path=/; SameSite=Lax";
}

export function getRoleHome(auth) {
  const role = auth?.role || auth?.user?.role;
  const name = auth?.user?.username || auth?.user?.name || "user";

  if (role === "teacher") return `/teacher/${encodeURIComponent(name)}`;
  if (role === "parent") return `/parent/${encodeURIComponent(name)}`;
  return "/admin/overview";
}
