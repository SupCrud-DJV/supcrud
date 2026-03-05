import { Auth }     from '../utils/auth.js';
import { navigate } from '../router.js';

export function renderWorkspaceDashboard(container) {
  const user      = Auth.getUser();
  const workspace = Auth.getWorkspace();

  container.innerHTML = `
    <div class="dashboard-layout">

      <div class="sidebar-overlay" id="sidebarOverlay"></div>

      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">S</div>
          <span class="sidebar-brand-name">${workspace?.name ?? 'Workspace'}</span>
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
          <div class="sidebar-user" id="profileBtn">
            <div class="sidebar-avatar">
              ${user?.avatar
                ? `<img src="${user.avatar}" alt="${user.name}"/>`
                : (user?.name?.[0] ?? 'U')}
            </div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">${user?.name ?? 'User'}</div>
              <div class="sidebar-user-role">${workspace?.role ?? 'Agent'}</div>
            </div>
          </div>
          <button class="sidebar-logout" id="switchWorkspaceBtn">🔄 Switch workspace</button>
          <button class="sidebar-logout" id="logoutBtn">🚪 Sign out</button>
        </div>
      </aside>

      <div class="main-content">
        <div class="mobile-topbar">
          <button id="hamburger" style="background:none;border:none;color:white;font-size:22px;cursor:pointer;">☰</button>
          <span style="color:white;font-weight:700;">${workspace?.name ?? 'SupCrud'}</span>
          <div style="width:32px;"></div>
        </div>

        <div class="topbar">
          <span class="topbar-title">Dashboard</span>
          <div class="topbar-right">
            <span class="badge badge-neutral">${workspace?.name ?? ''}</span>
            <span class="badge badge-primary">${workspace?.role ?? ''}</span>
          </div>
        </div>

        <div class="page-content">
          <h2 style="font-size:20px;font-weight:700;margin-bottom:4px;">Hi, ${user?.name ?? 'there'} 👋</h2>
          <p style="color:var(--text-muted);margin-bottom:28px;">Here's what's happening in <strong>${workspace?.name}</strong> today.</p>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;">
            ${[
              { label: 'Open Tickets',     value: '—', icon: '📬' },
              { label: 'In Progress',      value: '—', icon: '⚙️' },
              { label: 'Resolved Today',   value: '—', icon: '✅' },
              { label: 'Unassigned',       value: '—', icon: '❓' },
            ].map(m => `
              <div class="card" style="display:flex;align-items:center;gap:14px;">
                <div style="font-size:28px;">${m.icon}</div>
                <div>
                  <div style="font-size:22px;font-weight:700;">${m.value}</div>
                  <div style="font-size:12px;color:var(--text-muted);">${m.label}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>

    </div>`;

  _attachSidebarEvents();

  document.getElementById('logoutBtn').addEventListener('click', () => {
    Auth.logout();
    navigate('#/login');
  });

  document.getElementById('switchWorkspaceBtn').addEventListener('click', () => {
    Auth.setWorkspace(null);
    navigate('#/select-workspace');
  });

  document.querySelectorAll('.nav-item[data-route]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.route));
  });
}

function _attachSidebarEvents() {
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebarOverlay');
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