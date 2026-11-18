import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExeIoService } from './exe-io.service.js';
import { ShortenerController } from './shortener.controller.js';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [ShortenerController],
  providers: [ExeIoService],
  exports: [ExeIoService],
})
export class ShortenerModule {}
