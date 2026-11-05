import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { JwtService as IJwtService, JwtPayload } from '../../Domain/services/jwt-payload.service.js';

@Injectable()
export class JwtServiceAdapter implements IJwtService {
  constructor(private readonly jwtService: NestJwtService) {}

  async signAsync(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }
}
