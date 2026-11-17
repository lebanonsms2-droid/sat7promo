'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Label, Icon } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || '/dashboard';

    try {
      const sb = createClient();
      const { error: signInError } = await sb.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      router.push(next);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-10 h-10 rounded bg-red-600 flex items-center justify-center">
            <Icon name="dashboard" size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold">SAT-7 Promo Desk</h1>
            <p className="text-xs text-text-faint">Promo Department Management</p>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-card">
          <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-4">
            Sign in to your account
          </h2>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@sat7.org"
                required
                autoComplete="email"
                className="bg-transparent"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="current-password"
                className="bg-transparent"
              />
            </div>

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Please wait…' : 'Sign In'}
            </Button>
          </form>

          <p className="text-xs text-text-faint mt-4">
            Accounts are created by an administrator. Contact the promo desk if you
            need access.
          </p>
        </div>

        <p className="text-xs text-text-faint text-center mt-4">
          Internal use only — SAT-7 Promo Department
        </p>
      </div>
    </div>
  );
}
