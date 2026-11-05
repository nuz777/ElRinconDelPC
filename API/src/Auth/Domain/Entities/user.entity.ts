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

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.provider = props.provider ?? 'local';
    this.passwordHash = props.passwordHash;
    this.name = props.name;
    this.picture = props.picture;
    this.role = props.role ?? DEFAULT_ROLE;
    this.resetToken = props.resetToken ?? null;
    this.resetTokenExpires = props.resetTokenExpires ?? null;
    this.createdAt = props.createdAt ?? new Date();
  }
}
