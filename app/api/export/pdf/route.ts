import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { htmlToPlainText } from '@/lib/html';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { html } = await req.json();
  if (!html) return NextResponse.json({ error: 'Missing html' }, { status: 400 });

  const text = htmlToPlainText(html);
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];
  return await new Promise<NextResponse>((resolve) => {
    doc.on('data', (d: Buffer) => chunks.push(Buffer.from(d)));
    doc.on('end', () => {
      const pdf = Buffer.concat(chunks);
      resolve(new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="optimized_resume.pdf"'
        }
      }));
    });

    doc.fontSize(12).text(text, { align: 'left' });
    doc.end();
  });
}
