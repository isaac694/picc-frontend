'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  modules?: any;
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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const defaultModules = modules || {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
    ],
  };

  return (
    <div className={`quill-editor-wrapper ${className}`}>
      {!isLoaded && (
        <div className="h-48 bg-white/5 border border-white/10 rounded-lg animate-pulse" />
      )}
      {isLoaded && (
        <ReactQuill
          theme={theme}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          modules={defaultModules}
        />
      )}
    </div>
  );
}
