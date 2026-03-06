import { api }      from '../utils/api.js';
import { Auth }     from '../utils/auth.js';
import { navigate } from '../router.js';

export function renderLogin(container) {
  container.innerHTML = `
    <div class="auth-layout">
      <div class="auth-box">

        <div class="auth-logo">
          <div class="auth-logo-icon">S</div>
          <span class="auth-logo-name">SupCrud <span style="color:var(--text-muted);font-weight:400;font-size:13px;">by Crudzaso</span></span>
        </div>

        <h1 class="auth-title">Welcome back</h1>
        <p class="auth-subtitle">Sign in to your workspace</p>

        <!-- Error alert -->
        <div class="alert alert-error" id="loginError" style="display:none;"></div>

        <!-- Email -->
        <div class="input-group">
          <label class="input-label" for="loginEmail">Email</label>
          <input type="email" id="loginEmail" class="input-field" placeholder="you@example.com"/>
        </div>

        <!-- Password -->
        <div class="input-group">
          <label class="input-label" for="loginPassword">Password</label>
          <input type="password" id="loginPassword" class="input-field" placeholder="••••••••"/>
        </div>

        <!-- Submit -->
        <button class="btn btn-primary btn-full" id="loginBtn">Sign In</button>

        <div class="divider">or</div>

        <!-- Google OAuth -->
        <button class="btn btn-google btn-full" id="googleBtn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" alt="Google"/>
          Continue with Google
        </button>

        <p style="text-align:center;margin-top:20px;font-size:13px;color:var(--text-muted);">
          Don't have an account? <a href="#/register">Sign up</a>
        </p>

      </div>
    </div>`;

  // ── Email login ──
  document.getElementById('loginBtn').addEventListener('click', async () => {
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl  = document.getElementById('loginError');
    const btn      = document.getElementById('loginBtn');

    errorEl.style.display = 'none';

    if (!email || !password) {
      errorEl.textContent   = 'Please fill in all fields.';
      errorEl.style.display = 'block';
      return;
    }

    btn.disabled     = true;
    btn.innerHTML    = '<div class="spinner spinner-white"></div> Signing in...';

    try {
      const data = await api.post('/auth/login', { email, password });
      Auth.setToken(data.token);
      Auth.setUser(data.user);

      // If user belongs to multiple workspaces → selector
      // If only one → go straight to dashboard
      if (data.workspaces?.length === 1) {
        Auth.setWorkspace(data.workspaces[0]);
        navigate(data.user.role === 'OWNER' ? '#/owner' : '#/dashboard');
      } else {
        navigate('#/select-workspace');
      }

    } catch (err) {
      errorEl.textContent   = err.message || 'Invalid credentials.';
      errorEl.style.display = 'block';
    } finally {
      btn.disabled  = false;
      btn.innerHTML = 'Sign In';
    }
  });

  // ── Google OAuth ──
  document.getElementById('googleBtn').addEventListener('click', () => {
    // Replace YOUR_GOOGLE_CLIENT_ID with your actual client ID from Google Cloud Console
    window.location.href = '/api/auth/google';
    const clientId    = 319936385861-hdsldo368a75ib7juj7gt90vu2kptct0.apps.googleusercontent.com;
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/google/callback`);
    const scope       = encodeURIComponent('openid email profile');
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  });

  // ── Enter key support ──
  document.getElementById('loginPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
  });
}