// PulseFlow API client — uses HttpOnly cookies for auth (no token in JS)

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status, data });
  return data;
}

const FETCH_OPTS = { credentials: 'include' };

export const api = {
  get: (path) =>
    fetch(`${BASE}${path}`, {
      ...FETCH_OPTS,
      headers: { 'Content-Type': 'application/json' },
    }).then(handleResponse),

  post: (path, body) =>
    fetch(`${BASE}${path}`, {
      ...FETCH_OPTS,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(handleResponse),

  patch: (path, body) =>
    fetch(`${BASE}${path}`, {
      ...FETCH_OPTS,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(handleResponse),

  postForm: (path, formData) =>
    fetch(`${BASE}${path}`, {
      ...FETCH_OPTS,
      method: 'POST',
      body: formData,
    }).then(handleResponse),
};

// ── Session helpers (user info only — no token stored in JS) ─────────────────

export function saveSession(user, profileId) {
  localStorage.setItem('pf_user', JSON.stringify(user));
  localStorage.setItem('pf_profile_id', profileId || '');
}

export function clearSession() {
  localStorage.removeItem('pf_user');
  localStorage.removeItem('pf_profile_id');
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('pf_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getStoredUser();
}
