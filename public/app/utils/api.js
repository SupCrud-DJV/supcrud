import { Auth } from './auth.js';

const BASE_URL = `${window.location.origin}/api`;

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };

  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // ✅ Always send workspace id so backend knows which workspace
  const workspace = Auth.getWorkspace();
  if (workspace) headers['x-workspace-id'] = workspace.id;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);

  if (res.status === 401) {
    Auth.logout();
    window.location.hash = '#/login';
    return;
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = isJson
      ? (payload?.message || 'Request failed')
      : `Request failed (${res.status}). Backend returned non-JSON response.`;
    throw new Error(message);
  }

  return payload;
}

export const api = {
  get: (path) => request('GET',    path),
  post: (path, body) => request('POST',   path, body),
  put: (path, body) => request('PUT',    path, body),
  delete: (path) => request('DELETE', path),
};
