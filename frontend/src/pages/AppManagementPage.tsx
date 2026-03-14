import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';
import { auth } from '../services/auth';
import type { AppRecord } from '../types/shared';

interface AppFormState {
  name: string;
  keyword: string;
  endpoint: string;
  rateLimitRpm: string;
}

const initialForm: AppFormState = {
  name: '',
  keyword: '',
  endpoint: '',
  rateLimitRpm: '100'
};

export default function AppManagementPage() {
  const [apps, setApps] = useState<AppRecord[]>([]);
  const [form, setForm] = useState<AppFormState>(initialForm);
  const [status, setStatus] = useState<string | null>(null);

  const loadApps = async () => {
    const response = await api.get('/api/apps');
    setApps(response.data);
  };

  useEffect(() => {
    void loadApps();
  }, []);

  const createApp = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);

    try {
      const token = auth.getToken();

      await api.post(
        '/api/apps',
        {
          name: form.name,
          keyword: form.keyword,
          endpoint: form.endpoint,
          rateLimitRpm: Number(form.rateLimitRpm)
        },
        { headers: { 'X-ADMIN-TOKEN': token ?? '' } }
      );

      setStatus('External app connected successfully. Share the API key with your app backend.');
      setForm(initialForm);
      await loadApps();
    } catch {
      setStatus('Failed to connect external app. Verify admin session and endpoint URL.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold">App Management</h1>
        <p className="text-sm text-slate-600">
          Connect external applications by registering a routing keyword and webhook endpoint.
        </p>
      </div>

      <form className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-2" onSubmit={createApp}>
        <input
          className="rounded border px-3 py-2"
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="App name (e.g. CRM Portal)"
          required
          value={form.name}
        />
        <input
          className="rounded border px-3 py-2"
          onChange={(e) => setForm((prev) => ({ ...prev, keyword: e.target.value.toUpperCase() }))}
          placeholder="Keyword (e.g. CRM)"
          required
          value={form.keyword}
        />
        <input
          className="rounded border px-3 py-2 md:col-span-2"
          onChange={(e) => setForm((prev) => ({ ...prev, endpoint: e.target.value }))}
          placeholder="External endpoint (https://your-app.com/webhooks/whatsapp)"
          required
          type="url"
          value={form.endpoint}
        />
        <input
          className="rounded border px-3 py-2"
          min={1}
          onChange={(e) => setForm((prev) => ({ ...prev, rateLimitRpm: e.target.value }))}
          placeholder="Rate limit rpm"
          type="number"
          value={form.rateLimitRpm}
        />
        <button className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white" type="submit">
          Connect App
        </button>
      </form>

      {status ? <p className="text-sm text-slate-700">{status}</p> : null}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Keyword</th>
              <th className="p-3 text-left">Endpoint</th>
              <th className="p-3 text-left">Rate Limit</th>
              <th className="p-3 text-left">API Key</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <tr key={app.id} className="border-t align-top">
                <td className="p-3">{app.name}</td>
                <td className="p-3 font-semibold">{app.keyword}</td>
                <td className="p-3">{app.endpoint}</td>
                <td className="p-3">{app.rateLimitRpm}/min</td>
                <td className="p-3 font-mono text-xs">{app.apiKey}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
