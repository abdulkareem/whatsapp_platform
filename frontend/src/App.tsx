import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AppManagementPage from './pages/AppManagementPage';
import MessageLogsPage from './pages/MessageLogsPage';
import BroadcastPage from './pages/BroadcastPage';
import OtpMonitoringPage from './pages/OtpMonitoringPage';
import AdminLoginPage from './pages/AdminLoginPage';
import WorkflowsPage from './pages/WorkflowsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import { auth } from './services/auth';
import ShopLoginPage from './pages/ShopLoginPage';
import ShopDashboardPage from './pages/ShopDashboardPage';
import { shopAuth } from './services/shopAuth';

const navItems = [
  ['/dashboard', 'Gateway Health'],
  ['/apps', 'App Management'],
  ['/logs', 'Message Logs'],
  ['/broadcast', 'Broadcast Tool'],
  ['/otp', 'OTP Monitoring'],
  ['/workflows', 'Workflows'],
  ['/analytics', 'Analytics'],
  ['/settings', 'Settings']
] as const;

function AppLayout() {
  const navigate = useNavigate();

  const logout = () => {
    auth.clearToken();
    navigate('/login');
  };

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
          <button className="mt-6 w-full rounded border px-2 py-1 text-sm" onClick={logout} type="button">
            Logout
          </button>
        </aside>
        <main>
          <Routes>
            <Route path="/" element={<Navigate replace to="/dashboard" />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/apps" element={<AppManagementPage />} />
            <Route path="/logs" element={<MessageLogsPage />} />
            <Route path="/broadcast" element={<BroadcastPage />} />
            <Route path="/otp" element={<OtpMonitoringPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => auth.isLoggedIn());
  const [shopLoggedIn, setShopLoggedIn] = useState(() => shopAuth.isLoggedIn());

  useEffect(() => auth.subscribe(() => setLoggedIn(auth.isLoggedIn())), []);
  useEffect(() => shopAuth.subscribe(() => setShopLoggedIn(shopAuth.isLoggedIn())), []);

  return (
    <Routes>
      <Route path="/login" element={loggedIn ? <Navigate replace to="/dashboard" /> : <AdminLoginPage />} />
      <Route path="/shop/login" element={shopLoggedIn ? <Navigate replace to="/shop/dashboard" /> : <ShopLoginPage />} />
      <Route path="/shop/dashboard" element={shopLoggedIn ? <ShopDashboardPage /> : <Navigate replace to="/shop/login" />} />
      <Route path="/*" element={loggedIn ? <AppLayout /> : <Navigate replace to="/login" />} />
    </Routes>
  );
}
