import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';
import { shopAuth } from '../services/shopAuth';

type Overview = {
  credits: number;
  contactsTotal: number;
  optOutTotal: number;
  campaigns: number;
  deliveredCount: number;
  readCount: number;
  shop?: { name?: string };
};

export default function ShopDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [name, setName] = useState('Weekly Offer');
  const [templateName, setTemplateName] = useState('daily_deal_template');
  const [variables, setVariables] = useState("Mario's Pizza,50% off on Veg Pizzas");
  const [audienceCount, setAudienceCount] = useState(100);
  const [message, setMessage] = useState('');

  const token = shopAuth.getToken();

  const load = async () => {
    const res = await api.get('/api/shops/overview', { headers: { 'X-SHOP-TOKEN': token ?? '' } });
    setOverview(res.data);
  };

  useEffect(() => {
    void load();
  }, []);

  const createCampaign = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    try {
      await api.post('/api/shops/campaigns', {
        name,
        templateName,
        variables: variables.split(',').map((item) => item.trim()).filter(Boolean),
        audienceCount
      }, { headers: { 'X-SHOP-TOKEN': token ?? '' } });
      setMessage('Campaign created and credits deducted.');
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.error ?? 'Failed to create campaign');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Shop Dashboard</h1>
      <p className="text-sm text-slate-600">{overview?.shop?.name ?? 'Your Shop'} • Credits: {overview?.credits ?? 0}</p>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded border bg-white p-3">Contacts: {overview?.contactsTotal ?? 0}</div>
        <div className="rounded border bg-white p-3">Opt-outs: {overview?.optOutTotal ?? 0}</div>
        <div className="rounded border bg-white p-3">Delivered: {overview?.deliveredCount ?? 0}</div>
        <div className="rounded border bg-white p-3">Read: {overview?.readCount ?? 0}</div>
      </div>

      <form className="space-y-3 rounded border bg-white p-4" onSubmit={createCampaign}>
        <h2 className="text-lg font-semibold">Create Template Campaign</h2>
        <input className="w-full rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" required />
        <input className="w-full rounded border px-3 py-2" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template name" required />
        <input className="w-full rounded border px-3 py-2" value={variables} onChange={(e) => setVariables(e.target.value)} placeholder="Variables, comma separated" />
        <input className="w-full rounded border px-3 py-2" type="number" min={1} value={audienceCount} onChange={(e) => setAudienceCount(Number(e.target.value))} />
        <button className="rounded bg-emerald-600 px-3 py-2 text-white">Create Campaign</button>
      </form>
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
