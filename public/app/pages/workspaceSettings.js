import { api }      from '../utils/api.js';
import { Auth }     from '../utils/auth.js';
import { navigate } from '../router.js';

export async function renderWorkspaceSettings(container) {
  const workspace = Auth.getWorkspace();
  if (!workspace) return navigate('#/select-workspace');

  container.innerHTML = `
    <div class="dashboard-layout">
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      ${renderSidebar(workspace)}

      <div class="main-content">
        <div class="mobile-topbar">
          <button id="hamburger" style="background:none;border:none;color:white;font-size:22px;cursor:pointer;">☰</button>
          <span style="color:white;font-weight:700;">Settings</span>
          <div style="width:32px;"></div>
        </div>
        <div class="topbar">
          <span class="topbar-title">⚙️ Workspace Settings</span>
        </div>
        <div class="page-content" id="pageContent">
          <div class="page-loader"><div class="spinner"></div></div>
        </div>
      </div>
    </div>`;

  attachSidebarEvents();
  await loadSettings(workspace);
}

async function loadSettings(workspace) {
  const pageContent = document.getElementById('pageContent');

  try {
    const [{ workspace: ws }, { members }, { addons }, { config: aiConfig }] = await Promise.all([
      api.get(`/workspaces/${workspace.id}`),
      api.get(`/workspaces/${workspace.id}/members`),
      api.get(`/workspaces/${workspace.id}/addons`),
      api.get(`/workspaces/${workspace.id}/ai-config`),
    ]);

    pageContent.innerHTML = `
      <div style="max-width:680px;display:flex;flex-direction:column;gap:20px;">

        <!-- General info -->
        <div class="card">
          <div class="card-title" style="margin-bottom:4px;">🏢 General</div>
          <div class="card-subtitle" style="margin-bottom:20px;">Información básica del workspace</div>

          <div class="input-group">
            <label class="input-label">Nombre del workspace</label>
            <input type="text" id="wsName" class="input-field" value="${ws.name}"/>
          </div>

          <div style="background:var(--bg);border-radius:var(--radius-md);padding:14px;margin-bottom:16px;">
            <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Workspace Key</div>
            <div style="font-family:monospace;font-size:13px;font-weight:600;color:var(--primary);">${ws.workspace_key}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Usa esta clave para integrar el widget en tu sitio web</div>
          </div>

          <div style="display:flex;gap:8px;align-items:center;">
            <span class="badge ${ws.status === 'ACTIVE' ? 'badge-success' : 'badge-error'}">${ws.status}</span>
            <span style="font-size:12px;color:var(--text-muted);">Estado del workspace</span>
          </div>

          <div class="alert alert-error"   id="wsNameError"   style="display:none;margin-top:16px;"></div>
          <div class="alert alert-success" id="wsNameSuccess" style="display:none;margin-top:16px;"></div>

          <button class="btn btn-primary" id="saveNameBtn" style="margin-top:16px;">Guardar cambios</button>
        </div>

        <!-- Members -->
        <div class="card">
          <div class="card-title" style="margin-bottom:4px;">👥 Miembros</div>
          <div class="card-subtitle" style="margin-bottom:16px;">${members.length} miembro(s) en este workspace</div>

          <div style="display:flex;flex-direction:column;gap:10px;">
            ${members.map(m => `
              <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg);border-radius:var(--radius-md);">
                <div style="width:36px;height:36px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;flex-shrink:0;overflow:hidden;">
                  ${m.avatar
                    ? `<img src="${m.avatar}" style="width:100%;height:100%;object-fit:cover;"/>`
                    : m.name?.[0]?.toUpperCase()}
                </div>
                <div style="flex:1;overflow:hidden;">
                  <div style="font-weight:600;font-size:13px;">${m.name}</div>
                  <div style="font-size:11px;color:var(--text-muted);">${m.email}</div>
                </div>
                <span class="badge ${m.role === 'ADMIN' ? 'badge-primary' : 'badge-neutral'}">${m.role}</span>
              </div>`).join('')}
          </div>
        </div>

        <!-- Add-ons -->
        <div class="card">
          <div class="card-title" style="margin-bottom:4px;">🔌 Add-ons</div>
          <div class="card-subtitle" style="margin-bottom:16px;">Activa funcionalidades adicionales para tu workspace</div>

          <div style="display:flex;flex-direction:column;gap:12px;" id="addonsList">
            ${addons.map(addon => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border:1.5px solid ${addon.active ? 'var(--primary)' : 'var(--border)'};border-radius:var(--radius-md);background:${addon.active ? 'var(--primary-light)' : 'var(--bg)'};">
                <div>
                  <div style="font-weight:700;font-size:13px;">${addon.name}</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${addon.description}</div>
                </div>
                <label style="position:relative;display:inline-block;width:44px;height:24px;flex-shrink:0;cursor:pointer;">
                  <input type="checkbox" data-addon-id="${addon.id}" ${addon.active ? 'checked' : ''}
                    style="opacity:0;width:0;height:0;position:absolute;" class="addon-toggle"/>
                  <span style="position:absolute;inset:0;background:${addon.active ? 'var(--primary)' : '#cbd5e1'};border-radius:24px;transition:0.2s;"></span>
                  <span style="position:absolute;top:3px;left:${addon.active ? '23px' : '3px'};width:18px;height:18px;background:white;border-radius:50%;transition:0.2s;"></span>
                </label>
              </div>`).join('')}
          </div>
        </div>

        <!-- AI Config -->
        <div class="card">
          <div class="card-title" style="margin-bottom:4px;">🤖 Configuración de IA</div>
          <div class="card-subtitle" style="margin-bottom:20px;">Controla cómo la IA clasifica y asigna tickets</div>

          <div class="alert alert-error"   id="aiError"   style="display:none;"></div>
          <div class="alert alert-success" id="aiSuccess" style="display:none;"></div>

          <div class="input-group">
            <label class="input-label">Modo</label>
            <select id="aiMode" class="input-field">
              <option value="APPROVAL" ${aiConfig?.mode === 'APPROVAL' ? 'selected' : ''}>APPROVAL — La IA sugiere, tú apruebas</option>
              <option value="AUTO"     ${aiConfig?.mode === 'AUTO'     ? 'selected' : ''}>AUTO — La IA asigna automáticamente</option>
            </select>
          </div>

          <div class="input-group">
            <label class="input-label">Auto-asignación</label>
            <div style="display:flex;align-items:center;gap:10px;margin-top:4px;">
              <input type="checkbox" id="autoAssign" ${aiConfig?.auto_assign_enabled ? 'checked' : ''}
                style="width:16px;height:16px;cursor:pointer;accent-color:var(--primary);"/>
              <span style="font-size:13px;color:var(--text-muted);">Activar auto-asignación de agentes</span>
            </div>
          </div>

          <div class="input-group">
            <label class="input-label">Umbral de confianza: <strong id="thresholdVal">${Math.round((aiConfig?.confidence_threshold || 0.80) * 100)}%</strong></label>
            <input type="range" id="threshold" min="0" max="100" value="${Math.round((aiConfig?.confidence_threshold || 0.80) * 100)}"
              style="width:100%;accent-color:var(--primary);margin-top:6px;"/>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-top:4px;">
              <span>0% (siempre aplica)</span>
              <span>100% (solo si es muy seguro)</span>
            </div>
          </div>

          <button class="btn btn-primary" id="saveAIBtn">Guardar configuración IA</button>
        </div>

      </div>`;

    // ── Save workspace name ──
    document.getElementById('saveNameBtn').addEventListener('click', async () => {
      const name      = document.getElementById('wsName').value.trim();
      const errorEl   = document.getElementById('wsNameError');
      const successEl = document.getElementById('wsNameSuccess');
      const btn       = document.getElementById('saveNameBtn');

      errorEl.style.display = successEl.style.display = 'none';

      if (!name || name.length < 3) {
        errorEl.textContent   = 'El nombre debe tener al menos 3 caracteres.';
        errorEl.style.display = 'block';
        return;
      }

      btn.disabled  = true;
      btn.innerHTML = '<div class="spinner spinner-white"></div> Guardando...';

      try {
        const { workspace: updated } = await api.put(`/workspaces/${workspace.id}`, { name });
        Auth.setWorkspace({ ...Auth.getWorkspace(), name: updated.name });
        successEl.textContent   = '✅ Nombre actualizado correctamente.';
        successEl.style.display = 'block';
      } catch (err) {
        errorEl.textContent   = err.message;
        errorEl.style.display = 'block';
      } finally {
        btn.disabled  = false;
        btn.innerHTML = 'Guardar cambios';
      }
    });

// ── Toggle add-ons ──
document.querySelectorAll('.addon-toggle').forEach(toggle => {
  toggle.addEventListener('change', async () => {
    const addonId  = toggle.dataset.addonId;
    const activate = toggle.checked;

    // Find the parent container to update styles visually
    const card = toggle.closest('div[style]');

    try {
      await api.post(`/workspaces/${workspace.id}/addons/toggle`, { addonId, activate });

      if (card) {
        card.style.borderColor = activate ? 'var(--primary)' : 'var(--border)';
        card.style.background  = activate ? 'var(--primary-light)' : 'var(--bg)';
      }

      const spans = toggle.parentElement.querySelectorAll('span');
      if (spans[0]) spans[0].style.background = activate ? 'var(--primary)' : '#cbd5e1';
      if (spans[1]) spans[1].style.left        = activate ? '23px' : '3px';

    } catch (err) {
      toggle.checked = !activate;
      alert(err.message);
    }
  });
});

    document.getElementById('threshold').addEventListener('input', e => {
      document.getElementById('thresholdVal').textContent = `${e.target.value}%`;
    });

    // ── Save AI config ──
    document.getElementById('saveAIBtn').addEventListener('click', async () => {
      const mode                 = document.getElementById('aiMode').value;
      const auto_assign_enabled  = document.getElementById('autoAssign').checked;
      const confidence_threshold = document.getElementById('threshold').value / 100;
      const errorEl              = document.getElementById('aiError');
      const successEl            = document.getElementById('aiSuccess');
      const btn                  = document.getElementById('saveAIBtn');

      errorEl.style.display = successEl.style.display = 'none';
      btn.disabled  = true;
      btn.innerHTML = '<div class="spinner spinner-white"></div> Guardando...';

      try {
        await api.put(`/workspaces/${workspace.id}/ai-config`, {
          mode, auto_assign_enabled, confidence_threshold
        });
        successEl.textContent   = '✅ Configuración de IA guardada.';
        successEl.style.display = 'block';
      } catch (err) {
        errorEl.textContent   = err.message;
        errorEl.style.display = 'block';
      } finally {
        btn.disabled  = false;
        btn.innerHTML = 'Guardar configuración IA';
      }
    });

  } catch (err) {
    pageContent.innerHTML = `
      <div class="page-error">
        <div style="font-size:40px;">⚠️</div>
        <p>${err.message}</p>
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
          { icon: '📊', label: 'Dashboard', route: '#/dashboard' },
          { icon: '🎫', label: 'Tickets',   route: '#/dashboard/tickets' },
          { icon: '👥', label: 'Agentes',   route: '#/dashboard/agents' },
          { icon: '🔌', label: 'Add-ons',   route: '#/dashboard/addons' },
          { icon: '⚙️',  label: 'Settings',  route: '#/dashboard/settings' },
        ].map(item => `
          <button class="nav-item ${window.location.hash === item.route ? 'active' : ''}" data-route="${item.route}">
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