import { Injectable } from '@angular/core';

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class TokenService {
  // Attempt to set token using any available secure storage plugin, falling back to Preferences/localStorage
  async setToken(token: string): Promise<void> {
    // Try Capacitor community secure storage plugin via global Plugins
    try {
      const cap = (window as any).Capacitor;
      const plugins = cap && cap.Plugins ? cap.Plugins : (window as any).Plugins;
      if (plugins && plugins.SecureStorage) {
        // plugin API may vary; try common shapes
        if (typeof plugins.SecureStorage.set === 'function') {
          await plugins.SecureStorage.set({ key: TOKEN_KEY, value: token });
          return;
        }
        if (typeof plugins.SecureStorage.setValue === 'function') {
          await plugins.SecureStorage.setValue(TOKEN_KEY, token);
          return;
        }
      }
    } catch (e) {
      // ignore and fallback
    }

    // Fallback to Capacitor Preferences (web/native) then localStorage
    try {
      const cap = (window as any).Capacitor;
      const prefs = cap && (cap.Plugins || (window as any).Plugins) && (cap.Plugins.Preferences || (window as any).Plugins.Preferences);
      if (prefs && typeof prefs.set === 'function') {
        await prefs.set({ key: TOKEN_KEY, value: token });
        return;
      }
    } catch (e) {
      // continue to localStorage
    }

    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      // last-resort: ignore
    }
  }

    async clearAll(): Promise<void> {
    await this.removeToken();
    localStorage.removeItem('campos_data');
    localStorage.removeItem('pending_uploads');
  }

  async getToken(): Promise<string | null> {
    // Try secure plugin first
    try {
      const cap = (window as any).Capacitor;
      const plugins = cap && cap.Plugins ? cap.Plugins : (window as any).Plugins;
      if (plugins && plugins.SecureStorage) {
        if (typeof plugins.SecureStorage.get === 'function') {
          const res = await plugins.SecureStorage.get({ key: TOKEN_KEY });
          // some plugins return { value }
          if (res && typeof res.value === 'string') return res.value;
          if (typeof res === 'string') return res;
        }
        if (typeof plugins.SecureStorage.getValue === 'function') {
          return await plugins.SecureStorage.getValue(TOKEN_KEY);
        }
      }
    } catch (e) {
      // ignore
    }

    // Preferences
    try {
      const cap = (window as any).Capacitor;
      const prefs = cap && (cap.Plugins || (window as any).Plugins) && (cap.Plugins.Preferences || (window as any).Plugins.Preferences);
      if (prefs && typeof prefs.get === 'function') {
        const res = await prefs.get({ key: TOKEN_KEY });
        if (res && typeof res.value === 'string') return res.value;
        if (typeof res === 'string') return res;
      }
    } catch (e) {
      // ignore
    }

    // localStorage fallback
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      return null;
    }
  }

  async removeToken(): Promise<void> {
    // Try secure plugin removal
    try {
      const cap = (window as any).Capacitor;
      const plugins = cap && cap.Plugins ? cap.Plugins : (window as any).Plugins;
      if (plugins && plugins.SecureStorage) {
        if (typeof plugins.SecureStorage.remove === 'function') {
          await plugins.SecureStorage.remove({ key: TOKEN_KEY });
        } else if (typeof plugins.SecureStorage.removeItem === 'function') {
          await plugins.SecureStorage.removeItem(TOKEN_KEY);
        }
      }
    } catch (e) {
      // ignore
    }

    try {
      const cap = (window as any).Capacitor;
      const prefs = cap && (cap.Plugins || (window as any).Plugins) && (cap.Plugins.Preferences || (window as any).Plugins.Preferences);
      if (prefs && typeof prefs.remove === 'function') {
        await prefs.remove({ key: TOKEN_KEY });
      }
    } catch (e) {
      // ignore
    }

    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      // ignore
    }
  }
}
