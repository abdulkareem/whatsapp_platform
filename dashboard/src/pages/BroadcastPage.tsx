import { FormEvent, useState } from 'react';
import { api } from '../services/api';

export default function BroadcastPage() {
  const [mobiles, setMobiles] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      mobiles: mobiles.split('\n').map((item) => item.trim()).filter(Boolean),
      message
    };

    await api.post('/api/broadcast', payload, {
      headers: {
        'X-APP-KEY': (import.meta.env.VITE_DEFAULT_APP_KEY as string) || ''
      }
    });

    setStatus('Broadcast queued successfully');
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Broadcast Tool</h1>
      <form className="space-y-4 rounded-lg border bg-white p-4" onSubmit={submit}>
        <textarea
          className="w-full rounded border p-2"
          rows={5}
          placeholder="One mobile per line"
          value={mobiles}
          onChange={(event) => setMobiles(event.target.value)}
        />
        <textarea
          className="w-full rounded border p-2"
          rows={4}
          placeholder="Message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <button className="rounded bg-emerald-600 px-4 py-2 text-white">Queue Broadcast</button>
        {status && <p className="text-sm text-emerald-700">{status}</p>}
      </form>
    </div>
  );
}
