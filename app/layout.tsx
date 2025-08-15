import type { Metadata } from "next";
import "./globals.css";
import BackgroundFX from '@/components/BackgroundFX';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: "Astra ATS",
  description: "AI-powered Resume Optimizer & ATS Score",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="">
      <body className="antialiased relative">
        <BackgroundFX />
        <Navbar />
  <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
