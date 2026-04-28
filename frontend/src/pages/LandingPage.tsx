import { Link } from 'react-router-dom';

const menuItems = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#workflow' },
  { label: 'Pricing & Payment', href: '#pricing' }
] as const;

const features = [
  'Admin login with complete platform controls and campaign visibility.',
  'Shop user login to access dashboard and launch sponsored broadcasts.',
  'CSV upload-ready workflow to send bulk messages with name + number personalization.',
  'Contact list integration flow for mobile numbers and repeat customer outreach.',
  'Template campaigns, analytics, delivery monitoring, and opt-out safety workflow.'
] as const;

const plans = [
  {
    name: 'Starter',
    price: '₹1,299 / month',
    points: ['1 broadcast / month', 'Up to 500 customers', 'Dashboard analytics', 'UPI / Card payment support']
  },
  {
    name: 'Growth',
    price: '₹4,499 / month',
    points: ['4 broadcasts / month', 'Up to 2,000 customers', 'Priority queue & reports', 'Campaign scheduling']
  },
  {
    name: 'Sponsored Slot',
    price: '₹1.50 / delivered msg',
    points: ['Deal-of-the-day slot selling', 'Pay-per-send model', 'Credit-based wallet support', 'Read & click tracking']
  }
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-50 text-slate-900" id="home">
      <header className="sticky top-0 z-20 border-b border-sky-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-black tracking-tight text-emerald-700">WhatsApp Broadcast Pro</h1>
          <nav className="hidden items-center gap-4 text-sm md:flex">
            {menuItems.map((item) => (
              <a className="rounded px-2 py-1 font-medium text-slate-700 hover:bg-sky-100" href={item.href} key={item.label}>
                {item.label}
              </a>
            ))}
            <Link className="rounded bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700" to="/login">
              Admin Login
            </Link>
            <Link className="rounded bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500" to="/shop/login">
              User Login
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-14 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-emerald-100 px-4 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
              Sponsored Broadcast Engine
            </p>
            <h2 className="text-3xl font-black leading-tight text-slate-900 md:text-5xl">
              Trusted bulk WhatsApp campaigns for growing local businesses.
            </h2>
            <p className="rounded-xl border-l-4 border-emerald-500 bg-white p-4 text-lg font-semibold leading-relaxed text-slate-800 shadow-sm">
              നിങ്ങൾുടെ customersinu bulk message അയയ്ക്കുമ്പോൾ നിങ്ങള്‍റെ WhatsApp block ആകുന്നുണ്ടോ? ഞങ്ങള്‍ നിങ്ങള്‍റെ
              message അയക്കാം.. നിങ്ങള്‍ക്ക് വേണ്ടി നിങ്ങള്‍റെ customersinu, എത്ര വേണമെങ്കിലും അയക്കാം...
            </p>
            <p className="text-sm text-slate-600">
              Login, upload contacts, run compliant campaigns, and manage customer communication from one safe
              dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500" to="/shop/login">
                Start User Dashboard
              </Link>
              <Link className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50" to="/login">
                Open Admin Panel
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <img
              alt="Business owner managing mobile campaigns"
              className="h-56 w-full rounded-2xl object-cover shadow-lg"
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80"
            />
            <img
              alt="Team analyzing marketing performance dashboard"
              className="h-56 w-full rounded-2xl object-cover shadow-lg"
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80"
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-12" id="features">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-8">
            <h3 className="text-2xl font-extrabold text-slate-900">Platform Menus & Core Capabilities</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {features.map((item) => (
                <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm font-medium text-slate-700" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-12" id="workflow">
          <div className="grid gap-4 md:grid-cols-3">
            {['1. Login & Upload', '2. Build Campaign', '3. Send & Track'].map((title, index) => (
              <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100" key={title}>
                <h4 className="text-lg font-bold text-slate-900">{title}</h4>
                <p className="mt-2 text-sm text-slate-600">
                  {index === 0
                    ? 'Users sign in, upload CSV files with names and numbers, and sync opt-in contact groups.'
                    : index === 1
                      ? 'Choose approved templates, personalize variables, and schedule sponsored broadcasts safely.'
                      : 'Monitor delivered/read stats, stop-updates compliance, and campaign ROI from analytics.'}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-16" id="pricing">
          <h3 className="text-center text-2xl font-extrabold text-slate-900">Payment & Monetization Plans</h3>
          <p className="mt-2 text-center text-sm text-slate-600">
            Enable subscription billing, pay-per-send charging, and prepaid credit wallet models for all shop users.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <article className="rounded-xl bg-white p-5 shadow-md ring-1 ring-emerald-100" key={plan.name}>
                <h4 className="text-lg font-bold text-emerald-700">{plan.name}</h4>
                <p className="mt-1 text-2xl font-black text-slate-900">{plan.price}</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {plan.points.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
