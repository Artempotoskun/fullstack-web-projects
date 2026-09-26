import Link from 'next/link';
import { ArrowRight, BarChart3, Check, FileSpreadsheet, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { Brand } from './brand';
import { LanguageSwitcher } from './language-switcher';

export function Landing({ locale }: { locale: Locale }) {
  return <main className="landing">
    <nav className="landing-nav">
      <Brand />
      <div className="nav-actions"><LanguageSwitcher locale={locale} /><Link className="text-link" href={`/${locale}/login`}>{t(locale, 'action.login')}</Link><Link className="button button-dark" href={`/${locale}/register`}>{t(locale, 'action.register')}</Link></div>
    </nav>
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow"><Sparkles size={15} /> {t(locale, 'landing.eyebrow')}</span>
        <h1>{t(locale, 'landing.title')}</h1>
        <p>{t(locale, 'landing.copy')}</p>
        <div className="hero-actions"><Link className="button button-primary" href={`/${locale}/register`}>{t(locale, 'landing.cta')} <ArrowRight size={18} /></Link><a className="button button-ghost" href="#features">{t(locale, 'landing.secondary')}</a></div>
        <div className="trust-row"><span><ShieldCheck size={16} /> {t(locale, 'landing.security')}</span><span><Check size={16} /> {t(locale, 'landing.multilingual')}</span><span><FileSpreadsheet size={16} /> {t(locale, 'landing.imports')}</span></div>
      </div>
      <div className="hero-visual" aria-label="MoneyTrack dashboard preview">
        <div className="preview-window">
          <div className="preview-bar"><span /><span /><span /></div>
          <div className="preview-body">
            <div className="preview-sidebar"><Brand compact />{[1,2,3,4,5].map((item) => <i key={item} />)}</div>
            <div className="preview-content"><div className="preview-heading"><span /><b /></div><div className="preview-stats">{['₴126,450','₴82,000','₴47,320'].map((value, index) => <div key={value}><small>{['BALANCE','INCOME','EXPENSES'][index]}</small><strong>{value}</strong><em>+{index + 2}.4%</em></div>)}</div><div className="preview-grid"><div className="preview-chart"><svg viewBox="0 0 400 150" role="img"><defs><linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#6d5dfc" stopOpacity=".4"/><stop offset="1" stopColor="#6d5dfc" stopOpacity="0"/></linearGradient></defs><path d="M0 120 C40 100,50 110,80 75 S140 100,165 60 S220 75,245 42 S305 65,330 25 S370 40,400 12 L400 150 L0 150Z" fill="url(#heroGradient)"/><path d="M0 120 C40 100,50 110,80 75 S140 100,165 60 S220 75,245 42 S305 65,330 25 S370 40,400 12" fill="none" stroke="#6d5dfc" strokeWidth="4" strokeLinecap="round"/></svg></div><div className="preview-donut"><span>68%<small>saved</small></span></div></div></div>
          </div>
        </div>
        <div className="float-card float-one"><span className="float-icon green"><BarChart3 size={18}/></span><div><small>MONTHLY SAVINGS</small><strong>₴34,680</strong></div></div>
        <div className="float-card float-two"><span className="float-icon purple"><WalletCards size={18}/></span><div><small>ACCOUNTS</small><strong>4 connected</strong></div></div>
      </div>
    </section>
    <section id="features" className="feature-strip">
      {['1','2','3'].map((number) => <article key={number}><span>0{number}</span><h2>{t(locale,`landing.feature${number}.title`)}</h2><p>{t(locale,`landing.feature${number}.copy`)}</p></article>)}
    </section>
  </main>;
}
