import { api }      from '../utils/api.js';
import { Auth }     from '../utils/auth.js';
import { navigate } from '../router.js';

export function renderRegister(container) {
  container.innerHTML = `
    <div class="auth-layout">
      <div class="auth-box">

        <div class="auth-logo">
          <div class="auth-logo-icon">S</div>
          <span class="auth-logo-name">SupCrud <span style="color:var(--text-muted);font-weight:400;font-size:13px;">by Crudzaso</span></span>
        </div>

        <h1 class="auth-title">Create an account</h1>
        <p class="auth-subtitle">Start managing your support tickets today</p>

        <!-- Error alert -->
        <div class="alert alert-error" id="registerError" style="display:none;"></div>

        <!-- Name -->
        <div class="input-group">
          <label class="input-label" for="registerName">Full name</label>
          <input type="text" id="registerName" class="input-field" placeholder="Veronica Martinez"/>
        </div>

        <!-- Email -->
        <div class="input-group">
          <label class="input-label" for="registerEmail">Email</label>
          <input type="email" id="registerEmail" class="input-field" placeholder="you@example.com"/>
        </div>

        <!-- Password -->
        <div class="input-group">
          <label class="input-label" for="registerPassword">Password</label>
          <input type="password" id="registerPassword" class="input-field" placeholder="min. 6 characters"/>
        </div>

        <!-- Confirm Password -->
        <div class="input-group">
          <label class="input-label" for="registerConfirm">Confirm password</label>
          <input type="password" id="registerConfirm" class="input-field" placeholder="repeat your password"/>
        </div>

        <!-- Submit -->
        <button class="btn btn-primary btn-full" id="registerBtn">Create Account</button>

        <div class="divider">or</div>

        <button class="btn btn-google btn-full" id="googleBtn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" alt="Google"/>
          Continue with Google
        </button>

        <p style="text-align:center;margin-top:20px;font-size:13px;color:var(--text-muted);">
          Already have an account? <a href="#/login">Sign in</a>
        </p>

      </div>
    </div>`;

  // ── Register ──
  document.getElementById('registerBtn').addEventListener('click', async () => {
    const name     = document.getElementById('registerName').value.trim();
    const email    = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm  = document.getElementById('registerConfirm').value;
    const errorEl  = document.getElementById('registerError');
    const btn      = document.getElementById('registerBtn');

    errorEl.style.display = 'none';

    // Validation
    if (!name || !email || !password || !confirm) {
      errorEl.textContent   = 'Please fill in all fields.';
      errorEl.style.display = 'block';
      return;
    }

    if (password.length < 6) {
      errorEl.textContent   = 'Password must be at least 6 characters.';
      errorEl.style.display = 'block';
      return;
    }

    if (password !== confirm) {
      errorEl.textContent   = 'Passwords do not match.';
      errorEl.style.display = 'block';
      return;
    }

    btn.disabled  = true;
    btn.innerHTML = '<div class="spinner spinner-white"></div> Creating account...';

    try {
      const data = await api.post('/auth/register', { name, email, password });

      Auth.setToken(data.token);
      Auth.setUser(data.user);

      navigate('#/select-workspace');

    } catch (err) {
      errorEl.textContent   = err.message || 'Registration failed.';
      errorEl.style.display = 'block';
    } finally {
      btn.disabled  = false;
      btn.innerHTML = 'Create Account';
    }
  });

  // ── Google ──
  document.getElementById('googleBtn').addEventListener('click', () => {
    window.location.href = '/api/auth/google';
  });

  // ── Enter key ──
  document.getElementById('registerConfirm').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('registerBtn').click();
  });
}