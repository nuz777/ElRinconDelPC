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
      `SELECT * FROM users WHERE email = $1 LIMIT 1`,
      [email.trim().toLowerCase()],
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

    const sets: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const addSet = (column: string, value: unknown) => {
      sets.push(`${column} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    };

    if (data.email !== undefined) {
      addSet('email', data.email.trim().toLowerCase());
    }
    if ('passwordHash' in data) {
      addSet('password_hash', data.passwordHash ?? null);
    }
    if (data.provider !== undefined) {
      addSet('provider', data.provider);
    }
    if (data.name !== undefined) {
      const { firstName, lastName } = this.splitName(data.name);
      addSet('first_name', firstName);
      addSet('last_name', lastName);
    }
    if ('picture' in data) {
      addSet('picture', data.picture ?? null);
    }
    if (data.role !== undefined) {
      addSet('role', data.role);
    }
    if ('resetToken' in data) {
      addSet('reset_token', data.resetToken ?? null);
    }
    if ('resetTokenExpires' in data) {
      addSet('reset_token_expires', data.resetTokenExpires ?? null);
    }

    if (sets.length === 0) {
      return this.findById(id);
    }

    sets.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const rows = await this.dataSource.query<UserRow[]>(
      `
      UPDATE users
      SET ${sets.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
      `,
      params,
    );

    return rows[0] ? this.mapRowToUser(rows[0]) : null;
  }
}
