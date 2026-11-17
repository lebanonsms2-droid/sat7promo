'use client';

import { useState, useEffect } from 'react';
import { getSettings, getUsers } from '@/lib/queries';
import { saveSettingsAction } from '@/app/actions';
import { Label, Input, Icon, Button } from '@/components/ui';

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(false);
  const [orgName, setOrgName] = useState('SAT-7 Promo Desk');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [admins, setAdmins] = useState(0);

  useEffect(() => {
    (async () => {
      const [s, u] = await Promise.all([getSettings(), getUsers()]);
      if (s) {
        setOrgName(s.org_name);
        setEmailNotifications(s.email_enabled);
        setWhatsappNotifications(s.whatsapp_enabled);
      }
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      setAdmins((u as any[]).filter((x) => x.role === 'Administrator' && x.active !== false).length);
    })();
  }, []);

  function applyTheme(next: 'light' | 'dark') {
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    try { localStorage.setItem('sat7-theme', next); } catch { /* storage unavailable */ }
  }

  async function handleSave() {
    setBusy(true); setError(null); setSaved(false);
    try {
      await saveSettingsAction({
        org_name: orgName,
        email_enabled: emailNotifications,
        whatsapp_enabled: whatsappNotifications,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) { setError(err?.message ?? 'Could not save settings.'); }
    finally { setBusy(false); }
  }

  return (
    <section className="p-4 md:p-6 max-w-[1600px] mx-auto fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="panel-head mb-1">Administration · Settings</p>
          <h1 className="text-2xl font-display font-bold">Settings</h1>
          <p className="text-xs text-text-faint mt-0.5">Configure the organization, notifications and appearance.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-teal">Settings saved.</span>}
          {error && <span className="text-xs text-red">{error}</span>}
          <Button onClick={handleSave} disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        {/* Organization */}
        <div className="panel p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-9 h-9 rounded-md bg-blue/15 text-blue flex items-center justify-center"><Icon name="settings" size={18} /></span>
            <div>
              <h2 className="font-display font-semibold">Organization</h2>
              <p className="text-xs text-text-faint">Details shown across the promo desk.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Organization Name</Label>
              <Input aria-label="Organization Name" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="bg-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="panel p-3">
                <p className="panel-head mb-1">Administrators</p>
                <p className="text-xl font-display font-bold tabnums">{admins}</p>
              </div>
              <div className="panel p-3">
                <p className="panel-head mb-1">Workspace</p>
                <p className="text-sm font-medium mt-1">SAT-7 Promo Desk</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="panel p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-9 h-9 rounded-md bg-amber/15 text-amber flex items-center justify-center"><Icon name="bell" size={18} /></span>
            <div>
              <h2 className="font-display font-semibold">Notifications</h2>
              <p className="text-xs text-text-faint">Choose which updates are sent out.</p>
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-surface-2/60 cursor-pointer">
              <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} className="mt-0.5 accent-blue w-4 h-4" />
              <span>
                <span className="block text-sm font-medium">Email notifications</span>
                <span className="block text-xs text-text-faint">New requests and status changes.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-surface-2/60 cursor-pointer">
              <input type="checkbox" checked={whatsappNotifications} onChange={(e) => setWhatsappNotifications(e.target.checked)} className="mt-0.5 accent-blue w-4 h-4" />
              <span>
                <span className="block text-sm font-medium">WhatsApp alerts</span>
                <span className="block text-xs text-text-faint">Get alerts for overdue projects.</span>
              </span>
            </label>
          </div>
        </div>

        {/* Appearance */}
        <div className="panel p-5 md:p-6 xl:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-9 h-9 rounded-md bg-violet/15 text-violet flex items-center justify-center"><Icon name={theme === 'dark' ? 'moon' : 'sun'} size={18} /></span>
            <div>
              <h2 className="font-display font-semibold">Appearance</h2>
              <p className="text-xs text-text-faint">Choose how the promo desk looks on this device.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => applyTheme('light')}
              className={`p-4 rounded-md border text-left transition-colors focus-ring ${
                theme === 'light' ? 'border-blue bg-blue/10' : 'border-border hover:bg-surface-2'
              }`}
            >
              <span className="w-full h-16 rounded border border-border bg-[#f3f5f7] mb-3 block" />
              <span className="flex items-center justify-between text-sm font-medium">
                Light <Icon name="sun" size={15} />
              </span>
            </button>
            <button
              type="button"
              onClick={() => applyTheme('dark')}
              className={`p-4 rounded-md border text-left transition-colors focus-ring ${
                theme === 'dark' ? 'border-blue bg-blue/10' : 'border-border hover:bg-surface-2'
              }`}
            >
              <span className="w-full h-16 rounded border border-border bg-[#121920] mb-3 block" />
              <span className="flex items-center justify-between text-sm font-medium">
                Dark <Icon name="moon" size={15} />
              </span>
            </button>
          </div>
          <p className="text-[11px] text-text-faint mt-3">Your choice is saved on this device and applied before the page loads.</p>
        </div>
      </div>
    </section>
  );
}
