import { useEffect, useState } from 'react';
import { api } from '../services/api';

type Overview = { messages: number; contacts: number; workflows: number };

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview>({ messages: 0, contacts: 0, workflows: 0 });

  useEffect(() => {
    api.get('/api/analytics/tenant/1/overview').then((res) => setOverview(res.data)).catch(() => undefined);
  }, []);

  return (
    <section className="rounded-lg border bg-white p-6">
      <h1 className="text-xl font-semibold">Analytics Dashboard</h1>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded border p-3">Messages: {overview.messages}</div>
        <div className="rounded border p-3">Contacts: {overview.contacts}</div>
        <div className="rounded border p-3">Workflows: {overview.workflows}</div>
      </div>
    </section>
  );
}
