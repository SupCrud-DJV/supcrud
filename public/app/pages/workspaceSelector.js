import { api }         from '../utils/api.js';
import { Auth }        from '../utils/auth.js';
import { navigate }    from '../router.js';
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

        <!-- Workspace list -->
        <div id="workspaceList">
          <div class="page-loader"><div class="spinner"></div></div>
        </div>

        <!-- Create workspace form -->
        <div class="card" style="margin-top:24px;">
          <div class="card-title" style="margin-bottom:4px;">➕ Create a new workspace</div>
          <div class="card-subtitle" style="margin-bottom:16px;">Set up a workspace for your business</div>

          <div class="alert alert-error" id="createError" style="display:none;"></div>
          <div class="alert alert-success" id="createSuccess" style="display:none;"></div>

          <div style="display:flex;gap:10px;">
            <input
              type="text"
              id="workspaceName"
              class="input-field"
              placeholder="e.g. My Company Support"
              style="flex:1;"
            />
            <button class="btn btn-primary" id="createBtn">Create</button>
          </div>
        </div>

        <div style="text-align:center;margin-top:20px;">
          <button class="btn btn-ghost btn-sm" id="logoutBtn">Sign out</button>
        </div>

      </div>
    </div>`;

  // ── Logout ──
  document.getElementById('logoutBtn').addEventListener('click', () => {
    Auth.logout();
    navigate('#/login');
  });

  // ── Load workspaces ──
  await loadWorkspaces();

  // ── Create workspace ──
  document.getElementById('createBtn').addEventListener('click', async () => {
    const name      = document.getElementById('workspaceName').value.trim();
    const errorEl   = document.getElementById('createError');
    const successEl = document.getElementById('createSuccess');
    const btn       = document.getElementById('createBtn');

    errorEl.style.display   = 'none';
    successEl.style.display = 'none';

    if (!name) {
      errorEl.textContent   = 'Please enter a workspace name.';
      errorEl.style.display = 'block';
      return;
    }

    btn.disabled  = true;
    btn.innerHTML = '<div class="spinner spinner-white"></div>';

    try {
      await api.post('/workspaces', { name });

      successEl.textContent   = `Workspace "${name}" created successfully!`;
      successEl.style.display = 'block';
      document.getElementById('workspaceName').value = '';

      // Reload the workspace list
      await loadWorkspaces();

    } catch (err) {
      errorEl.textContent   = err.message || 'Failed to create workspace.';
      errorEl.style.display = 'block';
    } finally {
      btn.disabled  = false;
      btn.innerHTML = 'Create';
    }
  });

  // ── Enter key on input ──
  document.getElementById('workspaceName').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('createBtn').click();
  });
}

// ── Helper: load and render workspace list ──
async function loadWorkspaces() {
  const listEl = document.getElementById('workspaceList');
  const user   = Auth.getUser();

  try {
    const data       = await api.get('/workspaces/mine');
    const workspaces = data.workspaces || [];

    if (workspaces.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:28px;color:var(--text-muted);background:var(--bg);border-radius:var(--radius-lg);border:1.5px dashed var(--border);">
          <div style="font-size:28px;margin-bottom:8px;">🏗️</div>
          <p style="font-weight:600;margin-bottom:4px;">No workspaces yet</p>
          <p style="font-size:12px;">Create your first workspace below</p>
        </div>`;
      return;
    }

    listEl.innerHTML = `
      <div class="workspace-grid">
        ${workspaces.map(ws => `
          <div class="workspace-card" data-id="${ws.id}">
            <div class="workspace-card-icon">🏢</div>
            <div class="workspace-card-name">${ws.name}</div>
            <div class="workspace-card-role" style="margin-top:6px;">
              <span class="badge badge-primary">${ws.role}</span>
            </div>
          </div>`).join('')}
      </div>`;

    listEl.querySelectorAll('.workspace-card').forEach(card => {
      card.addEventListener('click', () => {
        const ws = workspaces.find(w => w.id == card.dataset.id);
        Auth.setWorkspace(ws);
        navigate(user?.role === 'OWNER' ? '#/owner' : '#/dashboard');
      });
    });

  } catch (err) {
    renderError(listEl, err.message);
  }
}