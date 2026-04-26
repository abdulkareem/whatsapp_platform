const SHOP_TOKEN_KEY = 'wa_shop_token';
const SHOP_TOKEN_EVENT = 'wa_shop_token_changed';

const notify = () => window.dispatchEvent(new Event(SHOP_TOKEN_EVENT));

export const shopAuth = {
  getToken() {
    return localStorage.getItem(SHOP_TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(SHOP_TOKEN_KEY, token);
    notify();
  },
  clearToken() {
    localStorage.removeItem(SHOP_TOKEN_KEY);
    notify();
  },
  isLoggedIn() {
    return Boolean(this.getToken());
  },
  subscribe(onChange: () => void) {
    const onStorage = (event: StorageEvent) => {
      if (event.key === SHOP_TOKEN_KEY) onChange();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(SHOP_TOKEN_EVENT, onChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(SHOP_TOKEN_EVENT, onChange);
    };
  }
};
