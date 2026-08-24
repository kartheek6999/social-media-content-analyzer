'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileCheck, 
  AlertTriangle, 
  UploadCloud, 
  Clock, 
  ArrowRight, 
  Loader2, 
  BarChart3, 
  Eye 
} from 'lucide-react';
import { fetchStats, fetchDocuments, StatsData, DocumentData } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentDocs, setRecentDocs] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sData, dData] = await Promise.all([fetchStats(), fetchDocuments()]);
      setStats(sData);
      setRecentDocs(dData.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
        <p className="text-slate-600 font-medium text-sm">Loading dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Title & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time social media document processing telemetry and analysis metrics.
          </p>
        </div>

        <Link
          href="/upload"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </Link>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Uploads</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">{stats?.total || 0}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Successfully Processed</span>
            <span className="text-3xl font-black text-emerald-600 mt-1 block">{stats?.completed || 0}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Failed Processing</span>
            <span className="text-3xl font-black text-red-600 mt-1 block">{stats?.failed || 0}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Queue</span>
            <span className="text-3xl font-black text-indigo-600 mt-1 block">{stats?.processing || 0}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Uploads Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-lg">Recent Document Processing</h2>
          <Link href="/history" className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {recentDocs.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <UploadCloud className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No documents processed yet</p>
            <p className="text-xs text-slate-400">Upload your first PDF or social media image to begin analysis.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Filename</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Uploaded</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 max-w-xs truncate">
                      {doc.originalFilename}
                    </td>
                    <td className="px-6 py-4 uppercase text-[10px] font-bold text-slate-500">
                      {doc.fileType.split('/')[1] || doc.fileType}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        doc.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        doc.status === 'FAILED' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {doc.analysis?.engagementScore ? `${doc.analysis.engagementScore}/100` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
