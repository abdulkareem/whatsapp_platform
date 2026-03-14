const ADMIN_TOKEN_KEY = 'wa_admin_token';
const DEVICE_ID_KEY = 'wa_admin_device_id';
const TOKEN_EVENT = 'wa_admin_token_changed';

const notifyTokenChanged = () => {
  window.dispatchEvent(new Event(TOKEN_EVENT));
};

const createDeviceId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const auth = {
  getToken() {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    notifyTokenChanged();
  },

  clearToken() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    notifyTokenChanged();
  },

  getOrCreateDeviceId() {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      return existing;
    }

    const generated = createDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, generated);
    return generated;
  },

  isLoggedIn() {
    return Boolean(this.getToken());
  },

  subscribe(onTokenChange: () => void) {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_TOKEN_KEY) {
        onTokenChange();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(TOKEN_EVENT, onTokenChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(TOKEN_EVENT, onTokenChange);
    };
  }
};
