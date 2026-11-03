export type AuthProvider = 'local' | 'google' | 'github';

export interface UserProps {
  id: string;
  email: string;
  provider?: AuthProvider;
  passwordHash?: string;
  providerId?: string;
  name?: string;
  picture?: string;
  createdAt?: Date;
}

export class User {
  public readonly id: string;
  public email: string;
  public provider: AuthProvider;
  public passwordHash?: string;
  public providerId?: string;
  public name?: string;
  public picture?: string;
  public readonly createdAt: Date;

  constructor(
    idOrProps: string | UserProps,
    nameOrEmail?: string,
    emailOrHash?: string,
    passwordHash?: string,
    provider: AuthProvider = 'local',
    providerId?: string,
    picture?: string,
    createdAt: Date = new Date(),
  ) {
    if (typeof idOrProps === 'object') {
      this.id = idOrProps.id;
      this.email = idOrProps.email;
      this.provider = idOrProps.provider ?? 'local';
      this.passwordHash = idOrProps.passwordHash;
      this.providerId = idOrProps.providerId;
      this.name = idOrProps.name;
      this.picture = idOrProps.picture;
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
      this.providerId = providerId;
      this.picture = picture;
      this.createdAt = createdAt;
    }
  }
}
