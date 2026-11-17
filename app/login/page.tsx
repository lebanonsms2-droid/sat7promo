'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Label, Icon } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);

    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || '/dashboard';

    try {
      const sb = createClient();

      if (mode === 'signup') {
        const { data, error: signUpError } = await sb.auth.signUp({
          email,
          password,
          options: { data: { full_name: name || email } },
        });
        if (signUpError) throw signUpError;

        // If email confirmation is disabled the session comes back immediately.
        if (data.session) {
          router.push(next);
          router.refresh();
          return;
        }
        setNotice('Check your email to confirm your account, then sign in.');
        setMode('signin');
        setBusy(false);
        return;
      }

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
          <div className="flex gap-2 mb-5">
            <Button
              type="button"
              variant={mode === 'signin' ? 'primary' : 'outline'}
              onClick={() => { setMode('signin'); setError(null); setNotice(null); }}
            >
              Sign In
            </Button>
            <Button
              type="button"
              variant={mode === 'signup' ? 'primary' : 'outline'}
              onClick={() => { setMode('signup'); setError(null); setNotice(null); }}
            >
              Create Account
            </Button>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          {notice && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded mb-4 text-sm">
              {notice}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <Label>Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-transparent"
                />
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@sat7.org"
                required
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
                className="bg-transparent"
              />
            </div>

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </div>

        <p className="text-xs text-text-faint text-center mt-4">
          Internal use only — SAT-7 Promo Department
        </p>
      </div>
    </div>
  );
}
