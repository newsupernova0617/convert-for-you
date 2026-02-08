import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConversionJob } from './entities/conversion-job.entity';
import { MemoryQueue } from '../common/memory-queue';

@Injectable()
export class ConversionService {
  private readonly queue = new MemoryQueue<ConversionJob>();
  private readonly jobs = new Map<string, ConversionJob>();

  async queueJob({ files, targetFormat }: { files: Express.Multer.File[]; targetFormat: string }) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    const id = randomUUID();

    const job: ConversionJob = {
      id,
      targetFormat,
      originalName: files.length === 1 ? files[0].originalname : `${files[0].originalname}-and-${files.length - 1}-more`,
      status: 'queued',
      createdAt: new Date(),
      downloadUrl: undefined
    };

    this.jobs.set(id, job);
    await this.queue.push(job);

    return job;
  }

  async getJob(id: string) {
    const job = this.jobs.get(id);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async processNextJob() {
    const job = await this.queue.pop();

    if (!job) {
      return;
    }

    job.status = 'processing';
    this.jobs.set(job.id, job);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      job.status = 'completed';
      job.downloadUrl = `https://example.com/download/${job.id}.${job.targetFormat}`;
      this.jobs.set(job.id, job);
    } catch (error) {
      job.status = 'failed';
      job.errorMessage = (error as Error).message;
      this.jobs.set(job.id, job);
    }
  }
}
