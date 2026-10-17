'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

type SchoolAdminDialogShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  saving: boolean;
  saveLabel: string;
  onSave: () => void;
  onCancel: () => void;
  children: ReactNode;
  maxWidthClass?: string;
};

export function SchoolAdminDialogShell({
  open,
  onOpenChange,
  title,
  description,
  saving,
  saveLabel,
  onSave,
  onCancel,
  children,
  maxWidthClass = 'sm:max-w-lg',
}: SchoolAdminDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[90vh] gap-0 overflow-hidden p-0 ${maxWidthClass}`}>
        <DialogHeader className="border-b border-border/70 bg-muted/30 px-6 py-5">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[min(60vh,560px)] overflow-y-auto px-6 py-5">{children}</div>
        <DialogFooter className="gap-2 border-t border-border/70 bg-muted/20 px-6 py-4 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={onSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SchoolAdminStatusBanner({ status }: { status: string }) {
  if (!status) return null;
  const isError = status.includes('Unable') || status.includes('Please');
  return (
    <div
      className={`rounded-xl p-4 text-sm ${
        isError ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
      }`}
    >
      {status}
    </div>
  );
}
