import Link from 'next/link';
import { UploadCloud, FileText, Image as ImageIcon, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI & OCR Driven Social Media Optimization</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          Transform Social Media Posts into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Viral Engagement</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Upload PDF posts, draft slide carousels, or image screenshots. Our OCR engine extracts content instantly and evaluates hooks, CTAs, readability, and engagement drivers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/upload"
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all scale-100 hover:scale-[1.02]"
          >
            <UploadCloud className="w-5 h-5" />
            <span>Upload Content to Analyze</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            href="/history"
            className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm flex items-center justify-center space-x-2 transition-colors"
          >
            <span>View Processing History</span>
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Multi-page PDF Extraction</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Preserves text layout, headings, and paragraph boundaries across complex PDF social media documents.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Tesseract OCR Engine</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Extracts clear readable text from screenshot images (PNG, JPG, JPEG) with strict timeout safety guard rails.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Actionable Suggestions</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Generates engagement scores, hook rewrites, CTA optimizations, and readability metrics tailored directly to your post.
          </p>
        </div>
      </section>

      {/* Trust & Architecture Banner */}
      <section className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center space-x-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>MatriMitra Modular Monolith Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Production Quality Assessment Implementation
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Built with Next.js, Express, TypeScript, PostgreSQL, Prisma, PDF parsing, Tesseract OCR, and Gemini AI integration with deterministic fallback.
          </p>
        </div>

        <Link
          href="/upload"
          className="px-6 py-3.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-sm rounded-xl shadow-md whitespace-nowrap transition-transform hover:scale-105"
        >
          Try Demo Upload
        </Link>
      </section>
    </div>
  );
}
