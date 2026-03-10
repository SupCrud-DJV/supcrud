import { Auth } from '../utils/auth.js';
import { navigate } from '../router.js';
import { api } from '../utils/api.js';

function icon(name, size = 18) {
  const common = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"`;
  if (name === 'dashboard') return `<svg ${common}><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>`;
  if (name === 'building') return `<svg ${common}><rect x="4" y="2" width="16" height="20" rx="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h1"></path><path d="M15 6h1"></path><path d="M8 10h1"></path><path d="M15 10h1"></path><path d="M8 14h1"></path><path d="M15 14h1"></path></svg>`;
  if (name === 'plug') return `<svg ${common}><path d="M12 22v-5"></path><path d="M9 8V2"></path><path d="M15 8V2"></path><path d="M6 8h12v4a6 6 0 0 1-12 0V8z"></path></svg>`;
  if (name === 'logout') return `<svg ${common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`;
  if (name === 'check') return `<svg ${common}><path d="M20 6 9 17l-5-5"></path></svg>`;
  if (name === 'ticket') return `<svg ${common}><path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V7z"></path><path d="M9 7v12"></path></svg>`;
  return '';
}

export function renderOwnerDashboard(container) {
  const user = Auth.getUser();

  container.innerHTML = `
    <div class="dashboard-layout">
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">S</div>
          <span class="sidebar-brand-name">SupCrud</span>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-section-label">Owner Panel</div>
          ${[
            { iconName: 'dashboard', label: 'Overview', route: '#/owner' },
            { iconName: 'building', label: 'Workspaces', route: '#/owner/workspaces' },
            { iconName: 'plug', label: 'Add-ons', route: '#/owner/addons' },
          ].map(item => `
            <button class="nav-item ${window.location.hash === item.route ? 'active' : ''}" data-route="${item.route}">
              <span style="display:inline-flex;vertical-align:middle;margin-right:8px;">${icon(item.iconName, 16)}</span>${item.label}
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
          <button class="sidebar-logout" id="logoutBtn"><span style="display:inline-flex;vertical-align:middle;margin-right:8px;">${icon('logout', 14)}</span>Sign out</button>
        </div>
      </aside>
      <div class="main-content">
        <div class="mobile-topbar">
          <button id="hamburger" style="background:none;border:none;color:white;font-size:22px;cursor:pointer;">=</button>
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
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;">
            <div class="card" style="display:flex;align-items:center;gap:14px;">
              <div style="display:flex;align-items:center;justify-content:center;color:var(--primary);">${icon('building', 24)}</div>
              <div>
                <div id="metricTotalWorkspaces" style="font-size:22px;font-weight:700;">--</div>
                <div style="font-size:12px;color:var(--text-muted);">Total Workspaces</div>
              </div>
            </div>
            <div class="card" style="display:flex;align-items:center;gap:14px;">
              <div style="display:flex;align-items:center;justify-content:center;color:var(--success);">${icon('check', 24)}</div>
              <div>
                <div id="metricActiveWorkspaces" style="font-size:22px;font-weight:700;">--</div>
                <div style="font-size:12px;color:var(--text-muted);">Active Workspaces</div>
              </div>
            </div>
            <div class="card" style="display:flex;align-items:center;gap:14px;">
              <div style="display:flex;align-items:center;justify-content:center;color:var(--warning);">${icon('ticket', 24)}</div>
              <div>
                <div id="metricTotalTickets" style="font-size:22px;font-weight:700;">--</div>
                <div style="font-size:12px;color:var(--text-muted);">Total Tickets</div>
              </div>
            </div>
            <div class="card" style="display:flex;align-items:center;gap:14px;">
              <div style="display:flex;align-items:center;justify-content:center;color:var(--text-muted);">${icon('plug', 24)}</div>
              <div>
                <div id="metricCatalogAddons" style="font-size:22px;font-weight:700;">--</div>
                <div style="font-size:12px;color:var(--text-muted);">Catalog Add-ons</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  _attachSidebarEvents();
  loadOwnerMetrics().catch(() => {});

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    Auth.logout();
    navigate('#/login');
  });
  document.querySelectorAll('.nav-item[data-route]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.route));
  });
}

async function loadOwnerMetrics() {
  const workspacesRes = await api.get('/owner/workspaces');
  const addonsRes = await api.get('/owner/addons');
  const workspaces = Array.isArray(workspacesRes?.workspaces) ? workspacesRes.workspaces : [];
  const addons = Array.isArray(addonsRes?.addons) ? addonsRes.addons : [];

  const metricsResults = await Promise.all(
    workspaces.map(w => api.get(`/owner/workspaces/${w.id}/metrics`).catch(() => ({ metrics: { totalTickets: 0 } })))
  );

  const totalTickets = metricsResults.reduce((acc, item) => acc + Number(item?.metrics?.totalTickets ?? 0), 0);
  const activeWorkspaces = workspaces.filter(w => w.status === 'ACTIVE').length;

  document.getElementById('metricTotalWorkspaces').textContent = String(workspaces.length);
  document.getElementById('metricActiveWorkspaces').textContent = String(activeWorkspaces);
  document.getElementById('metricTotalTickets').textContent = String(totalTickets);
  document.getElementById('metricCatalogAddons').textContent = String(addons.length);
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
