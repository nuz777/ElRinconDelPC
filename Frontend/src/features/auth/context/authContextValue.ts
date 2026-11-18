import { createContext } from "react";
import type { AuthUser } from "../services/auth.service";

export interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
