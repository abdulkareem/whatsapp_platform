import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { MessageLog } from '../types';

export default function MessageLogsPage() {
  const [logs, setLogs] = useState<MessageLog[]>([]);

  useEffect(() => {
    void api.get('/api/messages/logs').then((res) => setLogs(res.data));
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Message Logs</h1>
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="rounded-lg border bg-white p-3">
            <p className="text-sm text-slate-600">{log.mobile} • {log.app} • {log.direction}</p>
            <p className="font-medium">{log.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
