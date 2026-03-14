import { Link, Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AppManagementPage from './pages/AppManagementPage';
import MessageLogsPage from './pages/MessageLogsPage';
import BroadcastPage from './pages/BroadcastPage';
import OtpMonitoringPage from './pages/OtpMonitoringPage';

const navItems = [
  ['/', 'Gateway Health'],
  ['/apps', 'App Management'],
  ['/logs', 'Message Logs'],
  ['/broadcast', 'Broadcast Tool'],
  ['/otp', 'OTP Monitoring']
] as const;

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid max-w-7xl gap-6 p-6 md:grid-cols-[220px_1fr]">
        <aside className="rounded-lg border bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold">WA Platform</h2>
          <nav className="space-y-2">
            {navItems.map(([to, label]) => (
              <Link className="block rounded px-2 py-1 text-sm hover:bg-slate-100" key={to} to={to}>
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/apps" element={<AppManagementPage />} />
            <Route path="/logs" element={<MessageLogsPage />} />
            <Route path="/broadcast" element={<BroadcastPage />} />
            <Route path="/otp" element={<OtpMonitoringPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
