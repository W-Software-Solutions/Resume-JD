type TesseractResult = { data: { text: string } };

export async function parseFileToText(file: File | Blob): Promise<{ text: string; meta: { type: string } }>{
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const type = (file as File).type || '';
  const name = (file as File & { name?: string }).name || '';

  const ext = name.split('.').pop()?.toLowerCase();
  if (type.includes('pdf') || ext === 'pdf') {
    try {
      const mod = await import('pdf-parse');
      const pdfParse = (mod as any).default as (buf: Buffer) => Promise<{ text: string }>;
      const data = await pdfParse(Buffer.from(bytes));
      return { text: data.text, meta: { type: 'pdf' } };
    } catch (err: any) {
      if (err && (err.code === 'ENOENT' || String(err.message || '').includes('test/data'))) {
        const decoder = new TextDecoder();
        return { text: decoder.decode(bytes), meta: { type: 'pdf-fallback' } };
      }
      throw err;
    }
  }
  if (
    type.includes('officedocument.wordprocessingml.document') ||
    ext === 'docx'
  ) {
  const mammoth = (await import('mammoth')).default as typeof import('mammoth');
  const { value } = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) });
    const plain = value
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return { text: plain, meta: { type: 'docx' } };
  }
  if (type.startsWith('image/') || ['jpg','jpeg','png','gif','bmp','tiff','webp'].includes(ext || '')) {
  const Tesseract = (await import('tesseract.js')).default as typeof import('tesseract.js');
  const buf = Buffer.from(bytes);
  // Accept Buffer as ImageLike for Node usage
  const result = (await Tesseract.recognize(buf as unknown as Buffer, 'eng')) as TesseractResult;
  return { text: result.data.text, meta: { type: 'image' } };
  }
  // Fallback: try to treat as text
  const decoder = new TextDecoder();
  return { text: decoder.decode(bytes), meta: { type: 'text' } };
}
