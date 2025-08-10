'use client';

import { useCallback, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

export default function UploadDropzone({ accept = '*', maxSizeMB = 5, onFile = () => {}, file = null }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const maxBytes = maxSizeMB * 1024 * 1024;

  const pick = () => inputRef.current?.click();

  const handleFiles = useCallback((files) => {
    const f = files?.[0];
    if (!f) return;
    if (f.size > maxBytes) {
      alert(`File too large. Max ${maxSizeMB} MB.`);
      return;
    }
    onFile(f);
  }, [maxBytes, maxSizeMB, onFile]);

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onClick={pick}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center
        ${drag ? 'border-blue-400 bg-blue-50/40' : 'border-white/40 bg-white/80 backdrop-blur-xl'}
        transition`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex flex-col items-center gap-2">
        <UploadCloud className="w-8 h-8 text-blue-600" />
        <div className="font-medium">Drag & drop your file here</div>
        <div className="text-xs text-gray-500">or click to browse</div>
        {file && <div className="mt-2 text-sm text-gray-700">{file.name}</div>}
      </div>
    </div>
  );
}
