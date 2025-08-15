"use client";
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function Editor({ initial, onChange }: { initial: string; onChange: (html: string) => void }) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    setValue(initial);
  }, [initial]);
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={(v) => { setValue(v); onChange(v); }}
      />
    </div>
  );
}
