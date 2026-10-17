'use client';

import { Button } from '@/components/ui/button';

type Props = {
  skip: number;
  take: number;
  total: number;
  onPageChange: (skip: number) => void;
  disabled?: boolean;
};

export function AdminListPagination({ skip, take, total, onPageChange, disabled }: Props) {
  const page = Math.floor(skip / take) + 1;
  const totalPages = Math.max(1, Math.ceil(total / take));
  const canPrev = skip > 0;
  const canNext = skip + take < total;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      <p>
        Showing {total === 0 ? 0 : skip + 1}–{Math.min(skip + take, total)} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !canPrev}
          onClick={() => onPageChange(Math.max(0, skip - take))}
        >
          Previous
        </Button>
        <span className="font-medium text-foreground">
          Page {page} / {totalPages}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !canNext}
          onClick={() => onPageChange(skip + take)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
