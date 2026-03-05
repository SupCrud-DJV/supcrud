export const Auth = {
  setToken(token) {
    localStorage.setItem('supcrud_token', token);
  },

  getToken() {
    return localStorage.getItem('supcrud_token');
  },

  setUser(user) {
    localStorage.setItem('supcrud_user', JSON.stringify(user));
  },

  getUser() {
    const u = localStorage.getItem('supcrud_user');
    return u ? JSON.parse(u) : null;
  },

  setWorkspace(workspace) {
    localStorage.setItem('supcrud_workspace', JSON.stringify(workspace));
  },

  getWorkspace() {
    const w = localStorage.getItem('supcrud_workspace');
    return w ? JSON.parse(w) : null;
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  logout() {
    localStorage.removeItem('supcrud_token');
    localStorage.removeItem('supcrud_user');
    localStorage.removeItem('supcrud_workspace');
  }
};