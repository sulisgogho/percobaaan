const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'sigap_ti_auth_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    const error = new Error(
      'Tidak dapat terhubung ke server backend. Pastikan layanan backend sedang berjalan.'
    );
    error.isNetworkError = true;
    throw error;
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const error = new Error(
      payload.message || `Permintaan gagal dengan kode status ${response.status}.`
    );
    error.status = response.status;
    error.errors = payload.errors || {};
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const authApi = {
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  me: () => request('/auth/me'),
};

export const incidentApi = {
  getMeta: () => request('/incidents/meta'),
  list: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.set(key, String(val));
      }
    });
    const qs = searchParams.toString();
    return request(`/incidents${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => request(`/incidents/${id}`),
  create: (data) =>
    request('/incidents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  remove: (id) =>
    request(`/incidents/${id}`, {
      method: 'DELETE',
    }),
  reseedSample: () =>
    request('/incidents/seed', {
      method: 'POST',
    }),
};

