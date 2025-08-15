    /** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    'pdf-parse',
    'mammoth',
    'tesseract.js',
    'docx',
    'pdfkit',
  ],
};

export default nextConfig;
