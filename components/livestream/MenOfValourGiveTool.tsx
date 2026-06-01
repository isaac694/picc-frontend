import React, { useState } from 'react';
import { Landmark, Phone, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MenOfValourGiveTool({ isMobile }: { isMobile?: boolean }) {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className={`bg-white ${isMobile ? 'p-4' : 'p-8'} rounded-2xl shadow-sm border border-black/10 text-black`}>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-[#2D5A8C]">Support Men of Valour</h3>
        <p className="text-sm text-black/60 mt-2 max-w-md mx-auto">
          Your kingdom investment enables us to empower more men to make maximum impact in life and ministry.
        </p>
      </div>

      <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-8`}>
        {/* Bank Transfer Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-[#2D5A8C]/20 pb-3">
            <div className="bg-[#2D5A8C]/10 p-2 rounded-lg">
              <Landmark className="text-[#2D5A8C]" size={24} />
            </div>
            <h4 className="text-lg font-bold">Bank Transfer</h4>
          </div>
          
          <div className="space-y-4">
            <DetailItem 
              label="Bank Name" 
              value="First Capital Bank" 
              onCopy={() => copyToClipboard("First Capital Bank", "Bank name")}
            />
            <DetailItem 
              label="Account Name" 
              value="PICC Men of Valour" 
              onCopy={() => copyToClipboard("PICC Men of Valour", "Account name")}
            />
            <DetailItem 
              label="Account Number" 
              value="0004502003491" 
              onCopy={() => copyToClipboard("0004502003491", "Account number")}
            />
            <DetailItem 
              label="Branch" 
              value="Blantyre Branch" 
              onCopy={() => copyToClipboard("Blantyre Branch", "Branch")}
            />
          </div>
        </div>

        {/* Mobile Money Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-[#2D5A8C]/20 pb-3">
            <div className="bg-[#2D5A8C]/10 p-2 rounded-lg">
              <Phone className="text-[#2D5A8C]" size={24} />
            </div>
            <h4 className="text-lg font-bold">Mobile Money</h4>
          </div>

          <div className="space-y-4">
            <div className="group p-4 bg-red-50 rounded-xl border border-red-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs text-red-600 uppercase font-bold tracking-wider">Airtel Money</p>
                <CopyButton 
                  onClick={() => copyToClipboard("776628", "Airtel Money agent code")}
                  className="text-red-600/50 hover:text-red-600 transition-colors"
                />
              </div>
              <p className="text-xl font-bold text-gray-900 tracking-tight">Agent Code: 776628</p>
              <p className="text-sm text-red-600/70 mt-1">Name: PICC Men of Valour</p>
            </div>

            <div className="group p-4 bg-orange-50 rounded-xl border border-orange-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs text-orange-600 uppercase font-bold tracking-wider">TNM Mpamba</p>
                <CopyButton 
                  onClick={() => copyToClipboard("0881234567", "Mpamba number")}
                  className="text-orange-600/50 hover:text-orange-600 transition-colors"
                />
              </div>
              <p className="text-xl font-bold text-gray-900 tracking-tight">0881 234 567</p>
              <p className="text-sm text-orange-600/70 mt-1">Name: Men of Valour</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 p-6 bg-gray-50 rounded-2xl border border-black/5 text-center">
        <p className="text-sm text-gray-600 italic">
          "The Lord is with you, you mighty man of valour."
        </p>
        <p className="text-xs text-gray-400 mt-2">— Judges 6:12</p>
      </div>
    </div>
  );
}

function CopyButton({ onClick, className, size = 16 }: { onClick: () => void, className?: string, size?: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className={className}>
      {copied ? <Check size={size} className="text-green-600" /> : <Copy size={size} />}
    </button>
  );
}

function DetailItem({ label, value, onCopy }: { label: string, value: string, onCopy: () => void }) {
  return (
    <div className="group flex justify-between items-end border-b border-black/5 pb-2 transition-colors hover:border-[#2D5A8C]/30">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-black/40 uppercase font-bold tracking-[0.1em] mb-0.5">{label}</p>
        <p className="font-semibold text-gray-900 truncate">{value}</p>
      </div>
      <CopyButton 
        onClick={onCopy}
        className="ml-4 p-1.5 text-black/20 hover:text-[#2D5A8C] hover:bg-[#2D5A8C]/5 rounded-md transition-all"
        size={14}
      />
    </div>
  );
}
