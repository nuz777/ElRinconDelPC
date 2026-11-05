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

export interface ApiStandardResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
  path: string;
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

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const USER_STORAGE_KEY = "sotano_user";
export const AUTH_STATE_EVENT = "sotano-auth-change";

function notifyAuthChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_STATE_EVENT));
  }
}

function unwrapApiData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if ("data" in record && record.data && typeof record.data === "object") {
    return record.data as T;
  }
  return payload as T;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const record = payload as Record<string, unknown>;
  const message = record.message;
  if (Array.isArray(message)) {
    return message.join(", ");
  }
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }
  return fallback;
}

export interface DecodedJwtPayload {
  sub?: string;
  email?: string;
  role?: UserRole;
  exp?: number;
}

function decodeJwtPayload(token: string): DecodedJwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const parsed: unknown = JSON.parse(jsonPayload);
    if (parsed && typeof parsed === "object") {
      return parsed as DecodedJwtPayload;
    }
    return null;
  } catch {
    return null;
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
  decodeToken(token: string): DecodedJwtPayload | null {
    return decodeJwtPayload(token);
  },

  saveSession(user: AuthUser): void {
    try {
      // Guardamos solo datos del usuario (no sensibles) en localStorage.
      // El JWT viaja exclusivamente en cookie HTTP-only (inaccesible desde JS).
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      notifyAuthChange();
    } catch {
      // Ignorar si el almacenamiento está bloqueado
    }
  },

  getStoredToken(): string | null {
    // No se puede leer una cookie httpOnly desde JavaScript.
    // El navegador la envía automáticamente en cada petición con credentials: 'include'.
    return getCookie("access_token");
  },

  getStoredUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try {
      const rawUser = localStorage.getItem(USER_STORAGE_KEY);
      if (!rawUser) return null;

      const parsed: unknown = JSON.parse(rawUser);
      if (parsed && typeof parsed === "object") {
        return parsed as AuthUser;
      }
      return null;
    } catch {
      return null;
    }
  },

  isAdmin(): boolean {
    const user = this.getStoredUser();
    return user?.role === "admin";
  },

  logout(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // Ignorar errores de almacenamiento
    }
    notifyAuthChange();
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Requerido para enviar/recibir cookies
        body: JSON.stringify({
          email: payload.email.trim(),
          password: payload.password,
        }),
      });
    } catch {
      throw new Error(
        "No se pudo conectar con el servidor. Verifica que la API esté encendida.",
      );
    }

    const rawBody: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        extractErrorMessage(
          rawBody,
          "Credenciales incorrectas o error en la autenticación.",
        ),
      );
    }

    const authData = unwrapApiData<AuthResponse>(rawBody);
    if (!authData?.user) {
      throw new Error("Respuesta inválida del servidor al iniciar sesión.");
    }

    this.saveSession(authData.user);
    return authData;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Requerido para enviar/recibir cookies
        body: JSON.stringify({
          name: payload.name.trim(),
          email: payload.email.trim(),
          password: payload.password,
        }),
      });
    } catch {
      throw new Error(
        "No se pudo conectar con el servidor. Verifica que la API esté encendida.",
      );
    }

    const rawBody: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        extractErrorMessage(rawBody, "No se pudo completar el registro."),
      );
    }

    const authData = unwrapApiData<AuthResponse>(rawBody);
    if (!authData?.user) {
      throw new Error(
        "Respuesta inválida del servidor al registrar la cuenta.",
      );
    }

    this.saveSession(authData.user);
    return authData;
  },

  async forgotPassword(email: string): Promise<MessageResponse> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      throw new Error(
        "No se pudo conectar con el servidor. Verifica que la API esté encendida.",
      );
    }

    const rawBody: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        extractErrorMessage(
          rawBody,
          "No se pudo enviar el código de verificación.",
        ),
      );
    }

    const data = unwrapApiData<MessageResponse>(rawBody);
    if (!data?.message) {
      throw new Error("Respuesta inválida del servidor.");
    }

    return data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: payload.email.trim(),
          code: payload.code.trim(),
          newPassword: payload.newPassword,
        }),
      });
    } catch {
      throw new Error(
        "No se pudo conectar con el servidor. Verifica que la API esté encendida.",
      );
    }

    const rawBody: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        extractErrorMessage(
          rawBody,
          "El código ingresado es incorrecto o ha expirado.",
        ),
      );
    }

    const data = unwrapApiData<MessageResponse>(rawBody);
    if (!data?.message) {
      throw new Error("Respuesta inválida del servidor al restablecer la contraseña.");
    }

    return data;
  },

  async checkAdminAccess(): Promise<{ message: string; user: unknown }> {
    const res = await fetch(`${API_BASE_URL}/auth/admin/only`, {
      method: "GET",
      credentials: "include", // La cookie se envía automáticamente
    });

    const rawBody: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        extractErrorMessage(
          rawBody,
          "No tienes permisos para acceder a este recurso.",
        ),
      );
    }

    const data = unwrapApiData<{ message: string; user: unknown }>(rawBody);
    return data ?? { message: "Acceso concedido", user: null };
  },

  async publishCatalogItem(
    endpoint: "games" | "mods" | "tools",
    payload: Record<string, unknown>,
  ): Promise<unknown> {
    if (!this.isAdmin()) {
      throw new Error("Permisos insuficientes");
    }

    const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // La cookie JWT se envía automáticamente
      body: JSON.stringify(payload),
    });

    const rawBody: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(extractErrorMessage(rawBody, "Permisos insuficientes"));
    }

    return unwrapApiData(rawBody);
  },

  async checkSession(): Promise<CheckSessionResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/check`, {
      method: "GET",
      credentials: "include", // La cookie JWT HTTP-only se envía automáticamente
    });

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

    // Guardamos los datos del usuario en localStorage para acceso rápido
    this.saveSession(data.user);

    return {
      authenticated: true,
      user: data.user,
    };
  },
};
