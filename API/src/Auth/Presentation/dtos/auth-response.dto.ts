import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: '0b8f4c1e-6a2d-4b7e-9c3a-1f2e3d4c5b6a' })
  id!: string;

  @ApiProperty({ example: 'Nuz', required: false })
  name?: string;

  @ApiProperty({ example: 'nuz@correo.com' })
  email!: string;

  @ApiProperty({
    example: 'local',
    enum: ['local', 'google', 'github'],
    required: false,
  })
  provider?: string;

  @ApiProperty({
    example: 'https://avatars.githubusercontent.com/u/12345',
    required: false,
  })
  picture?: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Token JWT de acceso (Bearer)' })
  accessToken!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
