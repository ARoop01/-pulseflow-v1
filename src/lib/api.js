// PulseFlow API client — thin fetch wrapper with JWT auth

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

function getToken() {
  return localStorage.getItem('pf_token');
}

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status, data });
  return data;
}

export const api = {
  get: (path) =>
    fetch(`${BASE}${path}`, { headers: authHeaders() }).then(handleResponse),

  post: (path, body) =>
    fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  patch: (path, body) =>
    fetch(`${BASE}${path}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  postForm: (path, formData) =>
    fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
      body: formData,
    }).then(handleResponse),
};

// ── Auth helpers ──────────────────────────────────────────────────────────────

export function saveSession(token, user, profileId) {
  localStorage.setItem('pf_token', token);
  localStorage.setItem('pf_user', JSON.stringify(user));
  localStorage.setItem('pf_profile_id', profileId || '');
}

export function clearSession() {
  localStorage.removeItem('pf_token');
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
  return !!getToken();
}
