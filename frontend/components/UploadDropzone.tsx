import { useCallback, useMemo, useState } from 'react';
import { Accept, useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import clsx from 'clsx';

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
}

const acceptedFormats: Accept = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic']
};

export function UploadDropzone({ onFilesSelected }: UploadDropzoneProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) {
        onFilesSelected(accepted);
      }
    },
    [onFilesSelected]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    onDrop,
    multiple: true,
    accept: acceptedFormats,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false)
  });

  const description = useMemo(
    () =>
      Object.values(acceptedFormats)
        .flat()
        .join(', '),
    []
  );

  return (
    <div
      {...getRootProps({
        className: clsx(
          'flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/30 bg-white/5 px-8 py-16 text-center shadow-xl shadow-black/20 backdrop-blur transition-all',
          isDragActive || isDragging ? 'border-primary-400 bg-primary-500/10' : 'hover:border-white/60 hover:bg-white/10'
        )
      })}
    >
      <input {...getInputProps()} />
      <ArrowUpTrayIcon className="h-12 w-12 text-primary-300" />
      <p className="mt-4 text-xl font-semibold text-white">{t('drop')}</p>
      <p className="mt-2 text-sm text-slate-200">
        {t('or')}{' '}
        <span className="font-medium text-primary-200 underline decoration-dotted decoration-primary-200">
          {t('browse')}
        </span>
      </p>
      <p className="mt-4 max-w-lg text-xs uppercase tracking-wide text-slate-300/80">{description}</p>
    </div>
  );
}
