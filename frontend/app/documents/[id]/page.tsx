'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  ArrowLeft, 
  Copy, 
  Check, 
  Sparkles, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Hash, 
  BookOpen, 
  Loader2,
  Trash2
} from 'lucide-react';
import { fetchDocumentById, deleteDocument, DocumentData } from '@/lib/api';
import { formatBytes, formatDate } from '@/lib/utils';

export default function DocumentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    loadDocument();
  }, [id]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDocumentById(id);
      setDocument(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to load document details');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!document?.extractedText) return;
    navigator.clipboard.writeText(document.extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document analysis record?')) return;
    try {
      setDeleting(true);
      await deleteDocument(id);
      router.push('/history');
    } catch (err: any) {
      alert(err?.message || 'Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
        <p className="text-slate-600 font-medium text-sm">Loading document analysis...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
          <p className="font-semibold">Unable to find document</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
        <Link href="/history" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to History
        </Link>
      </div>
    );
  }

  const analysis = document.analysis;
  const score = analysis?.engagementScore ?? 0;

  let scoreBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score < 50) scoreBadgeColor = 'bg-red-50 text-red-700 border-red-200';
  else if (score < 75) scoreBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <div className="space-y-8">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/history"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Document History
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 truncate">
            {document.originalFilename}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Uploaded on {formatDate(document.createdAt)} • {document.fileType} • {formatBytes(document.fileSize)}
          </p>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors self-start sm:self-auto"
        >
          <Trash2 className="w-4 h-4" />
          <span>{deleting ? 'Deleting...' : 'Delete Record'}</span>
        </button>
      </div>

      {/* Main Grid: Left = Extracted Text, Right = Content Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Extracted Text */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-slate-900 text-sm">Extracted Text</h2>
              </div>
              <button
                onClick={handleCopyText}
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[600px] text-sm text-slate-700 leading-relaxed font-mono whitespace-pre-wrap bg-slate-50/30">
              {document.extractedText || (
                <span className="text-slate-400 italic">No extractable text found in document.</span>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-white text-xs text-slate-400 flex justify-between">
              <span>Words: {document.extractedText ? document.extractedText.split(/\s+/).filter(Boolean).length : 0}</span>
              <span>Chars: {document.extractedText?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Engagement & AI Analysis */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Engagement Score & Summary Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block">
                  Content Type: {analysis?.contentType || 'Social Media Post'}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  Engagement Potential Analysis
                </h3>
              </div>

              {/* Score Badge */}
              <div className={`px-4 py-3 rounded-2xl border ${scoreBadgeColor} text-center flex flex-col items-center justify-center shadow-sm`}>
                <span className="text-2xl font-extrabold leading-none">{score}/100</span>
                <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Engagement Score</span>
              </div>
            </div>

            {/* Summary */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Content Summary</h4>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {analysis?.summary}
              </p>
            </div>

            {/* High Impact Hook & CTA Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                <div className="flex items-center space-x-1.5 text-indigo-800 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Suggested Hook Optimization</span>
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  "{analysis?.hookSuggestion}"
                </p>
              </div>

              <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-100 space-y-2">
                <div className="flex items-center space-x-1.5 text-violet-800 font-bold text-xs">
                  <Target className="w-4 h-4 text-violet-600" />
                  <span>Suggested CTA Optimization</span>
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  "{analysis?.ctaSuggestion}"
                </p>
              </div>
            </div>

            {/* Strengths & Weaknesses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              
              {/* Strengths */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Strengths</span>
                </div>
                <ul className="space-y-2">
                  {analysis?.strengths.map((str, idx) => (
                    <li key={idx} className="text-xs text-slate-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Areas for Improvement</span>
                </div>
                <ul className="space-y-2">
                  {analysis?.weaknesses.map((wk, idx) => (
                    <li key={idx} className="text-xs text-slate-700 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                      <span>{wk}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Actionable Suggestions */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Actionable Recommendations</span>
              </div>
              <div className="space-y-2">
                {analysis?.suggestions.map((sug, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-800 flex items-start space-x-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="mt-0.5">{sug}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hashtags & Readability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
              
              {/* Hashtags */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1 font-semibold text-slate-700">
                  <Hash className="w-4 h-4 text-indigo-500" />
                  <span>Suggested Hashtags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis?.hashtags.map((tag, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 font-medium rounded-md hover:bg-slate-200">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Readability */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1 font-semibold text-slate-700">
                  <BookOpen className="w-4 h-4 text-violet-500" />
                  <span>Readability Score: {analysis?.readability?.score}/100</span>
                </div>
                <p className="text-slate-600 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {analysis?.readability?.feedback}
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
