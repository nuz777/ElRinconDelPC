import { Module } from '@nestjs/common';
import { ModsModule } from '../Mods/mods.module.js';
import { GAMES_REPOSITORY } from './Domain/interfaces/game.repository.interface.js';
import { TypeormGameRepository } from './Infraestructure/repositories/game.typeorm-repository.js';
import { GamesController } from './Presentation/games.controller.js';
import { GamesService } from './Application/Services/games.service.js';

@Module({
  imports: [ModsModule],
  controllers: [GamesController],
  providers: [
    GamesService,
    TypeormGameRepository,
    { provide: GAMES_REPOSITORY, useExisting: TypeormGameRepository },
  ],
  exports: [GamesService],
})
export class GamesModule {}
