import Link from 'next/link';

export default function Navbar() {
  return (
    <header>
      <div className="glass mx-auto max-w-6xl mt-4 rounded-xl px-4 py-3 mb-6 flex items-center justify-between ring-accent">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 text-white font-bold shadow-lg group-hover:scale-105 transition">W</span>
          <div className="leading-tight">
            <div className="text-sm text-gray-300">W Software Solutions</div>
            <div className="text-lg font-semibold neon-text">Astra ATS</div>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-gray-300">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/results" className="hover:text-white">Results</Link>
          <a href="https://ai.google.dev/" target="_blank" className="hover:text-white">Gemini</a>
          <Link href="/" className="ml-2 px-3 py-1.5 rounded-lg btn-primary text-white font-medium">Get Started</Link>
        </nav>
      </div>
    </header>
  );
}
