import { useState } from 'react';
import { Check, Copy, Landmark, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function WailingWomanGiveTool({ isMobile }: { isMobile?: boolean }) {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className={`bg-white ${isMobile ? 'p-4' : 'p-8'} rounded-2xl shadow-sm border border-black/10 text-black`}>
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-bold text-[#6B21A8]">Support Wailing Woman</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-black/60">
          Partnership channels for Wailing Woman - My Seed Must Prosper.
        </p>
      </div>

      <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-8`}>
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-[#6B21A8]/20 pb-3">
            <div className="rounded-lg bg-[#6B21A8]/10 p-2">
              <Landmark className="text-[#6B21A8]" size={24} />
            </div>
            <h4 className="text-lg font-bold">Bank Transfer</h4>
          </div>

          <div className="space-y-4">
            <DetailItem
              label="Bank Name"
              value="National Bank of Malawi"
              onCopy={() => copyToClipboard('National Bank of Malawi', 'Bank name')}
            />
            <DetailItem
              label="Account Name"
              value="Wailing Woman Ministry"
              onCopy={() => copyToClipboard('Wailing Woman Ministry', 'Account name')}
            />
            <DetailItem
              label="Account Number"
              value="1007654321"
              onCopy={() => copyToClipboard('1007654321', 'Account number')}
            />
            <DetailItem
              label="Branch"
              value="Lilongwe Service Centre"
              onCopy={() => copyToClipboard('Lilongwe Service Centre', 'Branch')}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-[#6B21A8]/20 pb-3">
            <div className="rounded-lg bg-[#6B21A8]/10 p-2">
              <Phone className="text-[#6B21A8]" size={24} />
            </div>
            <h4 className="text-lg font-bold">Mobile Money Transfers</h4>
          </div>

          <div className="space-y-4">
            <div className="group rounded-xl border border-red-100 bg-red-50 p-4 transition-all hover:shadow-md">
              <div className="mb-1 flex items-start justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-red-600">Airtel Money</p>
                <CopyButton
                  onClick={() => copyToClipboard('+265 995 46 55 40', 'Airtel Money number')}
                  className="text-red-600/50 transition-colors hover:text-red-600"
                />
              </div>
              <p className="text-xl font-bold tracking-tight text-gray-900">+265 995 46 55 40</p>
            </div>

            <div className="group rounded-xl border border-orange-100 bg-orange-50 p-4 transition-all hover:shadow-md">
              <div className="mb-1 flex items-start justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-orange-600">TNM Mpamba</p>
                <CopyButton
                  onClick={() => copyToClipboard('+265 888 38 07 32', 'TNM Mpamba number')}
                  className="text-orange-600/50 transition-colors hover:text-orange-600"
                />
              </div>
              <p className="text-xl font-bold tracking-tight text-gray-900">+265 888 38 07 32</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ onClick, className, size = 16 }: { onClick: () => void; className?: string; size?: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button type="button" onClick={handleCopy} className={className} aria-label="Copy detail">
      {copied ? <Check size={size} className="text-green-600" /> : <Copy size={size} />}
    </button>
  );
}

function DetailItem({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="group flex items-end justify-between border-b border-black/5 pb-2 transition-colors hover:border-[#6B21A8]/30">
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-black/40">{label}</p>
        <p className="truncate font-semibold text-gray-900">{value}</p>
      </div>
      <CopyButton
        onClick={onCopy}
        className="ml-4 rounded-md p-1.5 text-black/20 transition-all hover:bg-[#6B21A8]/5"
        size={14}
      />
    </div>
  );
}
