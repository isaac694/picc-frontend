'use client';

import { useEffect, useRef, useState } from 'react';
import 'quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  modules?: Record<string, any>;
  theme?: string;
  className?: string;
}

export default function QuillEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  readOnly = false,
  modules,
  theme = 'snow',
  className = '',
}: QuillEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !editorContainerRef.current || editorRef.current) return;

    let isMounted = true;

    import('quill').then((mod) => {
      if (!isMounted || !editorContainerRef.current) return;

      const Quill = mod.default;
      editorContainerRef.current.innerHTML = '';
      editorRef.current = new Quill(editorContainerRef.current, {
        theme,
        placeholder,
        readOnly,
        modules:
          modules ?? {
            toolbar: [
              ['bold', 'italic', 'underline'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['link'],
            ],
          },
      });

      editorRef.current.clipboard.dangerouslyPasteHTML(value || '');
      editorRef.current.on('text-change', () => {
        const html = editorRef.current.root.innerHTML;
        if (onChangeRef.current) {
          onChangeRef.current(html === '<p><br></p>' ? '' : html);
        }
      });
    });

    return () => {
      isMounted = false;
      if (editorRef.current) {
        editorRef.current.off('text-change');
        editorRef.current = null;
      }
      if (editorContainerRef.current) {
        editorContainerRef.current.innerHTML = '';
      }
    };
  }, [isClient, modules, placeholder, readOnly, theme, value]);

  useEffect(() => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.root.innerHTML;
    if (value !== currentHtml && !(value === '' && currentHtml === '<p><br></p>')) {
      editorRef.current.clipboard.dangerouslyPasteHTML(value || '');
    }
  }, [value]);

  return (
    <div className={`quill-editor-wrapper ${className}`}>
      {!isClient ? (
        <div className="h-48 bg-white/5 border border-white/10 rounded-lg animate-pulse" />
      ) : (
        <div ref={editorContainerRef} className="min-h-[240px] bg-white" />
      )}
    </div>
  );
}
