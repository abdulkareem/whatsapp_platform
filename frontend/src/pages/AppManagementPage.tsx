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
  sessionEnabled: boolean;
  sessionTimeoutMinutes: string;
  keywordRequired: boolean;
  defaultApp: boolean;
  fallbackMessage: string;
}

const initialForm: AppFormState = {
  name: '',
  keyword: '',
  endpoint: '',
  rateLimitRpm: '100',
  sessionEnabled: true,
  sessionTimeoutMinutes: '15',
  keywordRequired: true,
  defaultApp: false,
  fallbackMessage: ''
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
    const sessionTimeout = Number(form.sessionTimeoutMinutes);

    return (
      Boolean(trimmedName) &&
      Boolean(trimmedEndpoint) &&
      keywordPattern.test(trimmedKeyword) &&
      Number.isInteger(normalizedRateLimit) &&
      normalizedRateLimit > 0 &&
      Number.isInteger(sessionTimeout) &&
      sessionTimeout > 0
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
          rateLimitRpm: Number(form.rateLimitRpm),
          sessionEnabled: form.sessionEnabled,
          sessionTimeoutMinutes: Number(form.sessionTimeoutMinutes),
          keywordRequired: form.keywordRequired,
          defaultApp: form.defaultApp,
          fallbackMessage: form.fallbackMessage.trim() || null
        },
        { headers: { 'X-ADMIN-TOKEN': token ?? '' } }
      );

      setStatus('External app connected with routing configuration.');
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

  const updateRoutingConfig = async (app: AppRecord) => {
    setStatus(null);
    setError(null);

    try {
      const token = auth.getToken();
      await api.patch(
        `/api/apps/${app.id}/config`,
        {
          rateLimitRpm: app.rateLimitRpm,
          sessionEnabled: app.sessionEnabled,
          sessionTimeoutMinutes: app.sessionTimeoutMinutes,
          keywordRequired: app.keywordRequired,
          defaultApp: app.defaultApp,
          fallbackMessage: app.fallbackMessage || null
        },
        { headers: { 'X-ADMIN-TOKEN': token ?? '' } }
      );

      setStatus(`Updated routing config for ${app.name}.`);
      await loadApps();
    } catch {
      setError(`Failed to update routing config for ${app.name}.`);
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
      </div>

      <form className="rounded-lg border bg-white p-4" onSubmit={createApp}>
        <div className="grid gap-4 md:grid-cols-2">
          <input className="w-full rounded border px-3 py-2" onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="App Name" required value={form.name} />
          <input className="w-full rounded border px-3 py-2 uppercase" maxLength={24} onChange={(e) => setForm((prev) => ({ ...prev, keyword: e.target.value.toUpperCase().replace(/\s+/g, '') }))} pattern="[A-Z0-9_]+" placeholder="Keyword" required value={form.keyword} />
          <input className="w-full rounded border px-3 py-2 md:col-span-2" onChange={(e) => setForm((prev) => ({ ...prev, endpoint: e.target.value }))} placeholder="Endpoint" required type="url" value={form.endpoint} />
          <input className="w-full rounded border px-3 py-2" min={1} onChange={(e) => setForm((prev) => ({ ...prev, rateLimitRpm: e.target.value }))} placeholder="Rate limit" required step={1} type="number" value={form.rateLimitRpm} />

          <div className="space-y-2 rounded border p-3 md:col-span-2">
            <h3 className="text-sm font-semibold">Routing Options</h3>
            <label className="flex items-center gap-2"><input checked={form.sessionEnabled} onChange={(e) => setForm((prev) => ({ ...prev, sessionEnabled: e.target.checked }))} type="checkbox" />Enable Session Routing</label>
            <label className="block">Session Timeout (minutes)
              <input className="mt-1 w-full rounded border px-3 py-2" min={1} onChange={(e) => setForm((prev) => ({ ...prev, sessionTimeoutMinutes: e.target.value }))} type="number" value={form.sessionTimeoutMinutes} />
            </label>
            <label className="flex items-center gap-2"><input checked={form.keywordRequired} onChange={(e) => setForm((prev) => ({ ...prev, keywordRequired: e.target.checked }))} type="checkbox" />Require Keyword for Every Message</label>
            <label className="flex items-center gap-2"><input checked={form.defaultApp} onChange={(e) => setForm((prev) => ({ ...prev, defaultApp: e.target.checked }))} type="checkbox" />Set as Default App</label>
          </div>

          <label className="md:col-span-2">Fallback Message
            <textarea className="mt-1 w-full rounded border px-3 py-2" onChange={(e) => setForm((prev) => ({ ...prev, fallbackMessage: e.target.value }))} rows={3} value={form.fallbackMessage} />
          </label>

          <button className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-400 md:col-span-2" disabled={!canSubmit} type="submit">Connect App</button>
        </div>
      </form>

      {status ? <p className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{status}</p> : null}
      {error ? <p className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr><th className="p-3 text-left">Name</th><th className="p-3 text-left">Keyword</th><th className="p-3 text-left">Endpoint</th><th className="p-3 text-left">Routing</th><th className="p-3 text-left">API Key</th></tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <tr key={app.id} className="border-t align-top">
                <td className="p-3">{app.name}</td>
                <td className="p-3 font-semibold">{app.keyword}</td>
                <td className="p-3 text-slate-700">{app.endpoint}</td>
                <td className="space-y-2 p-3">
                  <label className="flex items-center gap-1"><input checked={app.sessionEnabled} onChange={(e) => setApps((prev) => prev.map((item) => item.id === app.id ? { ...item, sessionEnabled: e.target.checked } : item))} type="checkbox" />Session</label>
                  <label className="flex items-center gap-1"><input checked={app.keywordRequired} onChange={(e) => setApps((prev) => prev.map((item) => item.id === app.id ? { ...item, keywordRequired: e.target.checked } : item))} type="checkbox" />Require keyword</label>
                  <label className="flex items-center gap-1"><input checked={app.defaultApp} onChange={(e) => setApps((prev) => prev.map((item) => item.id === app.id ? { ...item, defaultApp: e.target.checked } : item))} type="checkbox" />Default</label>
                  <input className="w-full rounded border px-2 py-1" min={1} onChange={(e) => setApps((prev) => prev.map((item) => item.id === app.id ? { ...item, sessionTimeoutMinutes: Number(e.target.value) } : item))} type="number" value={app.sessionTimeoutMinutes} />
                  <input className="w-full rounded border px-2 py-1" min={1} onChange={(e) => setApps((prev) => prev.map((item) => item.id === app.id ? { ...item, rateLimitRpm: Number(e.target.value) } : item))} type="number" value={app.rateLimitRpm} />
                  <textarea className="w-full rounded border px-2 py-1" onChange={(e) => setApps((prev) => prev.map((item) => item.id === app.id ? { ...item, fallbackMessage: e.target.value } : item))} rows={2} value={app.fallbackMessage ?? ''} />
                  <button className="rounded border px-2 py-1" onClick={() => void updateRoutingConfig(app)} type="button">Save Routing</button>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <code className="max-w-[180px] truncate rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">{`APP_API_KEY=${app.apiKey}`}</code>
                    <button className="rounded border px-2 py-1 text-xs" onClick={() => void copyApiKey(app.id, app.apiKey)} type="button">{copiedApiKeyId === app.id ? 'Copied' : 'Copy'}</button>
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
