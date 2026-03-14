import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { AppRecord } from '../types/shared';

export default function AppManagementPage() {
  const [apps, setApps] = useState<AppRecord[]>([]);

  useEffect(() => {
    void api.get('/api/apps').then((res) => setApps(res.data));
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">App Management</h1>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Keyword</th>
              <th className="p-3 text-left">Endpoint</th>
              <th className="p-3 text-left">Rate Limit</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <tr key={app.id} className="border-t">
                <td className="p-3">{app.name}</td>
                <td className="p-3">{app.keyword}</td>
                <td className="p-3">{app.endpoint}</td>
                <td className="p-3">{app.rateLimitRpm}/min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
