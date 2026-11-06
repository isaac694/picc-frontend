'use client';

import { useEffect, useState } from 'react';
import { Copy, Facebook, Mail, MessageCircle, MessageSquare, Send, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { adminErrorToast, adminSuccessToast } from '@/components/admin/admin-toast';
import { money, receiptPhoneDigits, receiptShareText, receiptShareUrl, shareReceiptNatively, type StoreOrder } from '@/lib/store-receipt';

const optionClass = 'flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium hover:bg-muted';

/** Lets a salesperson send a receipt to the customer through WhatsApp, Facebook or any other app. */
export default function ReceiptShareDialog({ order, onClose }: { order: StoreOrder | null; onClose: () => void }) {
  const [canUseShareSheet, setCanUseShareSheet] = useState(false);

  useEffect(() => {
    setCanUseShareSheet(typeof navigator.share === 'function');
  }, []);

  const useShareSheet = async () => {
    if (!order) return;
    const opened = await shareReceiptNatively(order);
    if (!opened) adminErrorToast('This device could not open its share options. Use one of the apps below.');
  };

  const copyLink = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(receiptShareUrl(order));
      adminSuccessToast('Receipt link copied.');
    } catch {
      adminErrorToast('Could not copy the link.');
    }
  };

  const text = order ? receiptShareText(order) : '';
  const url = order ? receiptShareUrl(order) : '';
  const phone = order ? receiptPhoneDigits(order) : '';
  const encodedText = encodeURIComponent(text);

  return (
    <Dialog open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share receipt</DialogTitle>
          <DialogDescription>
            {order ? `${order.receiptNumber || 'Receipt'} · ${order.buyerName || 'Customer'} · ${money(order.total, order.currency)}` : ''}
          </DialogDescription>
        </DialogHeader>
        {canUseShareSheet ? (
          <Button type="button" className="w-full" onClick={() => void useShareSheet()}>
            <Share2 className="h-4 w-4" /> Share to any app (with PDF)
          </Button>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <a className={optionClass} href={`https://wa.me/${phone}?text=${encodedText}`} target="_blank" rel="noreferrer">
            <MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp
          </a>
          <a className={optionClass} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer">
            <Facebook className="h-4 w-4 text-blue-600" /> Facebook
          </a>
          <a className={optionClass} href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Hope Bookshop receipt ${order?.receiptNumber || ''}`)}`} target="_blank" rel="noreferrer">
            <Send className="h-4 w-4 text-sky-600" /> Telegram
          </a>
          <a className={optionClass} href={`sms:${phone ? `+${phone}` : ''}?body=${encodedText}`}>
            <MessageSquare className="h-4 w-4" /> SMS
          </a>
          <a className={optionClass} href={`mailto:${order?.customerEmail || ''}?subject=${encodeURIComponent(`Hope Bookshop receipt ${order?.receiptNumber || ''}`)}&body=${encodedText}`}>
            <Mail className="h-4 w-4" /> Email app
          </a>
          <button type="button" className={optionClass} onClick={() => void copyLink()}>
            <Copy className="h-4 w-4" /> Copy link
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {phone ? 'WhatsApp opens a chat with the buyer\'s number. ' : 'Add the buyer\'s phone on the sale to open their WhatsApp chat directly. '}
          Anyone with the link can see the receipt, so send it privately. Avoid posting it publicly on a Facebook timeline.
        </p>
      </DialogContent>
    </Dialog>
  );
}
