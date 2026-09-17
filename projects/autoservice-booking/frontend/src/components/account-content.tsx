'use client';

import { Bell, CalendarClock, CarFront, Plus, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { dictionary } from '@/lib/i18n';
import { Booking, Notification, Vehicle } from '@/lib/types';
import { useAuth } from './providers/auth-provider';

type Tab = 'vehicles' | 'bookings' | 'notifications' | 'profile';

export function AccountContent({ locale }: { locale: string }) {
  const d = dictionary(locale); const auth = useAuth(); const search = useSearchParams();
  const [tab, setTab] = useState<Tab>((search.get('tab') as Tab) ?? 'vehicles'); const [vehicles, setVehicles] = useState<Vehicle[]>([]); const [bookings, setBookings] = useState<Booking[]>([]); const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showVehicle, setShowVehicle] = useState(false); const [error, setError] = useState('');

  async function load() {
    if (!auth.user) return;
    const [v, b, n] = await Promise.all([auth.request<Vehicle[]>('/vehicles'), auth.request<Booking[]>('/bookings/mine'), auth.request<Notification[]>('/notifications')]);
    setVehicles(v); setBookings(b); setNotifications(n);
  }
  useEffect(() => { void load(); }, [auth.user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try { await auth.request('/vehicles', { method: 'POST', body: JSON.stringify({ ...data, year: Number(data.year), mileage: Number(data.mileage) }) }); setShowVehicle(false); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to add vehicle'); }
  }
  async function cancel(booking: Booking) {
    if (!confirm(`Cancel ${booking.reference}?`)) return;
    await auth.request(`/bookings/${booking.id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason: 'Cancelled by customer' }) }); await load();
  }

  if (!auth.loading && !auth.user) return <div className="shell page-hero"><h1 className="display">{d.account.title}</h1><p>Please sign in to access your vehicles and bookings.</p><Link className="button button-primary" href={`/${locale}/login?next=/${locale}/account`}>Sign in</Link></div>;
  return <><section className="page-hero"><div className="shell"><span className="eyebrow">Driver workspace</span><h1 className="display">{d.account.title}</h1><p>Manage every vehicle, visit and notification from one secure account.</p></div></section><div className="shell account-layout"><aside className="panel tabs">
    <button className={`tab ${tab === 'vehicles' ? 'active' : ''}`} onClick={() => setTab('vehicles')}><CarFront size={16} /> {d.account.vehicles}</button>
    <button className={`tab ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}><CalendarClock size={16} /> {d.account.bookings}</button>
    <button className={`tab ${tab === 'notifications' ? 'active' : ''}`} onClick={() => setTab('notifications')}><Bell size={16} /> {d.account.notifications}</button>
    <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}><UserRound size={16} /> Profile</button>
  </aside><section className="content-stack">
    {tab === 'vehicles' && <><div className="section-head"><div><span className="eyebrow">Saved vehicles</span><h2 className="display">{d.account.vehicles}</h2></div><button className="button button-primary button-sm" onClick={() => setShowVehicle(!showVehicle)}><Plus size={15} />{d.account.addVehicle}</button></div>
      {showVehicle && <form className="panel panel-pad form-grid" onSubmit={addVehicle}><div className="field"><label>Make</label><input name="make" required placeholder="Ford" /></div><div className="field"><label>Model</label><input name="model" required placeholder="Fiesta" /></div><div className="field"><label>Year</label><input name="year" type="number" min="1950" max="2100" required defaultValue="2019" /></div><div className="field"><label>Engine</label><input name="engine" required placeholder="1.6" /></div><div className="field"><label>License plate</label><input name="licensePlate" placeholder="AA 1010 AA" /></div><div className="field"><label>Mileage</label><input name="mileage" type="number" min="0" required defaultValue="0" /></div>{error && <div className="alert alert-error field full">{error}</div>}<button className="button button-dark">Save vehicle</button></form>}
      <div className="vehicle-grid">{vehicles.map((vehicle) => <article className="vehicle-card" key={vehicle.id}><span className="eyebrow">{vehicle.year}</span><h3>{vehicle.make} {vehicle.model}</h3><p>{vehicle.engine} · {vehicle.mileage.toLocaleString()} km</p><p>{vehicle.licensePlate ?? 'No license plate'}</p><Link className="button button-ghost button-sm" href={`/${locale}/book?vehicle=${vehicle.id}`}>Book service</Link></article>)}</div></>}
    {tab === 'bookings' && <><div className="section-head"><div><span className="eyebrow">Schedule</span><h2 className="display">{d.account.upcoming}</h2></div><Link className="button button-primary button-sm" href={`/${locale}/book`}>New booking</Link></div>{bookings.map((booking) => { const when = new Date(booking.startTime); const active = ['PENDING', 'CONFIRMED'].includes(booking.status); return <article className="booking-card" key={booking.id}><div className="booking-date"><span>{when.toLocaleDateString(locale, { month: 'short' })}</span><strong>{when.getDate()}</strong><span>{when.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</span></div><div><span className={`status status-${booking.status}`}>{d.status[booking.status]}</span><h3>{booking.service.translations?.find((item) => item.locale === locale.toUpperCase())?.name ?? booking.service.slug}</h3><p>{booking.vehicle.make} {booking.vehicle.model} · {booking.location.name} · {booking.reference}</p></div><div style={{ display: 'grid', gap: 8 }}>{active && <Link className="button button-ghost button-sm" href={`/${locale}/book?reschedule=${booking.id}&vehicle=${booking.vehicle.id}&service=${booking.service.id}&location=${booking.location.id}`}>{d.account.reschedule}</Link>}{active && <button className="button button-danger button-sm" onClick={() => void cancel(booking)}>{d.account.cancel}</button>}</div></article>; })}</>}
    {tab === 'notifications' && <div className="panel"><div className="panel-pad"><span className="eyebrow">In-app inbox</span><h2 className="display">{d.account.notifications}</h2></div>{notifications.map((notification) => <article className={`notification ${notification.isRead ? 'read' : ''}`} key={notification.id}><span className="notification-dot" /><div><strong>{notification.title}</strong><p>{notification.message}</p><small>{new Date(notification.createdAt).toLocaleString(locale)}</small></div></article>)}</div>}
    {tab === 'profile' && auth.user && <div className="panel panel-pad"><span className="eyebrow">Account</span><h2 className="display">{auth.user.firstName} {auth.user.lastName}</h2><div className="summary-row"><span>Email</span><strong>{auth.user.email}</strong></div><div className="summary-row"><span>Phone</span><strong>{auth.user.phone ?? '—'}</strong></div><div className="summary-row"><span>Role</span><strong>{auth.user.role}</strong></div></div>}
  </section></div></>;
}
