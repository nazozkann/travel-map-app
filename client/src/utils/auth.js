// Session lives in localStorage; components listen for AUTH_EVENT to react to login/logout.
export const AUTH_EVENT = "auth-change";

function decodeTokenExp(token) {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function getToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const exp = decodeTokenExp(token);
  if (exp && exp < Date.now()) {
    clearSession();
    return null;
  }
  return token;
}

export function getUsername() {
  return getToken() ? localStorage.getItem("username") : null;
}

export function setSession(token, username) {
  localStorage.setItem("token", token);
  localStorage.setItem("username", username);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearSession() {
  const hadSession = localStorage.getItem("token") !== null;
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  if (hadSession) window.dispatchEvent(new Event(AUTH_EVENT));
}
