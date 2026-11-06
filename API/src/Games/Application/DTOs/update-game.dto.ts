import { PartialType } from '@nestjs/swagger';
import { CreateGameDto } from './create-game.dto.js';

/** DTO para actualización parcial. Todos los campos son opcionales. */
export class UpdateGameDto extends PartialType(CreateGameDto) {}
