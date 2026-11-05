import { Module } from '@nestjs/common';
import { AuthModule } from '../Auth/Infraestructure/auth.module.js';
import { ModsModule } from '../Mods/mods.module.js';
import { GAMES_REPOSITORY } from './Domain/interfaces/game.repository.interface.js';
import { TypeormGameRepository } from './Infraestructure/repositories/game.typeorm-repository.js';
import { GamesController } from './Infraestructure/controllers/games.controller.js';
import { GamesService } from './Application/Services/games.service.js';

@Module({
  imports: [AuthModule, ModsModule],
  controllers: [GamesController],
  providers: [
    GamesService,
    TypeormGameRepository,
    { provide: GAMES_REPOSITORY, useExisting: TypeormGameRepository },
  ],
  exports: [GamesService],
})
export class GamesModule {}
