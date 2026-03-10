import { api } from '../utils/api.js';
import { Auth } from '../utils/auth.js';
import { navigate } from '../router.js';

function icon(name, size = 18) {
  const common = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"`;
  if (name === 'dashboard') return `<svg ${common}><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>`;
  if (name === 'ticket'

  ) return `<svg ${common}><path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V7z"></path><path d="M9 7v12"></path></svg>`;
  if (name === 'users') return `<svg ${common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
  if (name === 'plug') return `<svg ${common}><path d="M12 22v-5"></path><path d="M9 8V2"></path><path d="M15 8V2"></path><path d="M6 8h12v4a6 6 0 0 1-12 0V8z"></path></svg>`;
  if (name === 'settings') return `<svg ${common}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.8a2 2 0 1 1 0-4H3a1.7 1.7 0 0 0 1.1-.4 1.7 1.7 0 0 0 .6-1A1.7 1.7 0 0 0 4.4 7l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.8a2 2 0 1 1 4 0V3a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.36.3.76.3 1.17v.06a1.7 1.7 0 0 0 1.1.37H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5.4z"></path></svg>`;
  if (name === 'refresh') return `<svg ${common}><path d="M3 12a9 9 0 0 1 15.54-6.36L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-15.54 6.36L3 16"></path><path d="M8 16H3v5"></path></svg>`;
  if (name === 'logout') return `<svg ${common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`;
  if (name === 'mail') return `<svg ${common}><path d="M4 4h16v16H4z"></path><path d="m4 8 8 5 8-5"></path></svg>`;
  if (name === 'loader') return `<svg ${common}><path d="M12 2v4"></path><path d="m16.24 7.76 2.83-2.83"></path><path d="M18 12h4"></path><path d="m16.24 16.24 2.83 2.83"></path><path d="M12 18v4"></path><path d="m4.93 19.07 2.83-2.83"></path><path d="M2 12h4"></path><path d="m4.93 4.93 2.83 2.83"></path></svg>`;
  if (name === 'check') return `<svg ${common}><path d="M20 6 9 17l-5-5"></path></svg>`;
  return '';
}

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
            { iconName: 'dashboard', label: 'Dashboard', route: '#/dashboard' },
            { iconName: 'ticket', label: 'Tickets', route: '#/dashboard/tickets' },
            { iconName: 'users', label: 'Agents', route: '#/dashboard/agents' },
            { iconName: 'plug', label: 'Add-ons', route: '#/dashboard/addons' },
            { iconName: 'settings', label: 'Settings', route: '#/dashboard/settings' },
          ].map(item => `
            <button class="nav-item ${window.location.hash === item.route ? 'active' : ''}" data-route="${item.route}">
              <span style="display:inline-flex;vertical-align:middle;margin-right:8px;">${icon(item.iconName, 16)}</span>${item.label}
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
        <button class="sidebar-logout" id="switchWorkspaceBtn"><span style="display:inline-flex;vertical-align:middle;margin-right:8px;">${icon('refresh', 14)}</span>Switch workspace</button>
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
