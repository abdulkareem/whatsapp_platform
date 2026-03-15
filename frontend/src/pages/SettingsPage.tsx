export default function SettingsPage() {
  return (
    <section className="rounded-lg border bg-white p-6">
      <h1 className="text-xl font-semibold">Settings & Billing</h1>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
        <li>Configure tenant-level RPM and API access keys.</li>
        <li>Manage Stripe subscription plan: Free, Starter, Business, Enterprise.</li>
        <li>Set WhatsApp Cloud API and webhook verification credentials.</li>
      </ul>
    </section>
  );
}
