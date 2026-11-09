import { forwardRef, Module } from '@nestjs/common';
import { CatalogModule } from '../Catalog/catalog.module.js';
import { ModsModule } from '../Mods/mods.module.js';
import { GamesService } from './Application/Services/games.service.js';
import { GAMES_REPOSITORY } from './Domain/interfaces/game.repository.interface.js';
import { TypeormGameRepository } from './Infraestructure/repositories/game.typeorm-repository.js';
import { GamesController } from './Presentation/games.controller.js';

@Module({
  imports: [forwardRef(() => ModsModule), forwardRef(() => CatalogModule)],
  controllers: [GamesController],
  providers: [
    GamesService,
    TypeormGameRepository,
    { provide: GAMES_REPOSITORY, useExisting: TypeormGameRepository },
  ],
  exports: [GamesService, GAMES_REPOSITORY],
})
export class GamesModule {}
