import { useState } from 'react';
import QuillEditor from '@/components/QuillEditor';
import { useNotepad } from '@/hooks/useLivestreamTools';
import { Download, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ],
};

export default function NotepadTool() {
  const { notepadContent, setNotepadContent } = useNotepad();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleClear = () => {
    setNotepadContent('');
    toast.success('Notepad cleared');
  };

  const downloadAsPDF = async () => {
    if (!notepadContent || notepadContent === '<p><br></p>') {
      toast.error('Your notepad is empty.');
      return;
    }

    setIsGenerating(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      // Create a temporary container for PDF generation
      const tempContainer = document.createElement('div');
      const tempId = `pdf-temp-${Date.now()}`;
      tempContainer.id = tempId;
      tempContainer.style.width = '800px'; 
      tempContainer.style.padding = '40px';
      tempContainer.style.color = '#000000';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.zIndex = '-1';
      // Do not use opacity: 0 or visibility: hidden as it can break html2canvas
      
      // Add a header
      const header = document.createElement('div');
      header.style.marginBottom = '20px';
      header.style.borderBottom = '2px solid #ef4444';
      header.style.paddingBottom = '15px';
      header.innerHTML = `
        <h1 style="margin: 0; color: #ef4444; font-size: 28px; font-family: sans-serif;">PICC Livestream Notes</h1>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px; font-family: sans-serif;">Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
      `;
      tempContainer.appendChild(header);

      // Add the content wrapper
      const contentWrapper = document.createElement('div');
      contentWrapper.style.fontFamily = 'serif';
      contentWrapper.style.fontSize = '16px';
      contentWrapper.style.lineHeight = '1.6';
      contentWrapper.style.color = '#333333';
      contentWrapper.innerHTML = `
        <style>
          p { margin: 0 0 1em 0; }
          h1, h2, h3 { margin: 1.2em 0 0.6em 0; color: #111; }
          ul { list-style-type: disc !important; padding-left: 40px !important; margin-bottom: 1.2em !important; display: block !important; }
          ol { list-style-type: decimal !important; padding-left: 40px !important; margin-bottom: 1.2em !important; display: block !important; }
          li { display: list-item !important; margin-bottom: 0.4em !important; list-style-position: outside !important; }
          blockquote { border-left: 4px solid #ef4444; padding-left: 1.2em; margin-left: 0; color: #555; font-style: italic; background: #fff5f5; padding-top: 10px; padding-bottom: 10px; }
          pre { background: #f4f4f4; padding: 15px; border-radius: 4px; font-family: monospace; overflow-x: auto; }
          a { color: #ef4444; text-decoration: underline; }
        </style>
        ${notepadContent}
      `;
      tempContainer.appendChild(contentWrapper);

      document.body.appendChild(tempContainer);
      
      // Give more time for rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      // Render to canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800, // Explicitly set width to match container
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas rendering failed');
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add subsequent pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `PICC-Notes-${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);
      
      // Cleanup
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
      setIsGenerating(false);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error('Failed to generate PDF. Please try again.');
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = useCallback(() => {
    if (!notepadContent || notepadContent === '<p><br></p>') return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Livestream Notes - ${dateStr}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

            *, *::before, *::after {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              color: #1a1a1a;
              line-height: 1.7;
              padding: 48px 56px;
              max-width: 800px;
              margin: 0 auto;
            }

            .header {
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 16px;
              margin-bottom: 32px;
            }

            .header h1 {
              font-size: 22px;
              font-weight: 700;
              color: #111;
              margin-bottom: 4px;
            }

            .header p {
              font-size: 12px;
              color: #6b7280;
            }

            .content {
              font-size: 14px;
            }

            .content p {
              margin-bottom: 8px;
            }

            .content ul, .content ol {
              margin-left: 24px;
              margin-bottom: 12px;
            }

            .content li {
              margin-bottom: 4px;
            }

            .content strong { font-weight: 700; }
            .content em { font-style: italic; }
            .content u { text-decoration: underline; }

            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Livestream Notes</h1>
            <p>${dateStr} &middot; ${timeStr}</p>
          </div>
          <div class="content">${notepadContent}</div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [notepadContent]);

  const hasContent = notepadContent && notepadContent !== '<p><br></p>';

  return (
    <div className="bg-black text-white p-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Notepad</h3>
            <p className="text-white/70 text-sm">
              Take notes during the livestream. Your notes are saved locally in your browser.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!hasContent}
            title="Download notes as PDF"
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              hasContent
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            <Download size={14} />
            Download PDF
          </button>
        </div>
        <div className="bg-white rounded-lg overflow-hidden text-black">
          <QuillEditor
            value={notepadContent}
            onChange={setNotepadContent}
            placeholder="Type your notes here..."
            modules={QUILL_MODULES}
          />
        </div>
      </div>
    </div>
  );
}
