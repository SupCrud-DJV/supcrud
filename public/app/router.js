import { Auth } from './utils/auth.js';
import { renderLanding }             from './pages/landing.js';
import { renderLogin }               from './pages/login.js';
import { renderWorkspaceSelector }   from './pages/workspaceSelector.js';
import { renderOwnerDashboard }      from './pages/ownerDashboard.js';
import { renderWorkspaceDashboard }  from './pages/workspaceDashboard.js';
import { renderLoader }              from './components/loader.js';

const routes = {
  '#/'                  : renderLanding,
  '#/login'             : renderLogin,
  '#/select-workspace'  : renderWorkspaceSelector,
  '#/owner'             : renderOwnerDashboard,
  '#/dashboard'         : renderWorkspaceDashboard,
};

// Routes that require login
const protectedRoutes = ['#/select-workspace', '#/owner', '#/dashboard'];

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute(); // run on first load
}

function handleRoute() {
  const hash = window.location.hash || '#/';
  const app  = document.getElementById('app');

  // Guard: protected routes
  if (protectedRoutes.includes(hash) && !Auth.isLoggedIn()) {
    window.location.hash = '#/login';
    return;
  }

  // Guard: already logged in, redirect away from login
  if (hash === '#/login' && Auth.isLoggedIn()) {
    const workspace = Auth.getWorkspace();
    window.location.hash = workspace ? '#/dashboard' : '#/select-workspace';
    return;
  }

  const render = routes[hash];

  if (render) {
    renderLoader(app); // show loader briefly
    setTimeout(() => render(app), 100);
  } else {
    app.innerHTML = `
      <div class="page-error">
        <div style="font-size:48px">404</div>
        <p>Page not found</p>
        <a href="#/" class="btn btn-primary btn-sm" style="margin-top:12px">Go home</a>
      </div>`;
  }
}

export function navigate(hash) {
  window.location.hash = hash;
}