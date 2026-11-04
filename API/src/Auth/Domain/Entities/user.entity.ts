import type { Role } from './roles.enum.js';

export type AuthProvider = 'local' | 'system';

export interface UserProps {
  id: string;
  email: string;
  provider?: AuthProvider;
  passwordHash?: string;
  name?: string;
  picture?: string;
  role?: Role;
  resetToken?: string | null;
  resetTokenExpires?: Date | null;
  createdAt?: Date;
}

const DEFAULT_ROLE = 'user' as Role;

export class User {
  public readonly id: string;
  public email: string;
  public provider: AuthProvider;
  public passwordHash?: string;
  public name?: string;
  public picture?: string;
  public role: Role;
  public resetToken?: string | null;
  public resetTokenExpires?: Date | null;
  public readonly createdAt: Date;

  constructor(
    idOrProps: string | UserProps,
    nameOrEmail?: string,
    emailOrHash?: string,
    passwordHash?: string,
    provider: AuthProvider = 'local',
    picture?: string,
    createdAt: Date = new Date(),
    role: Role = DEFAULT_ROLE,
  ) {
    if (typeof idOrProps === 'object') {
      this.id = idOrProps.id;
      this.email = idOrProps.email;
      this.provider = idOrProps.provider ?? 'local';
      this.passwordHash = idOrProps.passwordHash;
      this.name = idOrProps.name;
      this.picture = idOrProps.picture;
      this.role = idOrProps.role ?? DEFAULT_ROLE;
      this.resetToken = idOrProps.resetToken ?? null;
      this.resetTokenExpires = idOrProps.resetTokenExpires ?? null;
      this.createdAt = idOrProps.createdAt ?? new Date();
    } else {
      this.id = idOrProps;
      if (emailOrHash && emailOrHash.includes('@')) {
        this.name = nameOrEmail;
        this.email = emailOrHash;
        this.passwordHash = passwordHash;
        this.provider = provider;
      } else {
        this.email = nameOrEmail ?? '';
        this.passwordHash = emailOrHash;
        this.provider = provider;
      }
      this.picture = picture;
      this.role = role;
      this.resetToken = null;
      this.resetTokenExpires = null;
      this.createdAt = createdAt;
    }
  }
}
