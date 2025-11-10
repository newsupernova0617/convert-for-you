import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface ConversionJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  targetFormat: string;
  originalName: string;
  errorMessage?: string;
}

interface CreateJobPayload {
  targetFormat: string;
  files: File[];
}

async function createConversionJob({ targetFormat, files }: CreateJobPayload) {
  const formData = new FormData();
  formData.append('targetFormat', targetFormat);
  files.forEach((file) => formData.append('files', file));

  const response = await axios.post<ConversionJob>('/api/jobs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return response.data;
}

export function useConversion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createConversionJob,
    onSuccess: (job) => {
      queryClient.setQueryData<ConversionJob[]>(['jobs'], (existing = []) => [job, ...existing].slice(0, 10));
    }
  });
}

export async function getJobStatus(id: string) {
  const response = await axios.get<ConversionJob>(`/api/jobs/${id}`);
  return response.data;
}
