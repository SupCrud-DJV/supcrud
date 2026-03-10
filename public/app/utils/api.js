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

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const api = {
  get: (path) => request('GET',    path),
  post: (path, body) => request('POST',   path, body),
  put: (path, body) => request('PUT',    path, body),
  delete: (path) => request('DELETE', path),
};
