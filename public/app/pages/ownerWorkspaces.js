import { api } from '../utils/api.js';
import { Auth } from '../utils/auth.js';
import { navigate } from '../router.js';

export async function renderOwnerWorkspaces(container) {
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

      <div class="main-content">
        <div class="mobile-topbar">
          <button id="hamburger" style="background:none;border:none;color:white;font-size:22px;cursor:pointer;">☰</button>
          <span style="color:white;font-weight:700;">SupCrud</span>
          <div style="width:32px;"></div>
        </div>

        <div class="topbar">
          <span class="topbar-title">Owner - Workspaces</span>
        </div>

        <div class="page-content" id="pageContent">
          <h2 style="font-size:20px;font-weight:700;margin-bottom:4px;">Workspaces</h2>
          <p style="color:var(--text-muted);margin-bottom:24px;">View and manage all workspaces.</p>
          <div id="ownerWorkspacesList">
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

  await loadWorkspaces();
}

async function loadWorkspaces() {
  const container = document.getElementById('ownerWorkspacesList');
  container.innerHTML = `<div class="page-loader"><div class="spinner"></div></div>`;
  try {
    const { workspaces } = await api.get('/owner/workspaces');

    if (!workspaces.length) {
      container.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:40px;">No workspaces found.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display:grid;gap:14px;">
        ${workspaces.map(w => `
          <div class="card" style="padding:16px;display:flex;justify-content:space-between;align-items:center;gap:16px;">
            <div>
              <div style="font-weight:700;">${w.name}</div>
              <div style="font-size:12px;color:var(--text-muted);">Status: ${w.status}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <button class="btn btn-sm" data-action="toggle" data-id="${w.id}" data-status="${w.status}">
                ${w.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
              </button>
              <button class="btn btn-ghost btn-sm" data-action="metrics" data-id="${w.id}">Metrics</button>
            </div>
          </div>`).join('')}
      </div>
      <div id="workspaceMetrics" style="margin-top:20px;" />
    `;

    document.querySelectorAll('[data-action="toggle"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const status = btn.dataset.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        await api.put(`/owner/workspaces/${id}/status`, { status });
        await loadWorkspaces();
      });
    });

    document.querySelectorAll('[data-action="metrics"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const container = document.getElementById('workspaceMetrics');
        container.innerHTML = `<div class="page-loader"><div class="spinner"></div></div>`;
        try {
          const { metrics } = await api.get(`/owner/workspaces/${id}/metrics`);
          container.innerHTML = `
            <div class="card" style="padding:16px;">
              <div style="font-weight:700;margin-bottom:8px;">Workspace metrics</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;">
                <div style="border:1px solid var(--border);padding:12px;border-radius:12px;">
                  <div style="font-size:12px;color:var(--text-muted);">Total tickets</div>
                  <div style="font-weight:700;font-size:18px;">${metrics.totalTickets}</div>
                </div>
                ${Object.entries(metrics.tickets || {}).map(([k,v]) => `
                  <div style="border:1px solid var(--border);padding:12px;border-radius:12px;">
                    <div style="font-size:12px;color:var(--text-muted);">${k}</div>
                    <div style="font-weight:700;font-size:18px;">${v}</div>
                  </div>
                `).join('')}
              </div>
            </div>`;
        } catch (err) {
          container.innerHTML = `<div style="color:red;">${err.message}</div>`;
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div style="color:red;">${err.message}</div>`;
  }
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
