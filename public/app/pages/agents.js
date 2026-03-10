import { api } from '../utils/api.js';
import { Auth } from '../utils/auth.js';
import { navigate } from '../router.js';

export async function renderAgents(container) {
  const user = Auth.getUser();
  const workspace = Auth.getWorkspace();
  if (!workspace) return navigate('#/select-workspace');

  container.innerHTML = `
    <div class="dashboard-layout">
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      ${renderSidebar(workspace)}

      <div class="main-content">
        <div class="mobile-topbar">
          <button id="hamburger" style="background:none;border:none;color:white;font-size:22px;cursor:pointer;">☰</button>
          <span style="color:white;font-weight:700;">${workspace?.name ?? 'Workspace'}</span>
          <div style="width:32px;"></div>
        </div>

        <div class="topbar">
          <span class="topbar-title">Agents</span>
        </div>

        <div class="page-content">
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px;">
            <input id="inviteEmail" class="input-field" placeholder="Agent email" style="flex:1;" />
            <button class="btn btn-primary btn-sm" id="inviteBtn">Invite</button>
          </div>
          <div id="agentsList">
            <div class="page-loader"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    </div>`;

  attachSidebarEvents();

  document.getElementById('logoutBtn').addEventListener('click', () => {
    Auth.logout();
    navigate('#/login');
  });

  document.querySelectorAll('.nav-item[data-route]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.route));
  });

  document.getElementById('inviteBtn').addEventListener('click', inviteAgent);

  await loadAgents();
}

async function loadAgents() {
  const container = document.getElementById('agentsList');
  container.innerHTML = `<div class="page-loader"><div class="spinner"></div></div>`;
  try {
    const workspace = Auth.getWorkspace();
    const { members } = await api.get(`/workspaces/${workspace.id}/members`);
    if (!members.length) {
      container.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:40px;">No agents yet.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display:grid;gap:12px;">
        ${members.map(m => `
          <div class="card" style="padding:16px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:700;">${m.name}</div>
              <div style="font-size:12px;color:var(--text-muted);">${m.email}</div>
            </div>
            <div style="font-size:12px;color:var(--text-muted);">${m.role}</div>
          </div>`).join('')}
      </div>`;

  } catch (err) {
    container.innerHTML = `<div style="color:red;">${err.message}</div>`;
  }
}

async function inviteAgent() {
  const email = document.getElementById('inviteEmail').value.trim();
  if (!email) return;

  try {
    await api.post('/agents/invite', { email });
    document.getElementById('inviteEmail').value = '';
    await loadAgents();
    alert('Invitation sent (check email)');
  } catch (err) {
    alert(err.message);
  }
}

function renderSidebar(workspace) {
  const user = Auth.getUser();
  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">S</div>
        <span class="sidebar-brand-name">${workspace?.name ?? 'SupCrud'}</span>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section-label">Workspace</div>
        ${[
          { icon: '📊', label: 'Dashboard', route: '#/dashboard' },
          { icon: '🎫', label: 'Tickets',   route: '#/dashboard/tickets' },
          { icon: '👥', label: 'Agents',    route: '#/dashboard/agents' },
          { icon: '🔌', label: 'Add-ons',   route: '#/dashboard/addons' },
          { icon: '⚙️',  label: 'Settings',  route: '#/dashboard/settings' },
        ].map(item => `
          <button class="nav-item ${window.location.hash === item.route ? 'active' : ''}" data-route="${item.route}">
            ${item.icon} ${item.label}
          </button>`).join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar">${user?.avatar ? `<img src="${user.avatar}" alt="${user.name}"/>` : user?.name?.[0]?.toUpperCase()}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${user?.name ?? 'Usuario'}</div>
            <div class="sidebar-user-role">${workspace?.role ?? 'Agent'}</div>
          </div>
        </div>
        <button class="sidebar-logout" id="logoutBtn">🚪 Cerrar sesión</button>
      </div>
    </aside>`;
}

function attachSidebarEvents() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const hamburger = document.getElementById('hamburger');
  if (!hamburger) return;
  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });
}
