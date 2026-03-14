import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { MessageLog } from '../types/shared';

type SortableKey = keyof Pick<
  MessageLog,
  'mobile' | 'message' | 'app' | 'direction' | 'status' | 'providerMessageId' | 'createdAt'
>;

type SortConfig = {
  key: SortableKey;
  direction: 'asc' | 'desc';
};

const defaultSort: SortConfig = { key: 'createdAt', direction: 'desc' };

const headers: Array<{ key: SortableKey; label: string }> = [
  { key: 'mobile', label: 'Sender' },
  { key: 'message', label: 'Message' },
  { key: 'app', label: 'Keyword / App' },
  { key: 'direction', label: 'Direction' },
  { key: 'status', label: 'Status' },
  { key: 'providerMessageId', label: 'Provider ID' },
  { key: 'createdAt', label: 'Time' }
];

export default function MessageLogsPage() {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [sort, setSort] = useState<SortConfig>(defaultSort);

  useEffect(() => {
    void api.get('/api/messages/logs').then((res) => setLogs(res.data));
  }, []);

  const sortedLogs = useMemo(() => {
    const items = [...logs];

    items.sort((a, b) => {
      const left = String(a[sort.key] ?? '').toLowerCase();
      const right = String(b[sort.key] ?? '').toLowerCase();

      const comparison = left.localeCompare(right, undefined, { numeric: true });
      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return items;
  }, [logs, sort]);

  const handleSort = (key: SortableKey) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }

      return { key, direction: key === 'createdAt' ? 'desc' : 'asc' };
    });
  };

  const sortMarker = (key: SortableKey) => {
    if (sort.key !== key) return '';
    return sort.direction === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Message Logs</h1>
      <p className="mb-4 text-sm text-slate-600">
        Showing latest logs with sender, message, keyword/app name, time, and delivery details.
      </p>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((header) => (
                <th key={header.key} className="px-4 py-3 font-semibold text-slate-700">
                  <button
                    className="inline-flex items-center whitespace-nowrap hover:text-slate-900"
                    onClick={() => handleSort(header.key)}
                    type="button"
                  >
                    {header.label}
                    {sortMarker(header.key)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {sortedLogs.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={headers.length}>
                  No message logs available.
                </td>
              </tr>
            ) : (
              sortedLogs.map((log) => (
                <tr key={log.id} className="align-top hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium text-slate-800">{log.mobile}</td>
                  <td className="max-w-lg px-4 py-3 text-slate-800">{log.message}</td>
                  <td className="px-4 py-3 text-slate-700">{log.app}</td>
                  <td className="px-4 py-3 capitalize text-slate-700">{log.direction}</td>
                  <td className="px-4 py-3 capitalize text-slate-700">{log.status}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{log.providerMessageId || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
