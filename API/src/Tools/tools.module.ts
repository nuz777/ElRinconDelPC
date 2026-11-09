import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../Catalog/catalog.module.js';
import { ToolsService } from './Application/Services/tools.service.js';
import { TOOLS_REPOSITORY } from './Domain/interfaces/tool.repository.interface.js';
import { ToolTypeormEntity } from './Infraestructure/entities/tool.typeorm-entity.js';
import { TypeormToolRepository } from './Infraestructure/repositories/tool.typeorm-repository.js';
import { ToolsController } from './Presentation/tools.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ToolTypeormEntity]),
    forwardRef(() => CatalogModule),
  ],
  controllers: [ToolsController],
  providers: [
    ToolsService,
    TypeormToolRepository,
    { provide: TOOLS_REPOSITORY, useExisting: TypeormToolRepository },
  ],
  exports: [ToolsService, TOOLS_REPOSITORY],
})
export class ToolsModule {}
