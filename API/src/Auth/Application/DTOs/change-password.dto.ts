import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'MiClaveActual123',
    description: 'Contraseña actual',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria' })
  currentPassword!: string;

  @ApiProperty({
    example: 'MiNuevaClaveSegura123',
    description: 'Nueva contraseña (mínimo 8 caracteres, máximo 72)',
  })
  @IsString()
  @MinLength(8, {
    message: 'La nueva contraseña debe tener al menos 8 caracteres',
  })
  @MaxLength(72, {
    message: 'La nueva contraseña no puede superar 72 caracteres',
  })
  newPassword!: string;
}
