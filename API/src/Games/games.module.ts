import { Module } from '@nestjs/common';
import { AuthModule } from '../Auth/Infraestructure/auth.module.js';
import { GamesController } from './games.controller.js';
import { GamesService } from './games.service.js';

@Module({
  imports: [AuthModule],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
