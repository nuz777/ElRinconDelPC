import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../Auth/auth.module.js';
import { CatalogService } from './Application/Services/catalog.service.js';
import { CATALOG_REPOSITORY } from './Domain/interfaces/catalog.repository.interface.js';
import { CatalogItemTypeormEntity } from './Infraestructure/entities/catalog-item.typeorm-entity.js';
import { TypeormCatalogRepository } from './Infraestructure/repositories/typeorm-catalog.repository.js';
import { CatalogController } from './Presentation/catalog.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([CatalogItemTypeormEntity]), AuthModule],
  controllers: [CatalogController],
  providers: [
    CatalogService,
    TypeormCatalogRepository,
    { provide: CATALOG_REPOSITORY, useExisting: TypeormCatalogRepository },
  ],
  exports: [CatalogService],
})
export class CatalogModule {}
