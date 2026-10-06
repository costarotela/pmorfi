// ═══════════════════════════════════════════════════════════════
// AUTH SERVICE — cuentas de cliente de Punto Morfi.
// Google One Tap (GIS, gratis) + registro rápido por teléfono.
// Token de sesión en localStorage; el backend valida y vincula
// pedidos (historial, re-pedido, lista de clientes del admin).
// Doctrina cápsula transaccional: costo $0 — sin OTP/SMS.
// ═══════════════════════════════════════════════════════════════
import { Customer, Order } from '../types';

const API = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`;
const TOKEN_KEY = 'punto…oken';

interface AuthConfig {
  googleEnabled: boolean;
  googleClientId: string | null;
}

// Tipos mínimos de Google Identity Services (script externo)
interface GsiWindow extends Window {
  google?: {
    accounts: {
      id: {
        initialize: (cfg: { client_id: string; callback: (resp: { credential: string }) => void }) => void;
        renderButton: (el: HTMLElement, opts?: Record<string, unknown>) => void;
        prompt: () => void;
      };
    };
  };
}

let gsiPromise: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise((resolve, reject) => {
    if ((window as GsiWindow).google) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('no se pudo cargar Google Sign-In'));
    document.head.appendChild(s);
  });
  return gsiPromise;
}

class AuthService {
  private token: string | null = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

  getToken(): string | null {
    return this.token;
  }

  private setToken(t: string | null) {
    this.token = t;
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }

  private headers(json = true): Record<string, string> {
    const h: Record<string, string> = {};
    if (json) h['Content-Type'] = 'application/json';
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }

  async getConfig(): Promise<AuthConfig> {
    try {
      const r = await fetch(`${API}/auth/config`);
      return await r.json();
    } catch {
      return { googleEnabled: false, googleClientId: null };
    }
  }

  /** Renderiza el botón oficial de Google en `el`. Devuelve cleanup. */
  async renderGoogleButton(
    el: HTMLElement,
    onLogin: (result: { token: string; customer: Customer }) => void,
    onError: (msg: string) => void
  ): Promise<() => void> {
    const cfg = await this.getConfig();
    if (!cfg.googleEnabled || !cfg.googleClientId) throw new Error('google-no-config');
    await loadGsi();
    const w = window as GsiWindow;
    w.google!.accounts.id.initialize({
      client_id: cfg.googleClientId,
      callback: async (resp) => {
        try {
          const r = await fetch(`${API}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: resp.credential }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error || 'falló Google');
          this.setToken(d.token);
          onLogin(d);
        } catch (e) {
          onError(e instanceof Error ? e.message : 'falló el inicio con Google');
        }
      },
    });
    el.innerHTML = '';
    w.google!.accounts.id.renderButton(el, {
      theme: 'filled_blue',
      size: 'large',
      shape: 'pill',
      width: 280,
      text: 'continue_with',
      locale: 'es-419',
    });
    return () => { el.innerHTML = ''; };
  }

  /** One Tap (prompt nativo de Google, opcional y silencioso). */
  async tryOneTap(): Promise<void> {
    try {
      const cfg = await this.getConfig();
      if (!cfg.googleEnabled || !cfg.googleClientId || this.token) return;
      await loadGsi();
      (window as GsiWindow).google?.accounts.id.prompt();
    } catch {
      /* One Tap es best-effort: nunca bloquea la app */
    }
  }

  async loginPhone(name: string, phone: string): Promise<{ token: string; customer: Customer }> {
    const r = await fetch(`${API}/auth/phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'no se pudo crear la cuenta');
    this.setToken(d.token);
    return d;
  }

  /** Restaura la sesión guardada. Devuelve null si no hay token válido. */
  async restore(): Promise<Customer | null> {
    if (!this.token) return null;
    const me = await this.getMe();
    if (!me) this.setToken(null);
    return me?.customer ?? null;
  }

  async getMe(): Promise<{ customer: Customer; orders: Order[] } | null> {
    if (!this.token) return null;
    try {
      const r = await fetch(`${API}/me`, { headers: this.headers(false) });
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    }
  }

  async updateMe(patch: Partial<Pick<Customer, 'name' | 'phone' | 'addresses'>>): Promise<Customer> {
    const r = await fetch(`${API}/me`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify(patch),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'no se pudo guardar');
    return d.customer;
  }

  logout() {
    this.setToken(null);
  }
}

export const authService = new AuthService();
