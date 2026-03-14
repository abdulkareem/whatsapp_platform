import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { auth } from '../services/auth';

const ADMIN_NUMBER = '9747917623';
const BUSINESS_NUMBER = '9744917623';

export default function AdminLoginPage() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const deviceId = auth.getOrCreateDeviceId();
  const normalizedMobile = useMemo(() => mobile.replace(/\D/g, ''), [mobile]);
  const isAdminNumber = normalizedMobile === ADMIN_NUMBER;
  const whatsappVerifyUrl = `https://wa.me/${BUSINESS_NUMBER}?text=${encodeURIComponent(`hi ${deviceId}`)}`;

  const openWhatsAppVerification = () => {
    window.open(whatsappVerifyUrl, '_blank', 'noopener,noreferrer');
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
      const response = await api.post('/api/admin/verify-otp', {
        mobile: normalizedMobile,
        otp,
        deviceId
      });
      auth.setToken(response.data.token);
      navigate('/');
    } catch {
      setError('Invalid or expired OTP. Send "hi" using Verify button and enter the latest 6-digit OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-20 max-w-md rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-2 text-2xl font-bold">Admin Login</h1>
      <p className="mb-4 text-sm text-slate-600">
        Enter the admin WhatsApp number first. Only {ADMIN_NUMBER} can login. Tap Verify to open WhatsApp,
        send <strong>hi {deviceId}</strong> to {BUSINESS_NUMBER}, then use the received 6-digit OTP.
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
            <div className="rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
              Device ID: <span className="font-mono">{deviceId}</span>
            </div>

            <button
              className="w-full rounded border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800"
              onClick={openWhatsAppVerification}
              type="button"
            >
              Verify via WhatsApp
            </button>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="otp">
                6-digit OTP
              </label>
              <input
                id="otp"
                className="w-full rounded border px-3 py-2"
                inputMode="numeric"
                maxLength={6}
                minLength={6}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                pattern="[0-9]{6}"
                required
                type="password"
                value={otp}
              />
            </div>

            <button
              className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Login'}
            </button>
          </>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </div>
  );
}
