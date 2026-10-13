'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type MediaUploadProgressProps = {
  uploading: boolean;
  progress: number;
  className?: string;
  label?: string;
};

export default function MediaUploadProgress({
  uploading,
  progress,
  className,
  label = 'Uploading',
}: MediaUploadProgressProps) {
  if (!uploading) return null;

  return (
    <div className={cn('space-y-1.5', className)} role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{label}…</span>
        <span className="tabular-nums font-medium text-foreground">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
