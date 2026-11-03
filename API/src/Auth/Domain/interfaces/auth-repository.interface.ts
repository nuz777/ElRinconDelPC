import type { AuthProvider, User } from '../Entities/user.entity.js';

export interface CreateUserData {
  email: string;
  provider: AuthProvider;
  name?: string;
  passwordHash?: string;
  providerId?: string;
  picture?: string;
}

export interface AuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findByProviderId(provider: AuthProvider, providerId: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User | null>;
}

/** Token de inyección para vincular la interfaz con su implementación concreta. */
export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');
export const AUTH_REPOSITORY_TOKEN = AUTH_REPOSITORY;
