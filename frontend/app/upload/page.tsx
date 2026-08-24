'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, Image as ImageIcon, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { uploadDocument, DocumentData } from '@/lib/api';
import { formatBytes } from '@/lib/utils';

type Stage = 'IDLE' | 'UPLOADING' | 'EXTRACTING' | 'ANALYZING' | 'SUCCESS' | 'ERROR';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [stage, setStage] = useState<Stage>('IDLE');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const MAX_SIZE_MB = 10;
  const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  const ALLOWED_EXTS = ['.pdf', '.png', '.jpg', '.jpeg'];

  const validateFile = (file: File): string | null => {
    if (!file || file.size === 0) {
      return 'Selected file is empty. Please select a valid document or image.';
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File size exceeds maximum limit of ${MAX_SIZE_MB}MB.`;
    }
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTS.includes(ext)) {
      return `Unsupported file format (${ext || file.type}). Please upload a PDF document or PNG/JPG image.`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    if (isSubmitting) return;
    setErrorMessage(null);
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSubmitting) setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (isSubmitting) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setStage('UPLOADING');
      setUploadProgress(0);
      setErrorMessage(null);

      const response = await uploadDocument(selectedFile, (progress) => {
        setUploadProgress(progress);
        if (progress >= 100) {
          setStage('EXTRACTING');
          setTimeout(() => {
            setStage('ANALYZING');
          }, 1200);
        }
      });

      setStage('SUCCESS');

      setTimeout(() => {
        router.push(`/documents/${response.data.id}`);
      }, 1000);

    } catch (err: any) {
      console.error('[UPLOAD ERROR]', err);
      setStage('ERROR');
      setIsSubmitting(false);
      setErrorMessage(
        err?.message || 'Unable to process document. Please upload a clear PDF or screenshot image.'
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Upload Content for Analysis
        </h1>
        <p className="text-slate-600 text-base max-w-2xl mx-auto">
          Upload your social media post screenshot, carousel slides, or draft PDF. We extract the text via OCR/PDF parsing and analyze viral engagement potential.
        </p>
      </div>

      {/* Main Dropzone Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-10 space-y-6">
        
        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 pb-4 border-b border-slate-100">
          <div className={`py-1 rounded ${stage === 'UPLOADING' ? 'text-indigo-600 font-bold border-b-2 border-indigo-600' : ''}`}>1. Upload</div>
          <div className={`py-1 rounded ${stage === 'EXTRACTING' ? 'text-indigo-600 font-bold border-b-2 border-indigo-600' : ''}`}>2. Text Extraction</div>
          <div className={`py-1 rounded ${stage === 'ANALYZING' ? 'text-indigo-600 font-bold border-b-2 border-indigo-600' : ''}`}>3. Content Analysis</div>
          <div className={`py-1 rounded ${stage === 'SUCCESS' ? 'text-emerald-600 font-bold border-b-2 border-emerald-600' : ''}`}>4. Results</div>
        </div>

        {/* Dropzone Area */}
        {stage === 'IDLE' || stage === 'ERROR' ? (
          <div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload document drag and drop area"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                dragActive
                  ? 'border-indigo-600 bg-indigo-50/60 scale-[1.01]'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleInputChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-indigo-100/80 flex items-center justify-center text-indigo-600 shadow-sm">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div>
                <p className="text-base font-semibold text-slate-800">
                  Drag and drop your file here, or <span className="text-indigo-600 hover:underline">browse</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports PDF documents and PNG, JPG, JPEG images (Up to 10MB)
                </p>
              </div>

              <div className="flex items-center space-x-6 text-xs text-slate-400 pt-2">
                <div className="flex items-center space-x-1">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>PDF Document</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ImageIcon className="w-4 h-4 text-violet-500" />
                  <span>Image OCR</span>
                </div>
              </div>
            </div>

            {/* Selected File Details */}
            {selectedFile && (
              <div className="mt-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedFile.type === 'application/pdf' ? (
                    <FileText className="w-8 h-8 text-indigo-600" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-violet-600" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedFile.type || 'Unknown type'} • {formatBytes(selectedFile.size)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleStartUpload}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition-all"
                >
                  <span>{isSubmitting ? 'Processing...' : 'Start Processing'}</span>
                  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Error Display */}
            {errorMessage && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Processing Error</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Processing Progress State */
          <div className="py-12 px-6 text-center space-y-6">
            {stage === 'UPLOADING' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 animate-pulse">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Uploading File...</h3>
                  <p className="text-xs text-slate-500 mt-1">{uploadProgress}% transferred</p>
                </div>
                <div className="w-full max-w-md mx-auto bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {stage === 'EXTRACTING' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Extracting Text...</h3>
                  <p className="text-xs text-slate-500 mt-1">Running OCR engine / PDF layout parser</p>
                </div>
              </div>
            )}

            {stage === 'ANALYZING' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Analyzing Content...</h3>
                  <p className="text-xs text-slate-500 mt-1">Generating engagement score, hooks, and actionable recommendations</p>
                </div>
              </div>
            )}

            {stage === 'SUCCESS' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Analysis Complete!</h3>
                  <p className="text-xs text-slate-500 mt-1">Redirecting to report details...</p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
