import { Auth }     from '../utils/auth.js';
import { navigate } from '../router.js';

export function renderOwnerDashboard(container) {
  const user = Auth.getUser();

  container.innerHTML = `
    <div class="dashboard-layout">

      <!-- Sidebar overlay (mobile) -->
      <div class="sidebar-overlay" id="sidebarOverlay"></div>

      <!-- Sidebar -->
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">S</div>
          <span class="sidebar-brand-name">SupCrud</span>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-label">Owner Panel</div>
          ${[
            { icon: '📊', label: 'Overview',   route: '#/owner' },
            { icon: '🏢', label: 'Workspaces', route: '#/owner/workspaces' },
            { icon: '🔌', label: 'Add-ons',    route: '#/owner/addons' },
          ].map(item => `
            <button class="nav-item ${window.location.hash === item.route ? 'active' : ''}" data-route="${item.route}">
              ${item.icon} ${item.label}
            </button>`).join('')}
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-user" id="profileBtn">
            <div class="sidebar-avatar">${user?.name?.[0] ?? 'O'}</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">${user?.name ?? 'Owner'}</div>
              <div class="sidebar-user-role">Global Owner</div>
            </div>
          </div>
          <button class="sidebar-logout" id="logoutBtn">🚪 Sign out</button>
        </div>
      </aside>

      <!-- Main -->
      <div class="main-content">
        <div class="mobile-topbar">
          <button id="hamburger" style="background:none;border:none;color:white;font-size:22px;cursor:pointer;">☰</button>
          <span style="color:white;font-weight:700;">SupCrud</span>
          <div style="width:32px;"></div>
        </div>

        <div class="topbar">
          <span class="topbar-title">Owner Dashboard</span>
          <div class="topbar-right">
            <span class="badge badge-primary">Global Owner</span>
          </div>
        </div>

        <div class="page-content" id="pageContent">
          <h2 style="font-size:20px;font-weight:700;margin-bottom:4px;">Welcome, ${user?.name ?? 'Owner'}</h2>
          <p style="color:var(--text-muted);margin-bottom:28px;">Manage all workspaces from here.</p>

          <!-- Metrics -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;">
            ${[
              { label: 'Total Workspaces', value: '—', icon: '🏢' },
              { label: 'Active Workspaces', value: '—', icon: '✅' },
              { label: 'Total Tickets', value: '—', icon: '🎫' },
              { label: 'Active Add-ons', value: '—', icon: '🔌' },
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

  document.querySelectorAll('.nav-item[data-route]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.route));
  });
}

function _attachSidebarEvents() {
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