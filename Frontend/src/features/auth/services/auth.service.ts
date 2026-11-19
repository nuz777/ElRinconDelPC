import { API_BASE_URL } from "../../../shared/config/env";
import {
  extractErrorMessage,
  requestJson,
  unwrapApiData,
} from "../../../shared/api/httpClient";

export type UserRole = "admin" | "user";
export type AuthProvider = "local" | "system";

export interface AuthUser {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  provider?: AuthProvider;
  role?: UserRole;
  picture?: string;
}

export interface AuthResponse {
  user: AuthUser;
}

export interface CheckSessionResponse {
  authenticated: boolean;
  user: AuthUser | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

const USER_STORAGE_KEY = "sotano_user";
const TOKEN_STORAGE_KEY = "sotano_token";
const REFRESHED_AT_KEY = "sotano_token_refreshed_at";
export const AUTH_STATE_EVENT = "sotano-auth-change";
/** Se emite cuando la API rechaza la sesión (token vencido o revocado). */
export const SESSION_EXPIRED_EVENT = "sotano-session-expired";

/** Renovar el token como mucho cada 12 h: la sesión de 30 días se desliza mientras haya actividad. */
const REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000;
/** Respuestas que significan "sesión inválida". Cualquier otra (5xx, red, API dormida) conserva la sesión. */
const SESSION_REJECTED_STATUS = new Set([401, 403]);

function notifyAuthChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_STATE_EVENT));
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() ?? null;
  }
  return null;
}

const RETURN_PATH_KEY = "sotano_return_to";

export const authService = {
  /** Guarda la ruta actual para volver a ella después de iniciar sesión. */
  rememberReturnPath(path: string): void {
    if (!path || path.startsWith("/login") || path.startsWith("/register")) return;
    try {
      sessionStorage.setItem(RETURN_PATH_KEY, path);
    } catch {
      // almacenamiento bloqueado
    }
  },

  /** Devuelve (y olvida) la ruta guardada, o el catálogo por defecto. */
  takeReturnPath(fallback = "/catalogo"): string {
    try {
      const path = sessionStorage.getItem(RETURN_PATH_KEY);
      sessionStorage.removeItem(RETURN_PATH_KEY);
      return path && path.startsWith("/") && !path.startsWith("//") ? path : fallback;
    } catch {
      return fallback;
    }
  },

  saveSession(user: AuthUser, token?: string): void {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        localStorage.setItem(REFRESHED_AT_KEY, String(Date.now()));
      }
      notifyAuthChange();
    } catch {
      // Ignorar si el almacenamiento está bloqueado
    }
  },

  getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY) || getCookie("access_token");
  },

  getStoredUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try {
      const rawUser = localStorage.getItem(USER_STORAGE_KEY);
      if (!rawUser) return null;
      const parsed: unknown = JSON.parse(rawUser);
      return parsed && typeof parsed === "object" ? (parsed as AuthUser) : null;
    } catch {
      return null;
    }
  },

  hasSessionHint(): boolean {
    return Boolean(this.getStoredUser() || this.getStoredToken());
  },

  isAdmin(): boolean {
    return this.getStoredUser()?.role === "admin";
  },

  logout(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REFRESHED_AT_KEY);
    } catch {
      // Ignorar errores de almacenamiento
    }
    notifyAuthChange();
  },

  async logoutRemote(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Continuar limpiando sesión local incluso si la red falla
    } finally {
      this.logout();
    }
  },

  async login(payload: LoginPayload): Promise<AuthResponse & { token?: string }> {
    const authData = await requestJson<AuthResponse & { token?: string }>("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: payload.email.trim(),
        password: payload.password,
      }),
      fallbackError: "Credenciales incorrectas o error en la autenticación.",
    });

    if (!authData?.user) {
      throw new Error("Respuesta inválida del servidor al iniciar sesión.");
    }

    this.saveSession(authData.user, authData.token);
    return authData;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse & { token?: string }> {
    const authData = await requestJson<AuthResponse & { token?: string }>("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name.trim(),
        email: payload.email.trim(),
        password: payload.password,
      }),
      fallbackError: "No se pudo completar el registro.",
    });

    if (!authData?.user) {
      throw new Error("Respuesta inválida del servidor al registrar la cuenta.");
    }

    this.saveSession(authData.user, authData.token);
    return authData;
  },

  async forgotPassword(email: string): Promise<MessageResponse> {
    const data = await requestJson<MessageResponse>("/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
      fallbackError: "No se pudo enviar el código de verificación.",
    });

    if (!data?.message) {
      throw new Error("Respuesta inválida del servidor.");
    }

    return data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
    const data = await requestJson<MessageResponse>("/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: payload.email.trim(),
        code: payload.code.trim(),
        newPassword: payload.newPassword,
      }),
      fallbackError: "El código ingresado es incorrecto o ha expirado.",
    });

    if (!data?.message) {
      throw new Error("Respuesta inválida del servidor al restablecer la contraseña.");
    }

    return data;
  },

  authHeaders(): Record<string, string> {
    const token = this.getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  /**
   * Verifica la sesión con la API.
   * Solo cierra sesión si la API responde 401/403; ante caídas de red o errores 5xx
   * (p. ej. Render despertando) mantiene la sesión guardada para no desloguear al usuario.
   */
  async checkSession(): Promise<CheckSessionResponse> {
    const stored = this.getStoredUser();
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/check`, {
        method: "GET",
        headers: this.authHeaders(),
        credentials: "include",
      });
    } catch {
      return { authenticated: Boolean(stored), user: stored };
    }

    if (SESSION_REJECTED_STATUS.has(res.status)) {
      this.expireSession();
      return { authenticated: false, user: null };
    }
    if (!res.ok) {
      return { authenticated: Boolean(stored), user: stored };
    }

    const rawBody: unknown = await res.json().catch(() => null);
    const data = unwrapApiData<CheckSessionResponse>(rawBody);
    if (!data || !data.authenticated || !data.user) {
      this.logout();
      return { authenticated: false, user: null };
    }

    this.saveSession(data.user);
    void this.refreshIfStale();
    return { authenticated: true, user: data.user };
  },

  /** Pide un token nuevo si el actual se emitió hace más de 12 h. */
  async refreshIfStale(force = false): Promise<void> {
    if (!this.hasSessionHint()) return;
    let last = 0;
    try {
      last = Number(localStorage.getItem(REFRESHED_AT_KEY) ?? 0);
    } catch {
      // almacenamiento bloqueado: se intenta igual
    }
    if (!force && Date.now() - last < REFRESH_INTERVAL_MS) return;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...this.authHeaders() },
        credentials: "include",
      });
      if (SESSION_REJECTED_STATUS.has(res.status)) {
        this.expireSession();
        return;
      }
      if (!res.ok) return;
      const data = unwrapApiData<AuthResponse & { token?: string }>(
        await res.json().catch(() => null),
      );
      if (data?.user) this.saveSession(data.user, data.token);
    } catch {
      // Sin red: se reintenta en la próxima visita o al volver a la pestaña
    }
  },

  /** La API rechazó la sesión: limpia y avisa a la UI para mostrar el popup. */
  expireSession(): void {
    const hadSession = this.hasSessionHint();
    this.logout();
    if (hadSession && typeof window !== "undefined") {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
  },

  extractErrorMessage,
};
