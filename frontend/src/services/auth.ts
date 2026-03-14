const ADMIN_TOKEN_KEY = 'wa_admin_token';

export const auth = {
  getToken() {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },

  isLoggedIn() {
    return Boolean(this.getToken());
  }
};
