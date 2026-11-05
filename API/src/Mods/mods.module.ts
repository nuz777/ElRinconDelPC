import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../Auth/Infraestructure/auth.module.js';
import { GameTypeormEntity } from '../Games/Infraestructure/entities/game.typeorm-entity.js';
import { MODS_REPOSITORY } from './Domain/interfaces/mod.repository.interface.js';
import { ModTypeormEntity } from './Infraestructure/entities/mod.typeorm-entity.js';
import { TypeormModRepository } from './Infraestructure/repositories/mod.typeorm-repository.js';
import { ModsController } from './Infraestructure/controllers/mods.controller.js';
import { ModsService } from './Application/Services/mods.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModTypeormEntity, GameTypeormEntity]),
    AuthModule,
  ],
  controllers: [ModsController],
  providers: [
    ModsService,
    TypeormModRepository,
    { provide: MODS_REPOSITORY, useExisting: TypeormModRepository },
  ],
  exports: [ModsService],
})
export class ModsModule {}
