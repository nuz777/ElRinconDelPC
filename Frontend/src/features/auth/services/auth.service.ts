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
export const AUTH_STATE_EVENT = "sotano-auth-change";

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

export const authService = {
  saveSession(user: AuthUser, token?: string): void {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
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

  async checkSession(): Promise<CheckSessionResponse> {
    const token = this.getStoredToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/check`, {
        method: "GET",
        headers,
        credentials: "include",
      });
    } catch {
      const stored = this.getStoredUser();
      return { authenticated: Boolean(stored), user: stored };
    }

    if (!res.ok) {
      this.logout();
      return { authenticated: false, user: null };
    }

    const rawBody: unknown = await res.json().catch(() => null);
    const data = unwrapApiData<CheckSessionResponse>(rawBody);
    if (!data || !data.authenticated || !data.user) {
      this.logout();
      return { authenticated: false, user: null };
    }

    this.saveSession(data.user, token ?? undefined);
    return { authenticated: true, user: data.user };
  },

  extractErrorMessage,
};
