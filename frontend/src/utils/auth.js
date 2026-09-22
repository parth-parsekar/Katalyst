const TOKEN_KEY = "katalyst_token";
const USER_KEY  = "katalyst_user";

/** Store the Google ID token and decoded user profile after login. */
export function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Retrieve the stored Google ID token (or null). */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** Retrieve the stored user object (or null). */
export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

/** Return the Authorization header object for axios/fetch calls. */
export function getAuthHeaders() {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/** Remove all auth data (used on sign-out). */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** True if there is a stored token. */
export function isAuthenticated() {
  return Boolean(getToken());
}
