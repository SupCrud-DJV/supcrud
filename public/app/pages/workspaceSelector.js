import { api }      from '../utils/api.js';
import { Auth }     from '../utils/auth.js';
import { navigate } from '../router.js';
import { renderError } from '../components/errorMessage.js';

export async function renderWorkspaceSelector(container) {
  const user = Auth.getUser();

  container.innerHTML = `
    <div class="workspace-selector">
      <div style="width:100%;max-width:600px;">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="font-size:32px;margin-bottom:12px;">🏢</div>
          <h1 style="font-size:22px;font-weight:700;margin-bottom:6px;">Select a Workspace</h1>
          <p style="color:var(--text-muted);font-size:14px;">Hi ${user?.name ?? 'there'}, choose a workspace to continue.</p>
        </div>
        <div id="workspaceList">
          <div class="page-loader"><div class="spinner"></div></div>
        </div>
        <div style="text-align:center;margin-top:24px;">
          <button class="btn btn-ghost btn-sm" id="logoutBtn">Sign out</button>
        </div>
      </div>
    </div>`;

  document.getElementById('logoutBtn').addEventListener('click', () => {
    Auth.logout();
    navigate('#/login');
  });

  try {
    const data = await api.get('/workspaces/mine');
    const workspaces = data.workspaces || [];
    const listEl = document.getElementById('workspaceList');

    if (workspaces.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text-muted);">
          <div style="font-size:32px;margin-bottom:12px;">😔</div>
          <p>You don't belong to any workspace yet.</p>
        </div>`;
      return;
    }

    listEl.innerHTML = `
      <div class="workspace-grid">
        ${workspaces.map(ws => `
          <div class="workspace-card" data-id="${ws.id}" data-key="${ws.workspaceKey}">
            <div class="workspace-card-icon">🏢</div>
            <div class="workspace-card-name">${ws.name}</div>
            <div class="workspace-card-role">
              <span class="badge badge-primary">${ws.role}</span>
            </div>
          </div>`).join('')}
      </div>`;

    listEl.querySelectorAll('.workspace-card').forEach(card => {
      card.addEventListener('click', () => {
        const ws = workspaces.find(w => w.id == card.dataset.id);
        Auth.setWorkspace(ws);
        navigate('#/dashboard');
      });
    });

  } catch (err) {
    renderError(document.getElementById('workspaceList'), err.message);
  }
}