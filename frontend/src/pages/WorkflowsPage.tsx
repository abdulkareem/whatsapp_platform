import { useEffect, useState } from 'react';
import { api } from '../services/api';

type Workflow = { id: number; name: string; triggerType: string; status: string };

export default function WorkflowsPage() {
  const [items, setItems] = useState<Workflow[]>([]);

  useEffect(() => {
    api.get('/api/workflows/1').then((res) => setItems(res.data)).catch(() => setItems([]));
  }, []);

  return (
    <section className="rounded-lg border bg-white p-6">
      <h1 className="text-xl font-semibold">Workflow Builder</h1>
      <p className="mt-2 text-sm text-slate-600">Create Zapier/n8n style triggers, conditions, and actions.</p>
      <div className="mt-4 space-y-2">
        {items.map((flow) => (
          <article className="rounded border p-3" key={flow.id}>
            <h3 className="font-medium">{flow.name}</h3>
            <p className="text-sm text-slate-500">Trigger: {flow.triggerType} · {flow.status}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
