'use client';

import { Download, X, Calendar } from 'lucide-react';
import { useState } from 'react';

interface CsvExportButtonProps {
  label: string;
  fetchData: (params?: { from?: string; to?: string }) => Promise<any[]>;
  filename?: string;
  fields?: string[];
}

export default function CsvExportButton({ label, fetchData, filename = 'export', fields }: CsvExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const handleExport = async (dateRange?: { from?: string; to?: string }) => {
    setLoading(true);
    setShowModal(false);
    try {
      const data = await fetchData(dateRange);

      if (!data || data.length === 0) {
        alert('No data to export.');
        setLoading(false);
        return;
      }

      const keys = fields || Object.keys(data[0]);
      const csvRows = [keys.join(',')];

      data.forEach((item: any) => {
        const values = keys.map(key => {
          let val = item[key];
          if (val === null || val === undefined) return '';
          val = String(val);
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            val = '"' + val.replace(/"/g, '""') + '"';
          }
          return val;
        });
        csvRows.push(values.join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${dateRange?.from || 'all'}-to-${dateRange?.to || today}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
      alert('Failed to export CSV. Check console for details.');
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-medium transition-colors disabled:opacity-50"
      >
        <Download className="w-3.5 h-3.5" />
        {loading ? 'Exporting...' : label}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Export {label}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Select a date range to filter records by{' '}
              <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">createdAt</code>.
              Leave blank to export all cached records (last 30 days).
            </p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  max={toDate || today}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mhma-forest/30 focus:border-mhma-forest"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  max={today}
                  min={fromDate || ninetyDaysAgo}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mhma-forest/30 focus:border-mhma-forest"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                  handleExport(undefined);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Export All
              </button>
              <button
                onClick={() => handleExport({ from: fromDate || undefined, to: toDate || undefined })}
                disabled={!fromDate && !toDate}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-mhma-forest hover:bg-mhma-forest-light rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-4 h-4" /> Export Range
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
