export type ConversionStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface ConversionJob {
  id: string;
  targetFormat: string;
  originalName: string;
  status: ConversionStatus;
  createdAt: Date;
  downloadUrl?: string;
  errorMessage?: string;
}
