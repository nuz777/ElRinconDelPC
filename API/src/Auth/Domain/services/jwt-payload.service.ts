export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name?: string;
}

export interface JwtService {
  signAsync(payload: JwtPayload): Promise<string>;
}
