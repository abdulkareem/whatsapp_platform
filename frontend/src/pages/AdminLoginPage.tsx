import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { api } from '../services/api';
import { auth } from '../services/auth';

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase() || 'abdulkareem.t@gmail.com';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const isAdminEmail = normalizedEmail === ADMIN_EMAIL;

  const sendOtp = async () => {
    setError(null);

    if (!isAdminEmail) {
      setError(`Only ${ADMIN_EMAIL} is allowed to login.`);
      return;
    }

    setSendingOtp(true);
    try {
      await api.post('/api/admin/send-otp', { email: normalizedEmail });
      setOtpSent(true);
    } catch (error) {
      const fallback = 'Could not send OTP to the provided email.';
      if (error instanceof AxiosError) {
        setError(error.response?.data?.error ?? fallback);
      } else {
        setError(fallback);
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isAdminEmail) {
      setError(`Only ${ADMIN_EMAIL} is allowed to login.`);
      return;
    }

    if (!otpSent) {
      setError('Click Verify to send OTP first.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/admin/verify-otp', { email: normalizedEmail, otp });
      auth.setToken(response.data.token);
      navigate('/');
    } catch {
      setError('Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-20 max-w-md rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-2 text-2xl font-bold">Admin Login</h1>
      <p className="mb-4 text-sm text-slate-600">Login with admin email. OTP will be sent to your email.</p>

      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="email">
            Admin Email
          </label>
          <input
            id="email"
            className="w-full rounded border px-3 py-2"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter admin email"
            required
            type="email"
            value={email}
          />
          {!isAdminEmail && email ? (
            <p className="mt-1 text-xs text-amber-700">Only {ADMIN_EMAIL} is allowed.</p>
          ) : null}
        </div>

        <button
          className="w-full rounded border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800"
          onClick={sendOtp}
          type="button"
        >
          {sendingOtp ? 'Sending OTP...' : 'Verify'}
        </button>

        {otpSent ? (
          <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900">
            6-digit OTP sent to {normalizedEmail}.
          </div>
        ) : null}

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

        <button className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white" disabled={loading}>
          {loading ? 'Verifying...' : 'Login'}
        </button>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </div>
  );
}
