import { api } from '../utils/api.js';
import { Auth } from '../utils/auth.js';
import { navigate } from '../router.js';

export async function renderOwnerAddons(container) {
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
          <span class="topbar-title">Owner - Add-ons</span>
        </div>

        <div class="page-content" id="pageContent">
          <h2 style="font-size:20px;font-weight:700;margin-bottom:4px;">Add-ons</h2>
          <p style="color:var(--text-muted);margin-bottom:24px;">Manage global add-ons for all workspaces.</p>

          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px;">
            <input id="addonCode" class="input-field" placeholder="Code" style="width:160px;" />
            <input id="addonName" class="input-field" placeholder="Name" style="width:200px;" />
            <input id="addonDescription" class="input-field" placeholder="Description" style="flex:1;" />
            <button class="btn btn-primary btn-sm" id="createAddonBtn">Create add-on</button>
          </div>

          <div id="ownerAddonsList">
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

  document.getElementById('createAddonBtn').addEventListener('click', async () => {
    const code = document.getElementById('addonCode').value.trim();
    const name = document.getElementById('addonName').value.trim();
    const description = document.getElementById('addonDescription').value.trim();

    if (!code || !name) return;
    try {
      await api.post('/owner/addons', { code, name, description });
      document.getElementById('addonCode').value = '';
      document.getElementById('addonName').value = '';
      document.getElementById('addonDescription').value = '';
      await loadAddons();
    } catch (err) {
      alert(err.message);
    }
  });

  await loadAddons();
}

async function loadAddons() {
  const container = document.getElementById('ownerAddonsList');
  container.innerHTML = `<div class="page-loader"><div class="spinner"></div></div>`;
  try {
    const { addons } = await api.get('/owner/addons');
    if (!addons.length) {
      container.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:40px;">No add-ons found.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display:grid;gap:12px;">
        ${addons.map(a => `
          <div class="card" style="padding:16px;display:flex;justify-content:space-between;align-items:center;gap:12px;">
            <div>
              <div style="font-weight:700;">${a.name}</div>
              <div style="font-size:12px;color:var(--text-muted);">${a.code}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">${a.description || ''}</div>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-sm" data-action="edit" data-id="${a.id}">Edit</button>
              <button class="btn btn-ghost btn-sm" data-action="delete" data-id="${a.id}">Delete</button>
            </div>
          </div>`).join('')}
      </div>
    `;

    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete add-on?')) return;
        await api.delete(`/owner/addons/${btn.dataset.id}`);
        await loadAddons();
      });
    });

    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const addon = addons.find(a => a.id === btn.dataset.id);
        if (!addon) return;
        const newName = prompt('Name', addon.name);
        const newCode = prompt('Code', addon.code);
        const newDesc = prompt('Description', addon.description || '');
        if (!newName || !newCode) return;
        await api.put(`/owner/addons/${addon.id}`, { code: newCode, name: newName, description: newDesc });
        await loadAddons();
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
