import { CalendarCheck2 } from 'lucide-react';
import Link from 'next/link';

export function Footer({ locale }: { locale: string }) {
  return <footer className="site-footer"><div className="shell"><div className="footer-grid">
    <div><Link className="brand" href={`/${locale}`}><span className="brand-mark"><CalendarCheck2 size={21} /></span><span>AutoService<small>booking platform</small></span></Link><p>Modern workshop scheduling with verified availability, transparent pricing and a service history that stays with you.</p></div>
    <div><h4>Platform</h4><div className="footer-links"><Link href={`/${locale}/book`}>Book service</Link><Link href={`/${locale}/account`}>My garage</Link><Link href={`/${locale}#services`}>Services</Link></div></div>
    <div><h4>Workshops</h4><div className="footer-links"><span>Central · Kyiv</span><span>Riverside · Kyiv</span><span>Mon–Sat</span></div></div>
    <div><h4>Contact</h4><div className="footer-links"><span>+380 44 555 11 22</span><span>hello@autoservice.demo</span><span>Support 08:00–20:00</span></div></div>
  </div><div className="footer-bottom"><span>© 2026 AutoService Booking</span><span>Portfolio demo · No real payments</span></div></div></footer>;
}
