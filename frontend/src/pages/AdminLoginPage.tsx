import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { auth } from '../services/auth';

const ADMIN_NUMBER = '9747917623';
const BUSINESS_NUMBER = '9744917623';
const WHATSAPP_VERIFY_URL = `https://wa.me/${BUSINESS_NUMBER}?text=${encodeURIComponent('hi')}`;

export default function AdminLoginPage() {
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const normalizedMobile = useMemo(() => mobile.replace(/\D/g, ''), [mobile]);
  const isAdminNumber = normalizedMobile === ADMIN_NUMBER;

  const openWhatsAppVerification = () => {
    window.open(WHATSAPP_VERIFY_URL, '_blank', 'noopener,noreferrer');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isAdminNumber) {
      setError('Only the admin number is allowed to login.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/admin/login', { pin });
      auth.setToken(response.data.token);
      navigate('/');
    } catch {
      setError('Invalid 4-digit PIN. Send "hi" to the business WhatsApp and use the received PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-20 max-w-md rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-2 text-2xl font-bold">Admin Login</h1>
      <p className="mb-4 text-sm text-slate-600">
        Enter the admin WhatsApp number first. Only {ADMIN_NUMBER} can login. Use Verify to open WhatsApp,
        send <strong>hi</strong> to {BUSINESS_NUMBER}, then login with the 4-digit PIN you receive.
      </p>

      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="mobile">
            WhatsApp Number (Admin)
          </label>
          <input
            id="mobile"
            className="w-full rounded border px-3 py-2"
            inputMode="numeric"
            maxLength={10}
            onChange={(event) => setMobile(event.target.value)}
            placeholder="Enter WhatsApp number"
            required
            type="text"
            value={mobile}
          />
          {!isAdminNumber && mobile ? (
            <p className="mt-1 text-xs text-amber-700">Only {ADMIN_NUMBER} is allowed.</p>
          ) : null}
        </div>

        {isAdminNumber ? (
          <>
            <button
              className="w-full rounded border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800"
              onClick={openWhatsAppVerification}
              type="button"
            >
              Verify via WhatsApp
            </button>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="pin">
                4-digit PIN
              </label>
              <input
                id="pin"
                className="w-full rounded border px-3 py-2"
                inputMode="numeric"
                maxLength={4}
                minLength={4}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
                pattern="[0-9]{4}"
                required
                type="password"
                value={pin}
              />
            </div>

            <button
              className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </div>
  );
}
