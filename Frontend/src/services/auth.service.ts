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
  accessToken: string;
  user: AuthUser;
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
const TOKEN_STORAGE_KEY = "sotano_token";
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

export const authService = {
  decodeToken(token: string): DecodedJwtPayload | null {
    return decodeJwtPayload(token);
  },

  saveSession(accessToken: string, user?: AuthUser): void {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      const decoded = decodeJwtPayload(accessToken);
      const enrichedUser: AuthUser | undefined = user
        ? {
            ...user,
            id: user.id ?? decoded?.sub,
            email: user.email ?? decoded?.email,
            role: user.role ?? decoded?.role ?? "user",
          }
        : decoded
          ? {
              id: decoded.sub,
              email: decoded.email,
              role: decoded.role ?? "user",
            }
          : undefined;
      if (enrichedUser) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(enrichedUser));
      }
      notifyAuthChange();
    } catch {
      // Ignorar si el almacenamiento está bloqueado
    }
  },

  getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  getStoredUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try {
      const rawToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const rawUser = localStorage.getItem(USER_STORAGE_KEY);
      if (!rawToken && !rawUser) return null;

      const decoded = rawToken ? decodeJwtPayload(rawToken) : null;

      if (rawUser) {
        const parsed: unknown = JSON.parse(rawUser);
        if (parsed && typeof parsed === "object") {
          const storedUser = parsed as AuthUser;
          return {
            ...storedUser,
            id: storedUser.id ?? decoded?.sub,
            email: storedUser.email ?? decoded?.email,
            role: decoded?.role ?? storedUser.role ?? "user",
          };
        }
      }
      if (rawToken) {
        return {
          id: decoded?.sub,
          email: decoded?.email,
          name: decoded?.email?.split("@")[0] ?? "Usuario",
          role: decoded?.role ?? "user",
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  isAdmin(): boolean {
    const user = this.getStoredUser();
    const isAdmin = user?.role === "admin";
    return isAdmin;
  },

  logout(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
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
    if (!authData?.accessToken) {
      throw new Error("Respuesta inválida del servidor al iniciar sesión.");
    }

    this.saveSession(authData.accessToken, authData.user);
    return authData;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    if (!authData?.accessToken) {
      throw new Error("Respuesta inválida del servidor al registrar la cuenta.");
    }

    this.saveSession(authData.accessToken, authData.user);
    return authData;
  },

  async forgotPassword(email: string): Promise<MessageResponse> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    const token = this.getStoredToken();
    if (!token) {
      throw new Error("No hay sesión activa.");
    }

    const res = await fetch(`${API_BASE_URL}/auth/admin/only`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
    const token = this.getStoredToken();
    if (!token || !this.isAdmin()) {
      throw new Error("Permisos insuficientes");
    }

    const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const rawBody: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(extractErrorMessage(rawBody, "Permisos insuficientes"));
    }

    return unwrapApiData(rawBody);
  },
};
