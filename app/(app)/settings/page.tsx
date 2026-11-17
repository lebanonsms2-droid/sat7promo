'use client';

import { useState, useEffect } from 'react';
import { getSettings } from '@/lib/queries';
import { saveSettingsAction } from '@/app/actions';
import { Label, Input } from '@/components/ui';

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(false);
  const [orgName, setOrgName] = useState('SAT-7 Promo Desk');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const s = await getSettings();
      if (s) {
        setOrgName(s.org_name);
        setEmailNotifications(s.email_enabled);
        setWhatsappNotifications(s.whatsapp_enabled);
      }
      if (document.documentElement.classList.contains('dark')) setTheme('dark');
    }
    load();
  }, []);

  const handleSave = async () => {
    try {
      await saveSettingsAction({
        org_name: orgName,
        email_enabled: emailNotifications,
        whatsapp_enabled: whatsappNotifications,
      });
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-display font-bold mb-6">Settings</h1>

      {/* Organization Settings */}
      <div className="bg-surface rounded-lg p-6 mb-6">
        <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-4">Organization</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <Label>Organization Name</Label>
            <Input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="bg-transparent"
            />
          </div>
        </div>

        {/* Notification Settings */}
        <div>
          <Label>Email Notifications</Label>
          <div className="flex items-center gap-4">
            <span className="text-text-dim">Receive email notifications for:</span>
            <span className="flex gap-2">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="checkbox cursor-pointer"
              />
              <span>New project requests</span>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="checkbox cursor-pointer ml-4"
              />
              <span>Status changes</span>
            </span>
          </div>
        </div>

        {/* WhatsApp Settings */}
        <div className="mt-4">
          <Label>WhatsApp Notifications</Label>
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={whatsappNotifications}
              onChange={(e) => setWhatsappNotifications(e.target.checked)}
              className="checkbox cursor-pointer"
            />
            <span>Receive WhatsApp alerts for overdue projects</span>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="mt-6 p-4 rounded bg-surface-2">
          <Label>Theme</Label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setTheme('light')}
              className={`px-4 py-2 rounded ${
                theme === 'light'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface'
            }`}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-4 py-2 rounded ${
                theme === 'dark'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface'
            }`}
            >
              Dark
            </button>
          </div>
          <p className="mt-2 text-xs text-text-faint">
            Changes take effect immediately
          </p>
        </div>
      </div>

      {/* Save button */}
      <div className="mt-8 flex justify-end items-center gap-3">
        {saved && <span className="text-sm text-green-600">Settings saved.</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
        <button
          onClick={handleSave}
          className="btn btn-primary"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}