import { Module } from '@nestjs/common';
import { AuthModule } from '../Auth/Infraestructure/auth.module.js';
import { ModsController } from './mods.controller.js';
import { ModsService } from './mods.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ModsController],
  providers: [ModsService],
  exports: [ModsService],
})
export class ModsModule {}
