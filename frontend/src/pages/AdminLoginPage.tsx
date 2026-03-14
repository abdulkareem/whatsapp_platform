import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { auth } from '../services/auth';

const ADMIN_NUMBER = '9747917623';
const BUSINESS_NUMBER = '9744917623';

export default function AdminLoginPage() {
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requiresWhatsappVerification, setRequiresWhatsappVerification] = useState(true);
  const [checkingLoginFlow, setCheckingLoginFlow] = useState(false);
  const navigate = useNavigate();

  const deviceId = auth.getOrCreateDeviceId();
  const normalizedMobile = useMemo(() => mobile.replace(/\D/g, ''), [mobile]);
  const isAdminNumber = normalizedMobile === ADMIN_NUMBER;
  const whatsappVerifyUrl = `https://wa.me/${BUSINESS_NUMBER}?text=${encodeURIComponent('hi')}`;

  const openWhatsAppVerification = () => {
    window.open(whatsappVerifyUrl, '_blank', 'noopener,noreferrer');
  };

  const checkLoginRequirement = async () => {
    if (!isAdminNumber) {
      setRequiresWhatsappVerification(true);
      return;
    }

    setCheckingLoginFlow(true);
    setError(null);

    try {
      const response = await api.post('/api/admin/login-requirement', {
        mobile: normalizedMobile,
        deviceId
      });
      setRequiresWhatsappVerification(Boolean(response.data.requiresWhatsappVerification));
    } catch {
      setRequiresWhatsappVerification(true);
      setError('Could not check login mode. Please try again.');
    } finally {
      setCheckingLoginFlow(false);
    }
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
      const endpoint = requiresWhatsappVerification ? '/api/admin/verify-otp' : '/api/admin/verify-pin';
      const payload = requiresWhatsappVerification
        ? { mobile: normalizedMobile, otp: pin, deviceId }
        : { mobile: normalizedMobile, pin, deviceId };

      const response = await api.post(endpoint, payload);
      auth.setToken(response.data.token);
      navigate('/');
    } catch {
      setError(
        requiresWhatsappVerification
          ? 'Invalid or expired OTP. Send "hi" from WhatsApp and enter the latest 6-digit code.'
          : 'Invalid 6-digit PIN for this device.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-20 max-w-md rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-2 text-2xl font-bold">Admin Login</h1>
      <p className="mb-4 text-sm text-slate-600">
        Enter admin WhatsApp number first. Only {ADMIN_NUMBER} can login.
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
            onBlur={checkLoginRequirement}
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
            {checkingLoginFlow ? <p className="text-xs text-slate-500">Checking login mode...</p> : null}

            {requiresWhatsappVerification ? (
              <>
                <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900">
                  New device detected. Send <strong>hi</strong> to {BUSINESS_NUMBER} on WhatsApp to get OTP.
                </div>
                <button
                  className="w-full rounded border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800"
                  onClick={openWhatsAppVerification}
                  type="button"
                >
                  Verify via WhatsApp
                </button>
              </>
            ) : (
              <div className="rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">
                Known device detected. Enter your 6-digit PIN to login.
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="pin">
                6-digit PIN
              </label>
              <input
                id="pin"
                className="w-full rounded border px-3 py-2"
                inputMode="numeric"
                maxLength={6}
                minLength={6}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
                pattern="[0-9]{6}"
                required
                type="password"
                value={pin}
              />
            </div>

            <button
              className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
              disabled={loading || checkingLoginFlow}
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
