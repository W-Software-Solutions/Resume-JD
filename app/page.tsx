import UploadForm from "@/components/UploadForm";

export default function Home() {
  return (
  <div className="space-y-12">
      <section className="text-center pt-10">
        <h1 className="text-4xl md:text-6xl font-extrabold neon-text">
          Optimize Your Resume for the Future
        </h1>
  <p className="mt-4 text-gray-200 max-w-3xl mx-auto text-balance">
          Upload your resume, paste a job description, and get an AI-optimized
          version with ATS score, missing keywords, and actionable tips.
        </p>
      </section>
      <section className="glass rounded-2xl p-6 md:p-8">
        <UploadForm />
      </section>
      <section className="grid md:grid-cols-3 gap-6">
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-2">ATS Score</h3>
          <p className="text-sm text-gray-300">
            Instant feedback with a visual score and priority fixes.
          </p>
        </div>
  <div className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-2">Smart Suggestions</h3>
          <p className="text-sm text-gray-300">
            Tailored recommendations for summary, skills, experience, and more.
          </p>
        </div>
  <div className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-2">Editable & Exportable</h3>
          <p className="text-sm text-gray-300">
            Polish the result in a rich editor and export to PDF/DOCX.
          </p>
        </div>
      </section>
    </div>
  );
}
