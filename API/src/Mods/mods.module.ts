import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../Catalog/catalog.module.js';
import { GameTypeormEntity } from '../Games/Infraestructure/entities/game.typeorm-entity.js';
import { ModsService } from './Application/Services/mods.service.js';
import { MODS_REPOSITORY } from './Domain/interfaces/mod.repository.interface.js';
import { ModTypeormEntity } from './Infraestructure/entities/mod.typeorm-entity.js';
import { TypeormModRepository } from './Infraestructure/repositories/mod.typeorm-repository.js';
import { ModsController } from './Presentation/mods.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModTypeormEntity, GameTypeormEntity]),
    forwardRef(() => CatalogModule),
  ],
  controllers: [ModsController],
  providers: [
    ModsService,
    TypeormModRepository,
    { provide: MODS_REPOSITORY, useExisting: TypeormModRepository },
  ],
  exports: [ModsService, MODS_REPOSITORY],
})
export class ModsModule {}
