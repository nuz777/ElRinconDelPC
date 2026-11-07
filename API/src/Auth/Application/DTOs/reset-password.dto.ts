import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'usuario@correo.com',
    description: 'Correo electrónico de la cuenta a restablecer',
  })
  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email!: string;

  @ApiProperty({
    example: '482910',
    description: 'Código de verificación de 6 dígitos enviado por correo',
  })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  @Length(6, 6, { message: 'El código debe tener exactamente 6 dígitos' })
  code!: string;

  @ApiProperty({
    example: 'NuevaClaveSegura123!',
    description: 'Nueva contraseña (mínimo 8 caracteres, máximo 72)',
  })
  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
  @MinLength(8, {
    message: 'La nueva contraseña debe tener al menos 8 caracteres',
  })
  @MaxLength(72, { message: 'La contraseña no puede superar 72 caracteres' })
  newPassword!: string;
}
