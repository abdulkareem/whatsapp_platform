import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import { api } from '../services/api';
import type { AppRecord, MessageLog } from '@whatsapp-platform/shared';

export default function DashboardPage() {
  const [apps, setApps] = useState<AppRecord[]>([]);
  const [logs, setLogs] = useState<MessageLog[]>([]);

  useEffect(() => {
    void api.get('/api/apps').then((res) => setApps(res.data));
    void api.get('/api/messages/logs').then((res) => setLogs(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gateway Health</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Registered Apps" value={apps.length} />
        <StatCard title="Recent Messages" value={logs.length} />
        <StatCard title="Status" value="Operational" />
      </div>
    </div>
  );
}
