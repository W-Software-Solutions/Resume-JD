import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { htmlToPlainText } from '@/lib/html';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { html } = await req.json();
  if (!html) return NextResponse.json({ error: 'Missing html' }, { status: 400 });
  const text = htmlToPlainText(html);

  const paragraphs = text.split('\n').map(line => new Paragraph({ children: [new TextRun(line)] }));

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const uint = new Uint8Array(buffer);
  const blob = new Blob([uint], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="optimized_resume.docx"'
    }
  });
}
