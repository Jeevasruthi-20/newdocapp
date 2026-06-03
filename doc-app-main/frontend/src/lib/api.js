/**
 * In development, use same-origin requests (CRA proxies to backend).
 * In production, set REACT_APP_API_URL (e.g. https://api.yourdomain.com).
 */
export const API_BASE =
  process.env.REACT_APP_API_URL !== undefined
    ? process.env.REACT_APP_API_URL
    : process.env.NODE_ENV === 'production'
      ? 'http://localhost:5000'
      : '';

const TOKEN_KEY = 'medconnect_access_token';
const REFRESH_KEY = 'medconnect_refresh_token';

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

let refreshPromise = null;

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Refresh failed');
        const data = await res.json();
        setTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

export const apiFetch = async (path, options = {}) => {
  const { skipAuth = false, ...fetchOptions } = options;
  const headers = { ...fetchOptions.headers };

  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE}${path}`;

  let res;
  try {
    res = await fetch(url, { ...fetchOptions, headers });
  } catch (err) {
    const hint = API_BASE
      ? API_BASE
      : 'the backend (http://127.0.0.1:5000 via dev proxy)';
    throw new Error(
      `Cannot reach the server at ${hint}. Start the backend: cd doc-app-main/backend && npm start`
    );
  }

  if (res.status === 401 && !skipAuth && getRefreshToken()) {
    try {
      await refreshAccessToken();
      headers.Authorization = `Bearer ${getAccessToken()}`;
      res = await fetch(url, { ...fetchOptions, headers });
    } catch {
      clearTokens();
      window.dispatchEvent(new Event('auth:logout'));
    }
  }

  return res;
};

export const apiJson = async (path, options = {}) => {
  const res = await apiFetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

/** Login / signup — no auth header */
export const apiAuthPost = (path, body) =>
  apiJson(path, {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  });

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
};
