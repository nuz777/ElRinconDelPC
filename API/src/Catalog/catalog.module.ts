import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesModule } from '../Games/games.module.js';
import { ModsModule } from '../Mods/mods.module.js';
import { ToolsModule } from '../Tools/tools.module.js';
import { CatalogService } from './Application/Services/catalog.service.js';
import { CATALOG_REPOSITORY } from './Domain/interfaces/catalog.repository.interface.js';
import { CatalogItemTypeormEntity } from './Infraestructure/entities/catalog-item.typeorm-entity.js';
import { TypeormCatalogRepository } from './Infraestructure/repositories/typeorm-catalog.repository.js';
import { CatalogController } from './Presentation/catalog.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CatalogItemTypeormEntity]),
    forwardRef(() => GamesModule),
    forwardRef(() => ModsModule),
    forwardRef(() => ToolsModule),
  ],
  controllers: [CatalogController],
  providers: [
    CatalogService,
    TypeormCatalogRepository,
    { provide: CATALOG_REPOSITORY, useExisting: TypeormCatalogRepository },
  ],
  exports: [CatalogService, CATALOG_REPOSITORY],
})
export class CatalogModule {}
