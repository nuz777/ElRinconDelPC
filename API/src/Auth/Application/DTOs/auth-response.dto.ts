import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../Domain/Entities/roles.enum.js';

export class AuthUserDto {
  @ApiProperty({ example: '0b8f4c1e-6a2d-4b7e-9c3a-1f2e3d4c5b6a' })
  id!: string;

  @ApiProperty({ example: 'Nuz', required: false })
  name?: string;

  @ApiProperty({ example: 'nuz@correo.com' })
  email!: string;

  @ApiProperty({
    example: 'local',
    enum: ['local', 'system'],
    required: false,
  })
  provider?: string;

  @ApiProperty({
    example: Role.USER,
    enum: Role,
    required: false,
  })
  role?: Role;

  @ApiProperty({
    example: 'https://avatars.githubusercontent.com/u/12345',
    required: false,
  })
  picture?: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
