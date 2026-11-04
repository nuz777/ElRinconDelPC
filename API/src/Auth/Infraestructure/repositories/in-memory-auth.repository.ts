import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Role } from '../../Domain/Entities/roles.enum.js';
import { User } from '../../Domain/Entities/user.entity.js';
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

  constructor() {
    this.seedAdmins();
  }

  private seedAdmins(): void {
    const admins: User[] = [
      new User({
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Dozen_Apollo',
        email: 'theunrealultranigg@gmail.com',
        passwordHash:
          '$2b$10$VjkiiKmEqhVFFrfl/6vJIeIDx/apXfieZraPTlbH.wdTxsdCp1.uO',
        provider: 'system',
        role: Role.ADMIN,
        createdAt: new Date(),
      }),
      new User({
        id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        name: 'Ivan Mejia',
        email: 'ivanlun647@gmail.com',
        passwordHash:
          '$2b$10$qDNDuiQ8.Vf4smtlM2D.zeIzC3lEH4zAXUAwZyW3BflCqY5lr7x3C',
        provider: 'system',
        role: Role.ADMIN,
        createdAt: new Date(),
      }),
    ];

    for (const admin of admins) {
      this.users.set(admin.id, admin);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalized) {
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
      name: data.name,
      picture: data.picture,
      role: data.role ?? Role.USER,
      resetToken: null,
      resetTokenExpires: null,
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
    if (data.picture !== undefined) user.picture = data.picture;
    if (data.role !== undefined) user.role = data.role;
    if ('resetToken' in data) user.resetToken = data.resetToken ?? null;
    if ('resetTokenExpires' in data) {
      user.resetTokenExpires = data.resetTokenExpires ?? null;
    }

    this.users.set(id, user);
    return user;
  }
}
