import { FormEvent, useState } from 'react';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { shopAuth } from '../services/shopAuth';

export default function ShopLoginPage() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const sendOtp = async () => {
    setError(null);
    try {
      await api.post('/api/shop-auth/send-otp', { mobile });
      setOtpSent(true);
    } catch (error) {
      const fallback = 'Failed to send OTP.';
      if (error instanceof AxiosError) {
        setError(error.response?.data?.error ?? fallback);
      } else {
        setError(fallback);
      }
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/shop-auth/verify-otp', { mobile, otp });
      shopAuth.setToken(response.data.token);
      navigate('/shop/dashboard', { replace: true });
    } catch {
      setError('Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-20 max-w-md rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-2 text-2xl font-bold">Shop Owner Login</h1>
      <p className="mb-3 text-sm text-slate-600">Login with your WhatsApp number. OTP is sent to WhatsApp.</p>
      <form className="space-y-4" onSubmit={submit}>
        <input className="w-full rounded border px-3 py-2" placeholder="WhatsApp number" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
        <button type="button" className="w-full rounded border px-3 py-2" onClick={sendOtp}>{otpSent ? 'Resend OTP' : 'Send OTP'}</button>
        <input className="w-full rounded border px-3 py-2" placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} maxLength={6} required />
        <button className="w-full rounded bg-slate-900 px-3 py-2 text-white" disabled={loading}>{loading ? 'Verifying...' : 'Login'}</button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </div>
  );
}
