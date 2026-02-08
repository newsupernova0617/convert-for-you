import { Module } from '@nestjs/common';
import { ConversionController } from './conversion.controller';
import { ConversionService } from './conversion.service';
import { ConversionProcessor } from './conversion.processor';

@Module({
  controllers: [ConversionController],
  providers: [ConversionService, ConversionProcessor]
})
export class ConversionModule {}
