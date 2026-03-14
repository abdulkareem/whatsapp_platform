import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
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

const keywordPattern = /^[A-Z0-9_]+$/;

export default function AppManagementPage() {
  const [apps, setApps] = useState<AppRecord[]>([]);
  const [form, setForm] = useState<AppFormState>(initialForm);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedApiKeyId, setCopiedApiKeyId] = useState<number | null>(null);

  const loadApps = async () => {
    const response = await api.get('/api/apps');
    setApps(response.data);
  };

  useEffect(() => {
    void loadApps();
  }, []);

  const canSubmit = useMemo(() => {
    const trimmedName = form.name.trim();
    const trimmedKeyword = form.keyword.trim();
    const trimmedEndpoint = form.endpoint.trim();
    const normalizedRateLimit = Number(form.rateLimitRpm);

    return (
      Boolean(trimmedName) &&
      Boolean(trimmedEndpoint) &&
      keywordPattern.test(trimmedKeyword) &&
      Number.isInteger(normalizedRateLimit) &&
      normalizedRateLimit > 0
    );
  }, [form]);

  const createApp = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setError(null);

    try {
      const token = auth.getToken();

      await api.post(
        '/api/apps',
        {
          name: form.name.trim(),
          keyword: form.keyword.trim().toUpperCase(),
          endpoint: form.endpoint.trim(),
          rateLimitRpm: Number(form.rateLimitRpm)
        },
        { headers: { 'X-ADMIN-TOKEN': token ?? '' } }
      );

      setStatus('External app connected successfully. Copy APP_API_KEY format for your backend, messaging flows, and AI chatbot integration.');
      setForm(initialForm);
      await loadApps();
    } catch (error) {
      if (error instanceof AxiosError) {
        const statusCode = error.response?.status;
        const backendError = error.response?.data?.error;

        if (statusCode === 401 || statusCode === 403) {
          auth.clearToken();
          setError('Admin session expired. Please login again and reconnect your app.');
          return;
        }

        if (backendError) {
          setError(`Failed to connect external app: ${backendError}`);
          return;
        }
      }

      setError('Failed to connect external app. Verify admin session and endpoint URL.');
    }
  };

  const copyApiKey = async (id: number, apiKey: string) => {
    const backendEnvVariable = `APP_API_KEY=${apiKey}`;

    try {
      await navigator.clipboard.writeText(backendEnvVariable);
      setCopiedApiKeyId(id);
      setTimeout(() => {
        setCopiedApiKeyId((current) => (current === id ? null : current));
      }, 1500);
    } catch {
      setError('Unable to copy API key. Please copy manually.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold">App Management</h1>
        <p className="text-sm text-slate-600">
          Register partner apps with a routing keyword and secured webhook endpoint.
        </p>
      </div>

      <form className="rounded-lg border bg-white p-4" onSubmit={createApp}>
        <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          Fill this form to connect your external system. When a WhatsApp message starts with your keyword, this
          platform forwards the message to your external endpoint.
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-600">App name</span>
            <input
              className="w-full rounded border px-3 py-2"
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="PSMO CRM System"
              required
              value={form.name}
            />
            <p className="text-xs text-slate-500">Human-readable name, e.g. CRM Portal or Student Helpdesk.</p>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-600">Routing keyword</span>
            <input
              className="w-full rounded border px-3 py-2 uppercase"
              maxLength={24}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, keyword: e.target.value.toUpperCase().replace(/\s+/g, '') }))
              }
              pattern="[A-Z0-9_]+"
              placeholder="CRM"
              required
              title="Use only uppercase letters, numbers, and underscores."
              value={form.keyword}
            />
            <p className="text-xs text-slate-500">
              Routing trigger used as first token in message, e.g. keyword <strong>CRM</strong> routes message
              <strong> CRM check my invoice</strong>.
            </p>
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-600">Webhook endpoint</span>
            <input
              className="w-full rounded border px-3 py-2"
              onChange={(e) => setForm((prev) => ({ ...prev, endpoint: e.target.value }))}
              placeholder="https://your-backend.up.railway.app/webhooks/whatsapp"
              required
              type="url"
              value={form.endpoint}
            />
            <p className="text-xs text-slate-500">Must be a POST webhook URL that returns HTTP 200 within 5 seconds.</p>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-600">Rate limit (requests/min)</span>
            <input
              className="w-full rounded border px-3 py-2"
              min={1}
              onChange={(e) => setForm((prev) => ({ ...prev, rateLimitRpm: e.target.value }))}
              placeholder="100"
              required
              step={1}
              type="number"
              value={form.rateLimitRpm}
            />
            <p className="text-xs text-slate-500">Recommended: 60 (small), 100 (production), 500 (high traffic).</p>
          </label>

          <div className="flex items-end">
            <button
              className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={!canSubmit}
              type="submit"
            >
              Connect App
            </button>
          </div>
        </div>
      </form>

      {status ? <p className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{status}</p> : null}
      {error ? <p className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Keyword</th>
              <th className="p-3 text-left">Endpoint</th>
              <th className="p-3 text-left">Rate Limit</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">API Key</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <tr key={app.id} className="border-t align-top">
                <td className="p-3">{app.name}</td>
                <td className="p-3 font-semibold">{app.keyword}</td>
                <td className="p-3 text-slate-700">{app.endpoint}</td>
                <td className="p-3">{app.rateLimitRpm}/min</td>
                <td className="p-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      app.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {app.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <code className="max-w-[180px] truncate rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                      {`APP_API_KEY=${app.apiKey}`}
                    </code>
                    <button
                      className="rounded border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      onClick={() => void copyApiKey(app.id, app.apiKey)}
                      type="button"
                    >
                      {copiedApiKeyId === app.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
