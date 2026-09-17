'use client';

import { ArrowRight, LockKeyhole, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuth } from './providers/auth-provider';
import { useI18n } from './providers/i18n-provider';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { locale, t } = useI18n();
  const { login, register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (mode === 'login') await login(String(values.email), String(values.password));
      else await register({ email: String(values.email), password: String(values.password), firstName: String(values.firstName), lastName: String(values.lastName) });
      router.push(searchParams.get('next') ?? `/${locale}/account`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : t('auth.error')); }
    finally { setBusy(false); }
  };
  return (
    <div className="container-page py-12">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2.5rem] bg-white shadow-card lg:grid-cols-2">
        <div className="relative hidden min-h-[650px] overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-grid bg-[size:38px_38px] opacity-50"/><div className="absolute -right-32 top-20 size-96 rounded-full bg-orange blur-[120px]"/>
          <div className="relative flex items-center gap-3 font-display text-2xl font-bold"><span className="grid size-11 place-items-center rounded-2xl bg-lime text-ink"><Wrench/></span>AUTOPARTS</div>
          <div className="relative"><p className="eyebrow !text-lime">Owner&apos;s garage</p><h2 className="mt-4 font-display text-5xl font-bold leading-tight">Keep every order, address and compatible part in one place.</h2><div className="mt-10 flex items-center gap-3 text-white/60"><LockKeyhole size={19}/> Secured access and rotating sessions</div></div>
        </div>
        <div className="flex min-h-[650px] flex-col justify-center p-7 sm:p-12">
          <p className="eyebrow">AutoParts account</p><h1 className="mt-3 font-display text-4xl font-bold">{t(mode === 'login' ? 'auth.loginTitle' : 'auth.registerTitle')}</h1>
          <form onSubmit={(e) => void submit(e)} className="mt-9 grid gap-4">
            {mode === 'register' && <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">{t('auth.firstName')}<input required name="firstName" minLength={2} className="field mt-2" autoComplete="given-name"/></label><label className="text-sm font-bold">{t('auth.lastName')}<input required name="lastName" minLength={2} className="field mt-2" autoComplete="family-name"/></label></div>}
            <label className="text-sm font-bold">{t('auth.email')}<input required name="email" type="email" className="field mt-2" autoComplete="email"/></label>
            <label className="text-sm font-bold">{t('auth.password')}<input required name="password" type="password" minLength={mode === 'register' ? 10 : 1} className="field mt-2" autoComplete={mode === 'register' ? 'new-password' : 'current-password'}/>{mode === 'register' && <span className="mt-2 block text-xs font-normal text-steel">10+ characters with upper/lowercase, number and symbol.</span>}</label>
            {error && <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
            <button disabled={busy} className="btn-primary mt-2 w-full">{t(mode === 'login' ? 'auth.signIn' : 'auth.register')}<ArrowRight size={17}/></button>
          </form>
          <p className="mt-7 text-center text-sm text-steel">{t(mode === 'login' ? 'auth.noAccount' : 'auth.haveAccount')} <Link className="font-extrabold text-ink underline decoration-lime decoration-4" href={`/${locale}/${mode === 'login' ? 'register' : 'login'}`}>{t(mode === 'login' ? 'auth.register' : 'auth.signIn')}</Link></p>
          {mode === 'login' && <div className="mt-8 rounded-2xl bg-fog p-4 text-xs leading-relaxed text-steel"><b className="text-ink">Demo:</b> user@autoparts.demo / UserDemo123!<br/>admin@autoparts.demo / AdminDemo123!</div>}
        </div>
      </div>
    </div>
  );
}
