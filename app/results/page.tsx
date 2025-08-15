"use client";
import { useEffect, useState } from 'react';
import ScoreBar from '@/components/ScoreBar';
import Editor from '@/components/Editor';
import type { AnalysisResult } from '@/lib/gemini';

export default function ResultsPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [html, setHtml] = useState('');
  const [breakdown, setBreakdown] = useState<any | null>(null);
  const [highlight, setHighlight] = useState(false);
  const [useOptimized, setUseOptimized] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('analysis');
  const bd = localStorage.getItem('breakdown');
    const orig = localStorage.getItem('originalHtml');
    if (raw) {
      const parsed = JSON.parse(raw);
      setAnalysis(parsed);
      // default to user's original resume if available
      setHtml(orig || parsed.optimizedResume || '');
    }
  if (bd) setBreakdown(JSON.parse(bd));
  }, []);

  if (!analysis) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <p>No analysis found. Go back to home.</p>
      </main>
    );
  }

  const { score, sections, missingKeywords } = analysis;

  function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function unhighlight(h: string) {
    return h.replace(/<mark[^>]*>(.*?)<\/mark>/gi, '$1');
  }

  function highlightKeywords(h: string, keys: string[]) {
    let out = unhighlight(h);
    for (const k of keys || []) {
      if (!k) continue;
      const re = new RegExp(`\\b${escapeRegExp(k)}\\b`, 'gi');
      out = out.replace(re, '<mark>$&</mark>');
    }
    return out;
  }

  function insertIntoSection(current: string, sectionName: string, items: string[]): string {
    const name = sectionName.trim();
    const headerRe = new RegExp(`(<h[12][^>]*>\\s*)(${escapeRegExp(name)})(\\s*<\\/h[12]>)`, 'i');
    const ulAfterHeaderRe = new RegExp(`(<h[12][^>]*>\\s*${escapeRegExp(name)}\\s*<\\/h[12]>)([\\s\\S]*?)(<ul[^>]*>)([\\s\\S]*?)(<\\/ul>)`, 'i');
    const li = items.map(it => `<li>${it}</li>`).join('');
    if (ulAfterHeaderRe.test(current)) {
      return current.replace(ulAfterHeaderRe, (_m, h, mid, ulStart, ulBody, ulEnd) => `${h}${mid}${ulStart}${ulBody}${li}${ulEnd}`);
    }
    if (headerRe.test(current)) {
      return current.replace(headerRe, (_m, pre, title, post) => `${pre}${title}${post}<ul>${li}</ul>`);
    }
    // If not found, append a new section at end
    return `${current}\n<h2>${name}</h2>\n<ul>${li}</ul>`;
  }

  function addKeywordsToSkills(current: string, keys: string[]): string {
    const unique = Array.from(new Set((keys || []).filter(Boolean)));
    if (!unique.length) return current;
    return insertIntoSection(current, 'Skills', unique.map(k => k));
  }

  async function downloadHTML() {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized_resume.html';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPDF() {
    const res = await fetch('/api/export/pdf', { method: 'POST', body: JSON.stringify({ html }), headers: { 'Content-Type': 'application/json' } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized_resume.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadDOCX() {
    const res = await fetch('/api/export/docx', { method: 'POST', body: JSON.stringify({ html }), headers: { 'Content-Type': 'application/json' } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized_resume.docx';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-extrabold neon-text">Your Results</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="glass rounded-xl p-5">
            <ScoreBar score={score} />
          </div>
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Editor Tools</h2>
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={highlight}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setHighlight(next);
                    setHtml(next ? highlightKeywords(html, missingKeywords || []) : unhighlight(html));
                  }}
                />
                <span>Highlight missing keywords</span>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setHtml(addKeywordsToSkills(html, missingKeywords || []))}
                className="px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-black/40 transition text-sm"
              >
                Add missing keywords to Skills
              </button>
            </div>
          </div>
          {breakdown && (
            <div className="glass rounded-xl p-5">
              <h2 className="font-semibold mb-2">Score Breakdown</h2>
              <ul className="space-y-1 text-sm text-gray-200">
                {Object.entries(breakdown).map(([k, v]) => (
                  <li key={k} className="flex justify-between"><span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span><span>{String(v)}</span></li>
                ))}
              </ul>
            </div>
          )}
          <div className="glass rounded-xl p-5">
            <h2 className="font-semibold mb-2">Missing Keywords</h2>
            {missingKeywords?.length ? (
              <ul className="list-disc ml-5 space-y-1 text-sm">
                {missingKeywords.map((k: string) => (
                  <li key={k} className="flex items-center justify-between gap-2">
                    <span>{k}</span>
                    <button
                      onClick={() => setHtml(addKeywordsToSkills(html, [k]))}
                      className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/10"
                    >Add</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">None detected</p>
            )}
          </div>
          <div className="glass rounded-xl p-5">
            <h2 className="font-semibold mb-2">Recommendations</h2>
            <div className="space-y-3">
              {Object.entries(sections || {}).map(([name, items]) => (
                <div key={name}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{name}</h3>
                    <button
                      onClick={() => setHtml(insertIntoSection(html, name, items as string[]))}
                      className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/10"
                    >Apply all</button>
                  </div>
                  <ul className="list-disc ml-5 text-sm space-y-1">
                    {(items as string[]).map((it, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-2">
                        <span className="mr-2">{it}</span>
                        <button
                          onClick={() => setHtml(insertIntoSection(html, name, [it]))}
                          className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/10"
                        >Insert</button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="md:col-span-2 space-y-3">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Resume (Editable)</h2>
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useOptimized}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setUseOptimized(next);
                    const a = localStorage.getItem('analysis');
                    const o = localStorage.getItem('originalHtml');
                    if (!a) return;
                    const parsed = JSON.parse(a);
                    setHtml(next ? (parsed.optimizedResume || o || '') : (o || parsed.optimizedResume || ''));
                  }}
                />
                <span>Use AI-optimized</span>
              </label>
            </div>
            <Editor initial={html} onChange={setHtml} />
            <div className="mt-3 flex gap-2 flex-wrap">
              <button onClick={downloadHTML} className="px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-black/40 transition">Download HTML</button>
              <button onClick={downloadPDF} className="btn-primary px-3 py-2 rounded-xl">Download PDF</button>
              <button onClick={downloadDOCX} className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 transition">Download DOCX</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
