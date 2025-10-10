import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Layout } from '../components/Layout';
import { UploadDropzone } from '../components/UploadDropzone';
import { ConversionGrid } from '../components/ConversionGrid';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useConversion, ConversionJob, getJobStatus } from '../hooks/useConversion';
import clsx from 'clsx';

interface ConversionForm {
  targetFormat: string;
}

const targetFormats = [
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'Word (.docx)' },
  { value: 'pptx', label: 'PowerPoint (.pptx)' },
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'png', label: 'Image (.png)' },
  { value: 'txt', label: 'Plain Text (.txt)' }
];

export default function HomePage() {
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const conversion = useConversion();
  const { register, handleSubmit } = useForm<ConversionForm>({ defaultValues: { targetFormat: 'pdf' } });

  const onSubmit = handleSubmit(async ({ targetFormat }) => {
    if (selectedFiles.length === 0) {
      return;
    }

    const job = await conversion.mutateAsync({ targetFormat, files: selectedFiles });
    setJobs((prev) => [job, ...prev].slice(0, 6));
    setSelectedFiles([]);
  });

  useEffect(() => {
    const activeJobs = jobs.filter((job) => job.status === 'queued' || job.status === 'processing');

    if (activeJobs.length === 0) {
      return;
    }

    const interval = setInterval(async () => {
      const updates = await Promise.all(
        activeJobs.map(async (job) => {
          try {
            return await getJobStatus(job.id);
          } catch (error) {
            console.error('Failed to refresh job', error);
            return job;
          }
        })
      );

      setJobs((prev) =>
        prev.map((job) => updates.find((updated) => updated.id === job.id) ?? job)
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [jobs]);

  return (
    <Layout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.15),_rgba(15,23,42,0.95))]" />
        <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-20">
          <div className="flex flex-col gap-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{t('tagline')}</h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-200">{t('description')}</p>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 shadow shadow-black/20">
              {t('queueNotice')}
            </div>
          </div>
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-6">
              <UploadDropzone onFilesSelected={(files) => setSelectedFiles(files)} />
              {selectedFiles.length > 0 && (
                <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-4 text-left text-sm text-slate-200">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Pending files</h2>
                  <ul className="mt-3 space-y-1">
                    {selectedFiles.map((file) => (
                      <li key={file.name} className="flex items-center justify-between">
                        <span className="truncate pr-3">{file.name}</span>
                        <span className="text-xs text-slate-400">{Math.round(file.size / 1024)} KB</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <form
                onSubmit={onSubmit}
                className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20"
              >
                <label className="text-sm font-medium text-slate-100" htmlFor="targetFormat">
                  {t('selectTarget')}
                </label>
                <select
                  id="targetFormat"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white focus:border-primary-400 focus:outline-none"
                  {...register('targetFormat')}
                >
                  {targetFormats.map((format) => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={conversion.isLoading || selectedFiles.length === 0}
                  className={clsx(
                    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition',
                    conversion.isLoading || selectedFiles.length === 0
                      ? 'cursor-not-allowed bg-slate-600'
                      : 'bg-primary-500 hover:bg-primary-400'
                  )}
                >
                  {conversion.isLoading ? 'Processing…' : t('convert')}
                </button>
                {conversion.isError && (
                  <p className="text-xs text-red-200">
                    {(conversion.error as Error)?.message ?? 'Something went wrong. Please try again.'}
                  </p>
                )}
              </form>
              {jobs.length > 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
                  <h2 className="text-lg font-semibold text-white">{t('conversionHistory')}</h2>
                  <ul className="mt-4 space-y-3 text-sm text-slate-100">
                    {jobs.map((job) => (
                      <li key={job.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{job.originalName}</p>
                          <p className="text-xs text-slate-300">→ {job.targetFormat.toUpperCase()}</p>
                        </div>
                        <span
                          className={clsx(
                            'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                            job.status === 'completed' && 'bg-green-500/20 text-green-200',
                            job.status === 'failed' && 'bg-red-500/20 text-red-200',
                            job.status === 'processing' && 'bg-amber-500/20 text-amber-100',
                            job.status === 'queued' && 'bg-slate-500/20 text-slate-100'
                          )}
                        >
                          {t(
                            job.status === 'completed'
                              ? 'statusCompleted'
                              : job.status === 'failed'
                                ? 'statusFailed'
                                : job.status === 'processing'
                                  ? 'statusProcessing'
                                  : 'statusQueued'
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <aside className="flex flex-col gap-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
                <h2 className="text-lg font-semibold text-white">{t('features.title')}</h2>
                <ul className="mt-4 space-y-4 text-sm text-slate-200">
                  {t('features.items', { returnObjects: true })
                    .map((item: { title: string; body: string }) => item)
                    .map((item) => (
                      <li key={item.title} className="rounded-2xl bg-slate-900/60 p-4">
                        <h3 className="font-semibold text-white">{item.title}</h3>
                        <p className="mt-2 text-xs text-slate-300">{item.body}</p>
                      </li>
                    ))}
                </ul>
              </div>
              <div
                id="premium"
                className="rounded-3xl border border-primary-500/50 bg-primary-500/10 p-6 text-slate-100 shadow-lg shadow-primary-500/30"
              >
                <h2 className="text-lg font-semibold text-white">Premium</h2>
                <p className="mt-2 text-sm">{t('adDisclaimer')}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>• Remove ads across all surfaces</li>
                  <li>• 5× faster queue priority</li>
                  <li>• 2GB file uploads</li>
                  <li>• Conversion history sync</li>
                </ul>
                <button className="mt-6 w-full rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white">
                  {t('premiumCta')}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>
      <section className="bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold text-white">Conversion Matrix</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-200">
            A complete overview of supported file transformations based on the product blueprint.
          </p>
          <div className="mt-8">
            <ConversionGrid />
          </div>
        </div>
      </section>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common']))
  }
});
