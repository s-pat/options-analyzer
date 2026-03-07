'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';
import { StockLoader } from '@/components/ui/StockLoader';

const BUFFER_MS = 10_000;

function BufferScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background p-4"
      style={{ animation: 'fade-in-up 0.5s ease both' }}
    >
      <div className="flex flex-col items-center gap-8 w-full max-w-xs">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-semibold text-xl tracking-tight">OptionsLab</span>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            Private Beta
          </span>
        </div>

        {/* Stock loader */}
        <StockLoader size="md" />

        {/* Progress bar */}
        <div className="w-full space-y-2">
          <div className="h-1 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500"
              style={{
                width: '0%',
                animation: `progress-10s ${BUFFER_MS}ms linear forwards`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Preparing your dashboard…
          </p>
        </div>
      </div>
    </div>
  );
}

type Tab = 'password' | 'access';

export default function GatePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('password');
  const [authenticated, setAuthenticated] = useState(false);

  // Password tab state
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (!authenticated) return;
    const t = setTimeout(() => router.push('/'), BUFFER_MS);
    return () => clearTimeout(t);
  }, [authenticated, router]);

  // Request access tab state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [accessLoading, setAccessLoading] = useState(false);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthenticated(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setPwError(data.error ?? 'Invalid password');
      }
    } catch {
      setPwError('Network error. Please try again.');
    } finally {
      setPwLoading(false);
    }
  }

  async function handleAccess(e: React.FormEvent) {
    e.preventDefault();
    setAccessError('');
    setAccessLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, reason }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setAccessError(data.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setAccessError('Network error. Please try again.');
    } finally {
      setAccessLoading(false);
    }
  }

  if (authenticated) return <BufferScreen />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="h-7 w-7 text-primary" />
          <span className="font-semibold text-2xl tracking-tight">OptionsLab</span>
        </div>

        {/* Badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            Private Beta
          </span>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setTab('password')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === 'password'
                  ? 'bg-background text-foreground border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Preview access
            </button>
            <button
              onClick={() => setTab('access')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === 'access'
                  ? 'bg-background text-foreground border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Request access
            </button>
          </div>

          <div className="p-6">
            {tab === 'password' ? (
              <form onSubmit={handlePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Preview password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter preview password"
                    required
                    autoFocus
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                {pwError && (
                  <p className="text-sm text-destructive">{pwError}</p>
                )}
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {pwLoading ? 'Verifying…' : 'Enter'}
                </button>
              </form>
            ) : submitted ? (
              <div className="text-center py-4 space-y-2">
                <p className="font-medium">Request received!</p>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll be in touch at <strong>{email}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAccess} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Why do you want access?{' '}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Tell us a bit about yourself…"
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
                {accessError && (
                  <p className="text-sm text-destructive">{accessError}</p>
                )}
                <button
                  type="submit"
                  disabled={accessLoading}
                  className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {accessLoading ? 'Submitting…' : 'Request access'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
