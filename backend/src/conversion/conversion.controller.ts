import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ConversionService } from './conversion.service';
import { CreateJobDto } from './dto/create-job.dto';

@Controller('jobs')
export class ConversionController {
  constructor(private readonly conversionService: ConversionService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'files', maxCount: 10 }
    ])
  )
  createJob(@UploadedFiles() files: { files?: Express.Multer.File[] }, @Body() body: CreateJobDto) {
    return this.conversionService.queueJob({
      files: files.files ?? [],
      targetFormat: body.targetFormat
    });
  }

  @Get(':id')
  getJob(@Param('id') id: string) {
    return this.conversionService.getJob(id);
  }
}
