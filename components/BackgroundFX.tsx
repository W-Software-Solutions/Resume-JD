"use client";
import React, { useEffect, useRef } from 'react';

export default function BackgroundFX() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div
        className="absolute -inset-40 opacity-40"
        style={{
          background: `radial-gradient(600px 400px at var(--mx,50%) var(--my,30%), rgba(124,58,237,0.2), transparent 60%)`
        }}
      />
      <div className="fx-grid" />
    </div>
  );
}
