'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { dictionary } from '@/lib/i18n';
import { useAuth } from './providers/auth-provider';

export function AuthForm({ locale, mode }: { locale: string; mode: 'login' | 'register' }) {
  const d = dictionary(locale).auth; const router = useRouter(); const search = useSearchParams(); const auth = useAuth();
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    try { const user = mode === 'login' ? await auth.login(data.email, data.password) : await auth.register({ ...data, locale: locale.toUpperCase() }); router.push(search.get('next') ?? (user.role === 'ADMIN' ? `/${locale}/admin` : `/${locale}/account`)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to continue'); } finally { setBusy(false); }
  }
  return <div className="auth-shell"><div className="auth-card"><span className="eyebrow">Secure account</span><h1 className="display">{mode === 'login' ? d.loginTitle : d.registerTitle}</h1><form className="auth-form" onSubmit={submit}>
    {mode === 'register' && <div className="form-grid"><div className="field"><label>{d.firstName}</label><input name="firstName" required minLength={2} /></div><div className="field"><label>{d.lastName}</label><input name="lastName" required minLength={2} /></div></div>}
    <div className="field"><label>{d.email}</label><input name="email" type="email" required defaultValue={mode === 'login' ? 'user@autoservice.demo' : ''} /></div>
    <div className="field"><label>{d.password}</label><input name="password" type="password" required minLength={10} defaultValue={mode === 'login' ? 'UserDemo123!' : ''} /></div>
    {mode === 'register' && <div className="field"><label>Phone</label><input name="phone" type="tel" /></div>}
    {error && <div className="alert alert-error">{error}</div>}<button className="button button-primary" disabled={busy}>{busy ? '…' : mode === 'login' ? d.login : d.register}</button>
  </form><p className="auth-foot">{mode === 'login' ? d.noAccount : d.hasAccount} <Link href={`/${locale}/${mode === 'login' ? 'register' : 'login'}`}>{mode === 'login' ? d.register : d.login}</Link></p></div></div>;
}
