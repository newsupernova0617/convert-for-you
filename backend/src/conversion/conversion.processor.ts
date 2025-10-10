import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConversionService } from './conversion.service';

@Injectable()
export class ConversionProcessor implements OnModuleInit {
  private readonly logger = new Logger(ConversionProcessor.name);

  constructor(private readonly conversionService: ConversionService) {}

  onModuleInit() {
    setInterval(async () => {
      try {
        await this.conversionService.processNextJob();
      } catch (error) {
        const err = error as Error;
        this.logger.error(err.message, err.stack);
      }
    }, 2000);
  }
}
