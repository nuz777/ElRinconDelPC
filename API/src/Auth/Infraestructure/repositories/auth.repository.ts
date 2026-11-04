import { Injectable, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from '../../Domain/Entities/roles.enum.js';
import { User, type AuthProvider } from '../../Domain/Entities/user.entity.js';
import type {
  AuthRepository,
  CreateUserData,
} from '../../Domain/interfaces/auth-repository.interface.js';
import { InMemoryAuthRepository } from './in-memory-auth.repository.js';

export { InMemoryAuthRepository } from './in-memory-auth.repository.js';

interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  provider: AuthProvider;
  first_name: string | null;
  last_name: string | null;
  picture: string | null;
  role: Role;
  reset_token: string | null;
  reset_token_expires: Date | string | null;
  created_at: Date | string;
}

@Injectable()
export class PostgresAuthRepository implements AuthRepository {
  constructor(
    private readonly inMemoryRepo: InMemoryAuthRepository,
    @Optional() private readonly dataSource?: DataSource,
  ) {}

  private get isDbReady(): boolean {
    return Boolean(this.dataSource?.isInitialized);
  }

  private splitName(fullName?: string): {
    firstName: string | null;
    lastName: string | null;
  } {
    if (!fullName || !fullName.trim()) {
      return { firstName: null, lastName: null };
    }
    const parts = fullName.trim().split(/\s+/);
    return {
      firstName: parts[0] ?? null,
      lastName: parts.length > 1 ? parts.slice(1).join(' ') : null,
    };
  }

  private mapRowToUser(row: UserRow): User {
    const fullName = [row.first_name, row.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    return new User({
      id: row.id,
      email: row.email,
      provider: row.provider,
      passwordHash: row.password_hash ?? undefined,
      name: fullName || undefined,
      picture: row.picture ?? undefined,
      role: row.role ?? Role.USER,
      resetToken: row.reset_token ?? null,
      resetTokenExpires: row.reset_token_expires
        ? row.reset_token_expires instanceof Date
          ? row.reset_token_expires
          : new Date(row.reset_token_expires)
        : null,
      createdAt:
        row.created_at instanceof Date
          ? row.created_at
          : new Date(row.created_at),
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!this.isDbReady || !this.dataSource) {
      return this.inMemoryRepo.findByEmail(email);
    }

    const rows = await this.dataSource.query<UserRow[]>(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email.trim()],
    );
    return rows[0] ? this.mapRowToUser(rows[0]) : null;
  }

  async findById(id: string): Promise<User | null> {
    if (!this.isDbReady || !this.dataSource) {
      return this.inMemoryRepo.findById(id);
    }

    const rows = await this.dataSource.query<UserRow[]>(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );
    return rows[0] ? this.mapRowToUser(rows[0]) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    if (!this.isDbReady || !this.dataSource) {
      return this.inMemoryRepo.create(data);
    }

    const { firstName, lastName } = this.splitName(data.name);
    const role = data.role ?? Role.USER;

    const rows = await this.dataSource.query<UserRow[]>(
      `
      INSERT INTO users (email, password_hash, provider, first_name, last_name, picture, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
      `,
      [
        data.email.trim().toLowerCase(),
        data.passwordHash ?? null,
        data.provider,
        firstName,
        lastName,
        data.picture ?? null,
        role,
      ],
    );

    return this.mapRowToUser(rows[0]);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    if (!this.isDbReady || !this.dataSource) {
      return this.inMemoryRepo.update(id, data);
    }

    const existing = await this.findById(id);
    if (!existing) return null;

    const updatedName = data.name !== undefined ? data.name : existing.name;
    const { firstName, lastName } = this.splitName(updatedName);

    const resetToken =
      'resetToken' in data ? (data.resetToken ?? null) : (existing.resetToken ?? null);
    const resetTokenExpires =
      'resetTokenExpires' in data
        ? (data.resetTokenExpires ?? null)
        : (existing.resetTokenExpires ?? null);

    const rows = await this.dataSource.query<UserRow[]>(
      `
      UPDATE users
      SET email = $1,
          password_hash = $2,
          provider = $3,
          first_name = $4,
          last_name = $5,
          picture = $6,
          role = $7,
          reset_token = $8,
          reset_token_expires = $9,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *;
      `,
      [
        (data.email ?? existing.email).trim().toLowerCase(),
        data.passwordHash !== undefined
          ? data.passwordHash
          : (existing.passwordHash ?? null),
        data.provider ?? existing.provider,
        firstName,
        lastName,
        data.picture !== undefined ? data.picture : (existing.picture ?? null),
        data.role ?? existing.role ?? Role.USER,
        resetToken,
        resetTokenExpires,
        id,
      ],
    );

    return rows[0] ? this.mapRowToUser(rows[0]) : null;
  }
}
