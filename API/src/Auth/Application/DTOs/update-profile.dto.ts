import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { ALLOWED_PROFILE_AVATARS } from '../../Domain/constants/profile-avatars.js';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Nuz',
    description: 'Nombre visible del usuario',
  })
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres' })
  name?: string;

  @ApiPropertyOptional({
    example: '/hero/yui.png',
    description: 'Ruta de la foto de perfil (debe ser una opción predefinida)',
    enum: [...ALLOWED_PROFILE_AVATARS],
  })
  @IsOptional()
  @IsString()
  @IsIn([...ALLOWED_PROFILE_AVATARS], {
    message: 'La foto de perfil seleccionada no es válida',
  })
  picture?: string;
}
