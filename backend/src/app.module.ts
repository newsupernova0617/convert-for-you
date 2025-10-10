import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConversionModule } from './conversion/conversion.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ConversionModule
  ]
})
export class AppModule {}
