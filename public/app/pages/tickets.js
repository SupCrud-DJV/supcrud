import { api }      from '../utils/api.js';
import { Auth }     from '../utils/auth.js';
import { navigate } from '../router.js';

const STATUS_COLORS = {
  OPEN:        'badge-primary',
  IN_PROGRESS: 'badge-warning',
  RESOLVED:    'badge-success',
  CLOSED:      'badge-neutral',
};

const TYPE_LABELS = { P: 'Petition', Q: 'Complaint', R: 'Claim', S: 'Suggestion' };
const PRIORITY_COLORS = { LOW: 'badge-neutral', MEDIUM: 'badge-warning', HIGH: 'badge-error' };

export async function renderTickets(container) {
  const workspace = Auth.getWorkspace();
  if (!workspace) return navigate('#/select-workspace');

  container.innerHTML = `
    <div class="dashboard-layout">
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      ${renderSidebar(workspace)}

      <div class="main-content">
        <div class="mobile-topbar">
          <button id="hamburger" style="background:none;border:none;color:white;font-size:22px;cursor:pointer;">☰</button>
          <span style="color:white;font-weight:700;">Tickets</span>
          <div style="width:32px;"></div>
        </div>

        <div class="topbar">
            <span class="topbar-title">Tickets</span>
            <div class="topbar-right">
                <span class="badge badge-neutral" id="totalCount"></span>
            </div>
        </div>

        <div class="page-content">

          <!-- Filters -->
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
            <select id="filterStatus" class="input-field" style="width:auto;">
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select id="filterType" class="input-field" style="width:auto;">
              <option value="">All Types</option>
              <option value="P">Petition</option>
              <option value="Q">Complaint</option>
              <option value="R">Claim</option>
              <option value="S">Suggestion</option>
            </select>
            <select id="filterPriority" class="input-field" style="width:auto;">
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <button class="btn btn-ghost btn-sm" id="applyFilters">Apply</button>
            <button class="btn btn-ghost btn-sm" id="clearFilters">Clear</button>
          </div>

          <!-- Ticket list -->
          <div id="ticketList">
            <div class="page-loader"><div class="spinner"></div></div>
          </div>

          <!-- Pagination -->
          <div id="pagination" style="display:flex;justify-content:center;gap:8px;margin-top:24px;flex-wrap:wrap;"></div>

        </div>
      </div>
    </div>`;

  attachSidebarEvents();
  await loadTickets();
  attachTicketEvents();
}

// ── Load tickets ──
let currentPage    = 1;
let currentFilters = {};

async function loadTickets(page = 1) {
  const listEl = document.getElementById('ticketList');
  listEl.innerHTML = `<div class="page-loader"><div class="spinner"></div></div>`;

  const params = new URLSearchParams({
    page,
    limit: 10,
    ...currentFilters
  });

  try {
    const { tickets, pagination } = await api.get(`/tickets?${params}`);
    currentPage = pagination.page;
    const totalCountEl = document.getElementById('totalCount');
    if (totalCountEl) totalCountEl.textContent = `Total: ${pagination.total}`;

    if (tickets.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:48px;color:var(--text-muted);background:var(--bg);border-radius:var(--radius-lg);border:1.5px dashed var(--border);">
          
          <p style="font-weight:600;">No tickets found</p>
          <p style="font-size:12px;margin-top:4px;">Try adjusting your filters or create a new ticket</p>
        </div>`;
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    listEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${tickets.map(t => `
          <div class="ticket-row" data-id="${t._id}" style="background:var(--bg-white);border:1px solid var(--border);border-radius:var(--radius-md);padding:16px 20px;cursor:pointer;transition:border-color 0.2s,box-shadow 0.2s;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">
              <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
                  <span style="font-family:monospace;font-size:11px;font-weight:700;color:var(--primary);">${t.reference_code}</span>
                  <span class="badge ${STATUS_COLORS[t.status]}">${t.status.replace('_',' ')}</span>
                  <span class="badge ${PRIORITY_COLORS[t.priority]}">${t.priority}</span>
                  <span class="badge badge-neutral">${TYPE_LABELS[t.type]}</span>
                </div>
                <div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.subject}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${t.email}</div>
              </div>
              <div style="text-align:right;flex-shrink:0;">
                <div style="font-size:11px;color:var(--text-muted);">${new Date(t.createdAt).toLocaleDateString('es-CO')}</div>
                ${t.assigned_to
                  ? `<div style="font-size:11px;color:var(--success);margin-top:2px;">Assigned</div>`
                  : `<div style="font-size:11px;color:var(--warning);margin-top:2px;">Unassigned</div>`}
              </div>
            </div>
          </div>`).join('')}
      </div>`;

    // Click ticket → detail
    listEl.querySelectorAll('.ticket-row').forEach(row => {
      row.addEventListener('mouseenter', () => {
        row.style.borderColor = 'var(--primary)';
        row.style.boxShadow   = 'var(--shadow-sm)';
      });
      row.addEventListener('mouseleave', () => {
        row.style.borderColor = 'var(--border)';
        row.style.boxShadow   = 'none';
      });
      row.addEventListener('click', () => {
        navigate(`#/tickets/${row.dataset.id}`);
      });
    });

    // Render pagination
    renderPagination(pagination);

  } catch (err) {
    listEl.innerHTML = `<div class="page-error"><p>${err.message}</p></div>`;
  }
}

function renderPagination({ page, totalPages }) {
  const el = document.getElementById('pagination');
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = '';

  // Prev button
  html += `<button class="btn btn-ghost btn-sm" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">← Prev</button>`;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="btn btn-sm ${i === page ? 'btn-primary' : 'btn-ghost'}" data-page="${i}">${i}</button>`;
  }

  // Next button
  html += `<button class="btn btn-ghost btn-sm" ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}">Next →</button>`;

  el.innerHTML = html;

  el.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => loadTickets(Number(btn.dataset.page)));
  });
}

function attachTicketEvents() {
  document.getElementById('applyFilters').addEventListener('click', () => {
    currentFilters = {};
    const status   = document.getElementById('filterStatus').value;
    const type     = document.getElementById('filterType').value;
    const priority = document.getElementById('filterPriority').value;
    if (status)   currentFilters.status   = status;
    if (type)     currentFilters.type     = type;
    if (priority) currentFilters.priority = priority;
    loadTickets(1);
  });

  document.getElementById('clearFilters').addEventListener('click', () => {
    currentFilters = {};
    document.getElementById('filterStatus').value   = '';
    document.getElementById('filterType').value     = '';
    document.getElementById('filterPriority').value = '';
    loadTickets(1);
  });
}


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
        <div class="nav-section-label" style="margin-top:12px;">Cuenta</div>
        <button class="nav-item" data-route="#/profile">👤 Mi Perfil</button>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar">
            ${user?.avatar ? `<img src="${user.avatar}" alt="${user.name}"/>` : user?.name?.[0]?.toUpperCase()}
          </div>
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
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebarOverlay');
  const hamburger = document.getElementById('hamburger');

  hamburger?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  });
  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    Auth.logout();
    navigate('#/login');
  });

  document.getElementById('switchWorkspaceBtn')?.addEventListener('click', () => {
    Auth.setWorkspace(null);
    navigate('#/select-workspace');
  });
  document.querySelectorAll('.nav-item[data-route]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.route));
  });
}
