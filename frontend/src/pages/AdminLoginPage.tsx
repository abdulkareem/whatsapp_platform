import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { auth } from '../services/auth';

export default function AdminLoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/api/admin/login', { pin });
      auth.setToken(response.data.token);
      navigate('/');
    } catch {
      setError('Invalid PIN. Please use the WhatsApp admin PIN configured on the backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-20 max-w-md rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-2 text-2xl font-bold">Admin Login</h1>
      <p className="mb-4 text-sm text-slate-600">
        Login with your WhatsApp platform admin PIN to manage external app integrations.
      </p>
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="pin">
            WhatsApp Admin PIN
          </label>
          <input
            id="pin"
            className="w-full rounded border px-3 py-2"
            maxLength={12}
            onChange={(event) => setPin(event.target.value)}
            required
            type="password"
            value={pin}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
