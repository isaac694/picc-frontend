'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock } from 'lucide-react';

interface SessionWarningModalProps {
  isOpen: boolean;
  timeLeft: number;
  formatTime: (seconds: number) => string;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionWarningModal({
  isOpen,
  timeLeft,
  formatTime,
  onExtend,
  onLogout,
}: SessionWarningModalProps) {
  useEffect(() => {
    if (isOpen && timeLeft <= 0) {
      onLogout();
    }
  }, [isOpen, timeLeft, onLogout]);

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-orange-500" />
            <AlertDialogTitle className="text-left">
              Session Expiring Soon
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            Your admin session will expire in{' '}
            <span className="font-semibold text-orange-600">
              {formatTime(timeLeft)}
            </span>
            . Would you like to extend your session?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <AlertDialogAction
            onClick={onLogout}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Log Out Now
          </AlertDialogAction>
          <AlertDialogAction
            onClick={onExtend}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Extend Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}