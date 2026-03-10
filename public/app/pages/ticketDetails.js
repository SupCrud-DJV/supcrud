import { api }      from '../utils/api.js';
import { Auth }     from '../utils/auth.js';
import { navigate } from '../router.js';

const STATUS_COLORS = {
  OPEN:        'badge-primary',
  IN_PROGRESS: 'badge-warning',
  RESOLVED:    'badge-success',
  CLOSED:      'badge-neutral',
};

const TYPE_LABELS     = { P: 'Petition', Q: 'Complaint', R: 'Claim', S: 'Suggestion' };
const PRIORITY_COLORS = { LOW: 'badge-neutral', MEDIUM: 'badge-warning', HIGH: 'badge-error' };

export async function renderTicketDetail(container) {
  const workspace = Auth.getWorkspace();
  if (!workspace) return navigate('#/select-workspace');

  // Get ticket id from URL hash e.g. #/tickets/abc123
  const ticketId = window.location.hash.split('/')[2];
  if (!ticketId) return navigate('#/dashboard/tickets');

  container.innerHTML = `
    <div class="dashboard-layout">
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      ${renderSidebar(workspace)}

      <div class="main-content">
        <div class="mobile-topbar">
          <button id="hamburger" style="background:none;border:none;color:white;font-size:22px;cursor:pointer;">☰</button>
          <span style="color:white;font-weight:700;">Ticket Detail</span>
          <div style="width:32px;"></div>
        </div>

        <div class="topbar">
          <div style="display:flex;align-items:center;gap:12px;">
            <button class="btn btn-ghost btn-sm" onclick="navigate('#/dashboard/tickets')">← Back</button>
            <span class="topbar-title">Ticket Detail</span>
          </div>
        </div>

        <div class="page-content" id="pageContent">
          <div class="page-loader"><div class="spinner"></div></div>
        </div>
      </div>
    </div>`;

  attachSidebarEvents();
  await loadTicket(ticketId, workspace);
}

async function loadTicket(ticketId, workspace) {
  const pageContent = document.getElementById('pageContent');

  try {
    const [{ ticket }, { members }] = await Promise.all([
      api.get(`/tickets/${ticketId}`),
      api.get(`/workspaces/${workspace.id}/members`),
    ]);

    const assignedAgent = members.find(m => String(m.id) === String(ticket.assigned_to));

    pageContent.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 320px;gap:20px;align-items:start;">

        <!-- LEFT: main content -->
        <div style="display:flex;flex-direction:column;gap:16px;">

          <!-- Ticket info -->
          <div class="card">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
              <div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">
                  <span style="font-family:monospace;font-size:12px;font-weight:700;color:var(--primary);">${ticket.reference_code}</span>
                  <span class="badge ${STATUS_COLORS[ticket.status]}">${ticket.status.replace('_',' ')}</span>
                  <span class="badge ${PRIORITY_COLORS[ticket.priority]}">${ticket.priority}</span>
                  <span class="badge badge-neutral">${TYPE_LABELS[ticket.type]}</span>
                </div>
                <h2 style="font-size:18px;font-weight:700;margin-bottom:4px;">${ticket.subject}</h2>
                <div style="font-size:12px;color:var(--text-muted);">
                  From <strong>${ticket.email}</strong> · ${new Date(ticket.createdAt).toLocaleString('es-CO')}
                </div>
              </div>
            </div>

            <div style="background:var(--bg);border-radius:var(--radius-md);padding:16px;font-size:14px;line-height:1.7;color:var(--text);">
              ${ticket.description}
            </div>
          </div>

          <!-- Conversation -->
          <div class="card">
            <div class="card-title" style="margin-bottom:16px;">💬 Conversation</div>

            <div id="messagesList" style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">
              ${ticket.messages.length === 0
                ? `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px;">No messages yet. Be the first to reply!</div>`
                : ticket.messages.map(m => `
                  <div style="background:var(--bg);border-radius:var(--radius-md);padding:14px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                      <div style="display:flex;align-items:center;gap:8px;">
                        <div style="width:28px;height:28px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;">
                          A
                        </div>
                        <span style="font-size:12px;font-weight:600;">Agent</span>
                      </div>
                      <span style="font-size:11px;color:var(--text-muted);">${new Date(m.created_at).toLocaleString('es-CO')}</span>
                    </div>
                    <div style="font-size:13px;line-height:1.6;">${m.content}</div>
                  </div>`).join('')}
            </div>

            <!-- Reply box -->
            <div>
              <div class="alert alert-error"   id="replyError"   style="display:none;"></div>
              <div class="alert alert-success" id="replySuccess" style="display:none;"></div>
              <textarea id="replyContent" class="input-field" style="height:100px;resize:none;margin-bottom:10px;" placeholder="Write your reply..."></textarea>
              <button class="btn btn-primary" id="sendReplyBtn">Send Reply</button>
            </div>
          </div>

          <!-- Event history -->
          <div class="card">
            <div class="card-title" style="margin-bottom:16px;">📋 Event History</div>
            <div style="display:flex;flex-direction:column;gap:0;">
              ${ticket.events.map((e, i) => `
                <div style="display:flex;gap:12px;padding-bottom:${i === ticket.events.length - 1 ? '0' : '16px'};">
                  <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
                    <div style="width:10px;height:10px;border-radius:50%;background:var(--primary);margin-top:4px;"></div>
                    ${i < ticket.events.length - 1 ? `<div style="width:2px;flex:1;background:var(--border);margin-top:4px;"></div>` : ''}
                  </div>
                  <div style="padding-bottom:4px;">
                    <div style="font-size:12px;font-weight:700;color:var(--text);">${e.type.replace(/_/g,' ')}</div>
                    <div style="font-size:11px;color:var(--text-muted);">${e.description}</div>
                    <div style="font-size:10px;color:var(--text-light);margin-top:2px;">${new Date(e.created_at).toLocaleString('es-CO')}</div>
                  </div>
                </div>`).join('')}
            </div>
          </div>

        </div>

        <!-- RIGHT: sidebar actions -->
        <div style="display:flex;flex-direction:column;gap:16px;">

          <!-- Change status -->
          <div class="card">
            <div class="card-title" style="margin-bottom:12px;">🔄 Change Status</div>
            <div class="alert alert-error"   id="statusError"   style="display:none;"></div>
            <div class="alert alert-success" id="statusSuccess" style="display:none;"></div>
            <select id="statusSelect" class="input-field" style="margin-bottom:10px;">
              ${['OPEN','IN_PROGRESS','RESOLVED','CLOSED'].map(s => `
                <option value="${s}" ${ticket.status === s ? 'selected' : ''}>${s.replace('_',' ')}</option>
              `).join('')}
            </select>
            <button class="btn btn-primary btn-full" id="updateStatusBtn">Update Status</button>
          </div>

          <!-- Assign agent -->
          <div class="card">
            <div class="card-title" style="margin-bottom:4px;">👤 Assigned To</div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
              ${assignedAgent
                ? `Currently: <strong>${assignedAgent.name}</strong>`
                : 'Not assigned yet'}
            </div>
            <div class="alert alert-error"   id="assignError"   style="display:none;"></div>
            <div class="alert alert-success" id="assignSuccess" style="display:none;"></div>
            <select id="agentSelect" class="input-field" style="margin-bottom:10px;">
              <option value="">Unassigned</option>
              ${members.map(m => `
                <option value="${m.id}" ${String(ticket.assigned_to) === String(m.id) ? 'selected' : ''}>
                  ${m.name} (${m.role})
                </option>`).join('')}
            </select>
            <button class="btn btn-primary btn-full" id="assignBtn">Assign Agent</button>
          </div>

          <!-- Ticket metadata -->
          <div class="card">
            <div class="card-title" style="margin-bottom:12px;">ℹ️ Info</div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${[
                { label: 'Created',     value: new Date(ticket.createdAt).toLocaleDateString('es-CO') },
                { label: 'Updated',     value: new Date(ticket.updatedAt).toLocaleDateString('es-CO') },
                { label: 'Messages',    value: ticket.messages.length },
                { label: 'Events',      value: ticket.events.length },
              ].map(item => `
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;">
                  <span style="color:var(--text-muted);">${item.label}</span>
                  <span style="font-weight:600;">${item.value}</span>
                </div>`).join('')}
            </div>
          </div>

        </div>
      </div>`;

    // ── Send reply ──
    document.getElementById('sendReplyBtn').addEventListener('click', async () => {
      const content   = document.getElementById('replyContent').value.trim();
      const errorEl   = document.getElementById('replyError');
      const successEl = document.getElementById('replySuccess');
      const btn       = document.getElementById('sendReplyBtn');

      errorEl.style.display = successEl.style.display = 'none';

      if (!content) {
        errorEl.textContent   = 'Please write a reply first.';
        errorEl.style.display = 'block';
        return;
      }

      btn.disabled  = true;
      btn.innerHTML = '<div class="spinner spinner-white"></div> Sending...';

      try {
        const { ticket: updated } = await api.post(`/tickets/${ticketId}/messages`, { content });

        // Append new message to list
        const messagesList = document.getElementById('messagesList');
        const lastMessage  = updated.messages[updated.messages.length - 1];

        // Remove empty state if present
        const emptyState = messagesList.querySelector('div[style*="text-align:center"]');
        if (emptyState) emptyState.remove();

        const msgEl = document.createElement('div');
        msgEl.style.cssText = 'background:var(--bg);border-radius:var(--radius-md);padding:14px;';
        msgEl.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:28px;height:28px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;">A</div>
              <span style="font-size:12px;font-weight:600;">Agent</span>
            </div>
            <span style="font-size:11px;color:var(--text-muted);">${new Date(lastMessage.created_at).toLocaleString('es-CO')}</span>
          </div>
          <div style="font-size:13px;line-height:1.6;">${lastMessage.content}</div>`;

        messagesList.appendChild(msgEl);
        document.getElementById('replyContent').value = '';

        successEl.textContent   = '✅ Reply sent!';
        successEl.style.display = 'block';
        setTimeout(() => successEl.style.display = 'none', 3000);

      } catch (err) {
        errorEl.textContent   = err.message;
        errorEl.style.display = 'block';
      } finally {
        btn.disabled  = false;
        btn.innerHTML = 'Send Reply';
      }
    });

    // ── Update status ──
    document.getElementById('updateStatusBtn').addEventListener('click', async () => {
      const status    = document.getElementById('statusSelect').value;
      const errorEl   = document.getElementById('statusError');
      const successEl = document.getElementById('statusSuccess');
      const btn       = document.getElementById('updateStatusBtn');

      errorEl.style.display = successEl.style.display = 'none';
      btn.disabled  = true;
      btn.innerHTML = '<div class="spinner spinner-white"></div>';

      try {
        await api.put(`/tickets/${ticketId}/status`, { status });
        successEl.textContent   = `✅ Status updated to ${status.replace('_',' ')}`;
        successEl.style.display = 'block';
        setTimeout(() => successEl.style.display = 'none', 3000);
      } catch (err) {
        errorEl.textContent   = err.message;
        errorEl.style.display = 'block';
      } finally {
        btn.disabled  = false;
        btn.innerHTML = 'Update Status';
      }
    });

    // ── Assign agent ──
    document.getElementById('assignBtn').addEventListener('click', async () => {
      const agentId   = document.getElementById('agentSelect').value;
      const errorEl   = document.getElementById('assignError');
      const successEl = document.getElementById('assignSuccess');
      const btn       = document.getElementById('assignBtn');

      errorEl.style.display = successEl.style.display = 'none';
      btn.disabled  = true;
      btn.innerHTML = '<div class="spinner spinner-white"></div>';

      try {
        await api.put(`/tickets/${ticketId}/assign`, { agentId: agentId || null });
        const agent = members.find(m => String(m.id) === String(agentId));
        successEl.textContent   = agentId
          ? `✅ Assigned to ${agent?.name}`
          : '✅ Ticket unassigned';
        successEl.style.display = 'block';
        setTimeout(() => successEl.style.display = 'none', 3000);
      } catch (err) {
        errorEl.textContent   = err.message;
        errorEl.style.display = 'block';
      } finally {
        btn.disabled  = false;
        btn.innerHTML = 'Assign Agent';
      }
    });

  } catch (err) {
    pageContent.innerHTML = `
      <div class="page-error">
        <div style="font-size:40px;">⚠️</div>
        <p>${err.message}</p>
        <button class="btn btn-outline btn-sm" onclick="navigate('#/dashboard/tickets')" style="margin-top:12px;">
          ← Back to tickets
        </button>
      </div>`;
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
          { icon: '📊', label: 'Dashboard',  route: '#/dashboard' },
          { icon: '🎫', label: 'Tickets',    route: '#/dashboard/tickets' },
          { icon: '👥', label: 'Agentes',    route: '#/dashboard' },
          { icon: '🔌', label: 'Add-ons',    route: '#/dashboard' },
          { icon: '⚙️',  label: 'Settings',   route: '#/dashboard/settings' },
        ].map(item => `
          <button class="nav-item ${window.location.hash.startsWith(item.route) ? 'active' : ''}" data-route="${item.route}">
            ${item.icon} ${item.label}
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
  document.querySelectorAll('.nav-item[data-route]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.route));
  });
}