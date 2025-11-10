import { useMemo } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface Conversion {
  from: string;
  to: string;
  description: string;
}

const conversions: Conversion[] = [
  { from: 'Word (.docx, .doc)', to: 'PDF', description: 'Preserve fonts and layout with password support.' },
  { from: 'Excel (.xlsx, .xls)', to: 'PDF', description: 'Choose worksheets, scale to page, and lock formulas.' },
  { from: 'PowerPoint (.pptx, .ppt)', to: 'PDF', description: 'Flatten backgrounds and animations for printing.' },
  { from: 'Images (.png, .jpg, .webp, .heic)', to: 'PDF', description: 'Combine multiple images into a single PDF.' },
  { from: 'PDF', to: 'Word', description: 'Reflow text with OCR fallback for scanned pages.' },
  { from: 'PDF', to: 'Excel', description: 'Extract tables while keeping cell structure intact.' },
  { from: 'PDF', to: 'Image', description: 'Export per-page PNG or JPG snapshots.' },
  { from: 'PDF', to: 'Text', description: 'Hybrid extraction mixing native text and OCR.' },
  { from: 'PDF', to: 'PowerPoint', description: 'Rebuild slides with layout detection.' }
];

export function ConversionGrid() {
  const items = useMemo(() => conversions, []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <article
          key={`${item.from}-${item.to}`}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 backdrop-blur transition hover:border-primary-400 hover:bg-primary-500/10"
        >
          <header className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{item.from}</h3>
            <ArrowRightIcon className="h-6 w-6 text-primary-300" />
            <h3 className="text-lg font-semibold text-white">{item.to}</h3>
          </header>
          <p className="mt-4 text-sm text-slate-200">{item.description}</p>
        </article>
      ))}
    </div>
  );
}
