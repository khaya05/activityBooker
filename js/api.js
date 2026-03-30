// ─── api.js — centralised API client ─────────────────────

const API_BASE = 'http://localhost:5100/api/v1';

const TokenStore = {
  get() { return localStorage.getItem('ab_token'); },
  set(token) { localStorage.setItem('ab_token', token); },
  clear() { localStorage.removeItem('ab_token'); },
};

// ─── Core fetch wrapper ───────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = TokenStore.get();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',   // still send cookie when same-origin (prod)
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = Array.isArray(data.msg)
      ? data.msg.join(' · ')
      : (data.msg || data.message || 'Something went wrong');
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ─── Auth ─────────────────────────────────────────────────
const Auth = {
  register: (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: async (body) => {
    const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) });
    // Store token so every subsequent request sends it as Bearer
    if (data.token) TokenStore.set(data.token);
    return data;
  },

  logout: async () => {
    const data = await apiFetch('/auth/logout');
    TokenStore.clear();
    return data;
  },

  verifyEmail: (body) => apiFetch('/auth/verify-email', { method: 'POST', body: JSON.stringify(body) }),
  resendVerification: (body) => apiFetch('/auth/resend-verification', { method: 'POST', body: JSON.stringify(body) }),

  google: async (body) => {
    const data = await apiFetch('/auth/google', { method: 'POST', body: JSON.stringify(body) });
    if (data.token) TokenStore.set(data.token);
    return data;
  },
};

// Also store the token after register (for the verify-email step)
const _originalRegister = Auth.register;
Auth.register = async (body) => {
  const data = await _originalRegister(body);
  if (data.token) TokenStore.set(data.token);
  return data;
};

// ─── Users ────────────────────────────────────────────────
const Users = {
  getCurrentUser: () => apiFetch('/users/current-user'),
};

// ─── Children ─────────────────────────────────────────────
const Children = {
  getAll: () => apiFetch('/children'),
  create: (body) => apiFetch('/children', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => apiFetch(`/children/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => apiFetch(`/children/${id}`, { method: 'DELETE' }),
};

// ─── Classes ──────────────────────────────────────────────
const Classes = {
  getAll: () => apiFetch('/classes'),
};

// ─── Bookings ─────────────────────────────────────────────
const Bookings = {
  getAll: (params = {}) => apiFetch('/bookings?' + new URLSearchParams(params)),
  create: (body) => apiFetch('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  cancel: (id) => apiFetch(`/bookings/${id}/cancel`, { method: 'PATCH' }),
  getAvailability: (classId, weekStart) =>
    apiFetch('/bookings/availability?' + new URLSearchParams({ classId, ...(weekStart ? { weekStart } : {}) })),
};

// ─── Purchases ────────────────────────────────────────────
const Purchases = {
  getPacks: () => apiFetch('/packs'),
  getAll: () => apiFetch('/purchases'),
  create: (body) => apiFetch('/purchases', { method: 'POST', body: JSON.stringify(body) }),
};