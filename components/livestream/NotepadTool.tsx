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
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link'],
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

  return (
    <div className="bg-black text-white p-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Notepad</h3>
            <p className="text-white/70 text-sm">
              Take notes during the livestream. Your notes are automatically saved to this browser.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={isGenerating || !notepadContent || notepadContent === '<p><br></p>'}
                  variant="outline"
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 w-full sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Notepad
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white text-black">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your current notes from this browser. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClear} className="bg-red-500 hover:bg-red-600 text-white">
                    Clear Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button 
              onClick={downloadAsPDF}
              disabled={isGenerating || !notepadContent || notepadContent === '<p><br></p>'}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
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
