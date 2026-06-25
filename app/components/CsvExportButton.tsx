'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';

interface CsvExportButtonProps {
  label: string;
  fetchData: () => Promise<any[]>;
  filename?: string;
  fields?: string[];
}

export default function CsvExportButton({ label, fetchData, filename = 'export', fields }: CsvExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await fetchData();

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
      a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
      alert('Failed to export CSV. Check console for details.');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-medium transition-colors disabled:opacity-50"
    >
      <Download className="w-3.5 h-3.5" />
      {loading ? 'Exporting...' : label}
    </button>
  );
}
