import { Auth }     from '../utils/auth.js';
import { navigate } from '../router.js';
import { api }      from '../utils/api.js';

export async function renderAuthCallback(container) {
  container.innerHTML = `
    <div class="page-loader">
      <div class="spinner"></div>
      <span>Signing you in...</span>
    </div>`;

  try {
    // Fetch auth result from session
    const data = await api.get('/auth/google/result');

    Auth.setToken(data.token);
    Auth.setUser(data.user);

    if (data.workspaces?.length === 1) {
      Auth.setWorkspace(data.workspaces[0]);
      navigate(data.user.role === 'OWNER' ? '#/owner' : '#/dashboard');
    } else {
      navigate('#/select-workspace');
    }

  } catch (err) {
    console.error(err);
    navigate('#/login?error=google_failed');
  }
}