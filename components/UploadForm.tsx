"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadForm() {
  const [jobDescription, setJobDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !jobDescription.trim()) return;
  setLoading(true);
  setStatus(null);
    try {
      const form = new FormData();
      form.append('jobDescription', jobDescription);
      form.append('resume', file);
  const base = typeof window !== 'undefined' ? window.location.origin : '';
      let res = await fetch(`${base}/api/analyze`, { method: 'POST', body: form });
      // light retry if service is busy
      if (res.status === 503) {
        setStatus('Server busy. Retrying…');
        await new Promise(r => setTimeout(r, 1200));
        res = await fetch(`${base}/api/analyze`, { method: 'POST', body: form });
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        setStatus('Unexpected response from server. Please try again.');
        return;
      }
  const data = await res.json();
      if (!res.ok) {
        setStatus(typeof data?.error === 'string' ? data.error : 'Server busy. Please try again.');
        return;
      }
  localStorage.setItem('analysis', JSON.stringify(data.analysis));
  if (data.breakdown) localStorage.setItem('breakdown', JSON.stringify(data.breakdown));
  if (data.originalHtml) localStorage.setItem('originalHtml', data.originalHtml);
      router.push('/results');
    } catch (err: unknown) {
      setStatus('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {status && (
        <p className="text-sm text-amber-300">{status}</p>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Upload Resume (PDF/DOCX/Image)</label>
          <input
            type="file"
            accept=".pdf,.docx,image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full rounded-xl border border-white/10 bg-black/30 text-sm p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ring-accent transition"
            required
          />
          <p className="text-xs text-gray-400 mt-2">Max size: 5MB</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="block w-full rounded-xl border border-white/10 bg-black/30 text-sm p-3 min-h-[160px] text-white placeholder-gray-400 focus:outline-none focus:ring-2 ring-accent transition"
            placeholder="Paste the JD here..."
            required
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary pulse-glow inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold disabled:opacity-50 shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
      >
        {loading ? 'Analyzing…' : 'Analyze with AI'}
      </button>
      </form>
    </div>
  );
}
