import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60; // seconds
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Server is not configured (missing GOOGLE_API_KEY)' },
        { status: 500 }
      );
    }
    // Lazy-load heavy node-only libs to avoid build-time bundling issues
    const [parsers, gem, scoring] = await Promise.all([
      import('@/lib/parsers'),
      import('@/lib/gemini'),
      import('@/lib/scoring'),
    ]);
    const form = await req.formData();
    const jobDescription = String(form.get('jobDescription') || '');
    const file = form.get('resume') as File | null;

    if (!jobDescription || !file) {
      return NextResponse.json({ error: 'Missing jobDescription or resume file' }, { status: 400 });
    }

    if ((file as File).size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 413 });
    }

  const { text } = await parsers.parseFileToText(file);
  const { plainTextToHtml } = await import('@/lib/html');
    let ai;
    try {
      ai = await gem.analyzeWithGemini(text, jobDescription);
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      // Map provider overload/availability errors to a friendly 503
      if (msg.includes('overloaded') || msg.includes('503') || msg.includes('unavailable')) {
        console.warn('temporarily unavailable:', err);
        return NextResponse.json(
          { error: 'Our AI service is busy right now. Please try again in a moment.' },
          { status: 503 }
        );
      }
      console.error('Gemini error:', err);
      return NextResponse.json(
        { error: 'AI analysis failed. Please try again shortly.' },
        { status: 502 }
      );
    }
    const det = scoring.computeATSScore(text, jobDescription);
    const mergedMissing = Array.from(new Set([...(ai.missingKeywords || []), ...det.missingKeywords]));
  const analysis = {
      ...ai,
      score: det.score,
      missingKeywords: mergedMissing,
    };
  const originalHtml = plainTextToHtml(text);
  return NextResponse.json({ success: true, analysis, breakdown: det.breakdown, originalHtml });
  } catch (err: unknown) {
    console.error('Analyze API error', err);
    return NextResponse.json({ error: 'Unexpected server error. Please try again.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: 'Send a POST with FormData { jobDescription, resume }' });
}
