import React from 'react';
import { Landmark, Phone, CreditCard, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function WomenOfHopeGiveTool({ isMobile }: { isMobile?: boolean }) {
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
        <h3 className="text-2xl font-bold text-[#029EFB]">Support Women of Hope</h3>
        <p className="text-sm text-black/60 mt-2 max-w-md mx-auto">
          Your kingdom investment enables us to reach more women with the message of hope and empowerment.
        </p>
      </div>

      <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-8`}>
        {/* Bank Transfer Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-[#029EFB]/20 pb-3">
            <div className="bg-[#029EFB]/10 p-2 rounded-lg">
              <Landmark className="text-[#029EFB]" size={24} />
            </div>
            <h4 className="text-lg font-bold">Bank Transfer</h4>
          </div>
          
          <div className="space-y-4">
            <DetailItem 
              label="Bank Name" 
              value="National Bank of Malawi" 
              onCopy={() => copyToClipboard("National Bank of Malawi", "Bank name")}
            />
            <DetailItem 
              label="Account Name" 
              value="Women of Hope Ministry" 
              onCopy={() => copyToClipboard("Women of Hope Ministry", "Account name")}
            />
            <DetailItem 
              label="Account Number" 
              value="1234567890" 
              onCopy={() => copyToClipboard("1234567890", "Account number")}
            />
            <DetailItem 
              label="Branch" 
              value="Chichiri Branch" 
              onCopy={() => copyToClipboard("Chichiri Branch", "Branch")}
            />
            <DetailItem 
              label="Swift Code" 
              value="NBMAMWMW" 
              onCopy={() => copyToClipboard("NBMAMWMW", "Swift code")}
            />
          </div>
        </div>

        {/* Mobile Money Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-[#029EFB]/20 pb-3">
            <div className="bg-[#029EFB]/10 p-2 rounded-lg">
              <Phone className="text-[#029EFB]" size={24} />
            </div>
            <h4 className="text-lg font-bold">Mobile Money</h4>
          </div>

          <div className="space-y-4">
            <div className="group p-4 bg-red-50 rounded-xl border border-red-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs text-red-600 uppercase font-bold tracking-wider">Airtel Money</p>
                <button 
                  onClick={() => copyToClipboard("0991234567", "Airtel Money number")}
                  className="text-red-600/50 hover:text-red-600 transition-colors"
                >
                  <Copy size={16} />
                </button>
              </div>
              <p className="text-xl font-bold text-gray-900 tracking-tight">0991 234 567</p>
              <p className="text-sm text-red-600/70 mt-1">Name: Women of Hope</p>
            </div>

            <div className="group p-4 bg-orange-50 rounded-xl border border-orange-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs text-orange-600 uppercase font-bold tracking-wider">TNM Mpamba</p>
                <button 
                  onClick={() => copyToClipboard("0881234567", "Mpamba number")}
                  className="text-orange-600/50 hover:text-orange-600 transition-colors"
                >
                  <Copy size={16} />
                </button>
              </div>
              <p className="text-xl font-bold text-gray-900 tracking-tight">0881 234 567</p>
              <p className="text-sm text-orange-600/70 mt-1">Name: Women of Hope</p>
            </div>
          </div>
          
          <div className="pt-2">
            <div className="flex items-center gap-3 border-b border-[#029EFB]/20 pb-3 mb-4">
              <div className="bg-[#029EFB]/10 p-2 rounded-lg">
                <CreditCard className="text-[#029EFB]" size={24} />
              </div>
              <h4 className="text-lg font-bold">Card Payment</h4>
            </div>
            <p className="text-sm text-black/60 mb-4">For international card payments, please use our secure portal.</p>
            <Button className="w-full bg-[#029EFB] hover:bg-[#0178C0] text-white rounded-full transition-colors">
              Pay Online
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-10 p-6 bg-gray-50 rounded-2xl border border-black/5 text-center">
        <p className="text-sm text-gray-600 italic">
          "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
        </p>
        <p className="text-xs text-gray-400 mt-2">— 2 Corinthians 9:7</p>
      </div>
    </div>
  );
}

function DetailItem({ label, value, onCopy }: { label: string, value: string, onCopy: () => void }) {
  return (
    <div className="group flex justify-between items-end border-b border-black/5 pb-2 transition-colors hover:border-[#029EFB]/30">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-black/40 uppercase font-bold tracking-[0.1em] mb-0.5">{label}</p>
        <p className="font-semibold text-gray-900 truncate">{value}</p>
      </div>
      <button 
        onClick={onCopy}
        className="ml-4 p-1.5 text-black/20 hover:text-[#029EFB] hover:bg-[#029EFB]/5 rounded-md transition-all"
        title={`Copy ${label}`}
      >
        <Copy size={14} />
      </button>
    </div>
  );
}
