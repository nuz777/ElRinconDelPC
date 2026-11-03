import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { User, type AuthProvider } from '../../Domain/Entities/user.entity.js';
import type {
  AuthRepository,
  CreateUserData,
} from '../../Domain/interfaces/auth-repository.interface.js';

/**
 * Implementación en memoria del repositorio de autenticación.
 * Almacena los usuarios temporalmente en un mapa mientras se conecta una base de datos persistente.
 */
@Injectable()
export class InMemoryAuthRepository implements AuthRepository {
  private readonly users = new Map<string, User>();

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalized) {
        return user;
      }
    }
    return null;
  }

  async findByProviderId(
    provider: AuthProvider,
    providerId: string,
  ): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.provider === provider && user.providerId === providerId) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async create(data: CreateUserData): Promise<User> {
    const id = randomUUID();
    const user = new User({
      id,
      email: data.email.trim().toLowerCase(),
      provider: data.provider,
      passwordHash: data.passwordHash,
      providerId: data.providerId,
      name: data.name,
      picture: data.picture,
      createdAt: new Date(),
    });

    this.users.set(id, user);
    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    if (data.email !== undefined) user.email = data.email.trim().toLowerCase();
    if (data.name !== undefined) user.name = data.name;
    if (data.passwordHash !== undefined) user.passwordHash = data.passwordHash;
    if (data.provider !== undefined) user.provider = data.provider;
    if (data.providerId !== undefined) user.providerId = data.providerId;
    if (data.picture !== undefined) user.picture = data.picture;

    this.users.set(id, user);
    return user;
  }
}
