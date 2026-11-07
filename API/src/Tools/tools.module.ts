import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolTypeormEntity } from './Infraestructure/entities/tool.typeorm-entity.js';
import { TOOLS_REPOSITORY } from './Domain/interfaces/tool.repository.interface.js';
import { TypeormToolRepository } from './Infraestructure/repositories/tool.typeorm-repository.js';
import { ToolsController } from './Presentation/tools.controller.js';
import { ToolsService } from './Application/Services/tools.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ToolTypeormEntity])],
  controllers: [ToolsController],
  providers: [
    ToolsService,
    TypeormToolRepository,
    { provide: TOOLS_REPOSITORY, useExisting: TypeormToolRepository },
  ],
  exports: [ToolsService],
})
export class ToolsModule {}
