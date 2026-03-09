import { api }      from '../utils/api.js';
import { Auth }     from '../utils/auth.js';
import { navigate } from '../router.js';

export async function renderUserProfile(container) {
  const workspace = Auth.getWorkspace();

  container.innerHTML = `
    <div class="dashboard-layout">

      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      ${renderSidebar(workspace)}

      <div class="main-content">
        <div class="mobile-topbar">
          <button id="hamburger" style="background:none;border:none;color:white;font-size:22px;cursor:pointer;">☰</button>
          <span style="color:white;font-weight:700;">Mi Perfil</span>
          <div style="width:32px;"></div>
        </div>

        <div class="topbar">
          <span class="topbar-title">Mi Perfil</span>
        </div>

        <div class="page-content" id="pageContent">
          <div class="page-loader"><div class="spinner"></div></div>
        </div>
      </div>

    </div>`;

  attachSidebarEvents();
  await loadProfile();
}

async function loadProfile() {
  const pageContent = document.getElementById('pageContent');
  const workspace   = Auth.getWorkspace();

  try {
    const [{ user }, roleData] = await Promise.all([
      api.get('/users/me'),
      workspace ? api.get(`/users/me/role?workspaceId=${workspace.id}`) : Promise.resolve({ role: null })
    ]);

    pageContent.innerHTML = `
      <div style="max-width:560px;">

        <!-- Profile card -->
        <div class="card" style="margin-bottom:20px;">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
            <div style="width:64px;height:64px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:white;flex-shrink:0;overflow:hidden;">
              ${user.avatar
                ? `<img src="${user.avatar}" style="width:100%;height:100%;object-fit:cover;" alt="${user.name}"/>`
                : user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style="font-size:18px;font-weight:700;">${user.name}</div>
              <div style="color:var(--text-muted);font-size:13px;">${user.email}</div>
              <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
                <span class="badge badge-primary">${user.role}</span>
                ${roleData.role ? `<span class="badge badge-neutral">${roleData.role} en este workspace</span>` : ''}
              </div>
            </div>
          </div>

          <div style="border-top:1px solid var(--border);padding-top:16px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Miembro desde</div>
                <div style="font-size:13px;font-weight:600;">${new Date(user.created_at).toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })}</div>
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Autenticación</div>
                <div style="font-size:13px;font-weight:600;">${user.has_password ? '🔐 Email + Contraseña' : '🔵 Google OAuth'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Change password card -->
        ${user.has_password ? `
        <div class="card">
          <div class="card-title" style="margin-bottom:4px;">🔒 Cambiar contraseña</div>
          <div class="card-subtitle" style="margin-bottom:20px;">Asegúrate de usar una contraseña segura</div>

          <div class="alert alert-error"   id="pwError"   style="display:none;"></div>
          <div class="alert alert-success" id="pwSuccess" style="display:none;"></div>

          <div class="input-group">
            <label class="input-label">Contraseña actual</label>
            <input type="password" id="currentPw" class="input-field" placeholder="••••••••"/>
          </div>
          <div class="input-group">
            <label class="input-label">Nueva contraseña</label>
            <input type="password" id="newPw" class="input-field" placeholder="mínimo 6 caracteres"/>
          </div>
          <div class="input-group">
            <label class="input-label">Confirmar nueva contraseña</label>
            <input type="password" id="confirmPw" class="input-field" placeholder="repite tu nueva contraseña"/>
          </div>

          <button class="btn btn-primary" id="changePwBtn">Actualizar contraseña</button>
        </div>` : `
        <div class="card" style="text-align:center;padding:28px;">
          <div style="font-size:28px;margin-bottom:8px;">🔵</div>
          <div class="card-title">Cuenta de Google</div>
          <div class="card-subtitle" style="margin-top:4px;">Tu cuenta usa Google Sign-In. No necesitas contraseña.</div>
        </div>`}

      </div>`;

    // Change password handler
    if (user.has_password) {
      document.getElementById('changePwBtn').addEventListener('click', async () => {
        const currentPassword = document.getElementById('currentPw').value;
        const newPassword     = document.getElementById('newPw').value;
        const confirmPassword = document.getElementById('confirmPw').value;
        const errorEl         = document.getElementById('pwError');
        const successEl       = document.getElementById('pwSuccess');
        const btn             = document.getElementById('changePwBtn');

        errorEl.style.display   = 'none';
        successEl.style.display = 'none';

        if (!currentPassword || !newPassword || !confirmPassword) {
          errorEl.textContent   = 'Por favor completa todos los campos.';
          errorEl.style.display = 'block';
          return;
        }

        if (newPassword.length < 6) {
          errorEl.textContent   = 'La nueva contraseña debe tener al menos 6 caracteres.';
          errorEl.style.display = 'block';
          return;
        }

        if (newPassword !== confirmPassword) {
          errorEl.textContent   = 'Las contraseñas no coinciden.';
          errorEl.style.display = 'block';
          return;
        }

        btn.disabled  = true;
        btn.innerHTML = '<div class="spinner spinner-white"></div> Actualizando...';

        try {
          await api.put('/users/me/password', { currentPassword, newPassword });
          successEl.textContent   = '✅ Contraseña actualizada correctamente.';
          successEl.style.display = 'block';
          document.getElementById('currentPw').value = '';
          document.getElementById('newPw').value     = '';
          document.getElementById('confirmPw').value = '';
        } catch (err) {
          errorEl.textContent   = err.message || 'Error al actualizar la contraseña.';
          errorEl.style.display = 'block';
        } finally {
          btn.disabled  = false;
          btn.innerHTML = 'Actualizar contraseña';
        }
      });
    }

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
        <button class="nav-item active" data-route="#/profile">
          👤 Mi Perfil
        </button>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar">
            ${user?.avatar
              ? `<img src="${user.avatar}" alt="${user.name}"/>`
              : user?.name?.[0]?.toUpperCase()}
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