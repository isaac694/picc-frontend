import QuillEditor from '@/components/QuillEditor';
import { useNotepad } from '@/hooks/useLivestreamTools';

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ],
};

export default function NotepadTool() {
  const { notepadContent, setNotepadContent } = useNotepad();

  return (
    <div className="bg-black text-white p-6">
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold mb-2">Notepad</h3>
          <p className="text-white/70 text-sm mb-4">
            Take notes during the livestream. Your notes are saved locally in your browser.
          </p>
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
