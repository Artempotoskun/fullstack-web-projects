'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import type { Locale } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { Brand } from './brand';
import { LanguageSwitcher } from './language-switcher';

export function AuthForm({ locale, mode }: { locale: Locale; mode: 'login' | 'register' }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify({ ...values, preferredLanguage: locale.toUpperCase() }) });
      router.push(`/${locale}/app/dashboard`); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : t(locale, 'state.error')); } finally { setBusy(false); }
  }
  return <main className="auth-page">
    <section className="auth-aside"><Link href={`/${locale}`}><Brand /></Link><div><span className="eyebrow"><ShieldCheck size={15}/> {t(locale,'auth.private')}</span><h1>{t(locale,'auth.asideTitle')}</h1><p>{t(locale,'auth.asideCopy')}</p></div><small>{t(locale,'auth.disclaimer')}</small></section>
    <section className="auth-panel"><div className="auth-top"><Link href={`/${locale}`} className="back-link"><ArrowLeft size={17}/> {t(locale,'action.home')}</Link><LanguageSwitcher locale={locale}/></div><form className="auth-card" onSubmit={submit}><div className="auth-icon"><LockKeyhole/></div><h2>{t(locale, mode === 'login' ? 'auth.welcome' : 'auth.create')}</h2><p>{t(locale, 'auth.subtitle')}</p>
      {mode === 'register' && <div className="field-row"><label>{t(locale, 'field.firstName')}<input required name="firstName" autoComplete="given-name" /></label><label>{t(locale, 'field.lastName')}<input required name="lastName" autoComplete="family-name" /></label></div>}
      <label>{t(locale, 'field.email')}<input required type="email" name="email" autoComplete="email" placeholder="you@example.com" /></label>
      <label>{t(locale, 'field.password')}<span className="password-field"><input required minLength={10} type={showPassword ? 'text' : 'password'} name="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">{showPassword ? <EyeOff/> : <Eye/>}</button></span></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="button button-primary button-full" disabled={busy}>{busy ? t(locale, 'state.loading') : t(locale, mode === 'login' ? 'action.login' : 'action.register')} <ArrowRight size={18}/></button>
      <div className="auth-switch">{mode === 'login' ? <>{t(locale,'auth.new')} <Link href={`/${locale}/register`}>{t(locale, 'action.register')}</Link></> : <>{t(locale,'auth.existing')} <Link href={`/${locale}/login`}>{t(locale, 'action.login')}</Link></>}</div>
    </form></section>
  </main>;
}
