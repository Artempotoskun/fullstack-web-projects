'use client';

import { CalendarCheck2, CheckCircle2, Clock3, MapPin, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { dictionary } from '@/lib/i18n';
import { Booking, Location, Vehicle, WorkshopService } from '@/lib/types';
import { useAuth } from './providers/auth-provider';

type Slot = { startTime: string; endTime: string; label: string };

export function BookingContent({ locale }: { locale: string }) {
  const d = dictionary(locale).booking; const auth = useAuth(); const search = useSearchParams(); const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]); const [services, setServices] = useState<WorkshopService[]>([]); const [locations, setLocations] = useState<Location[]>([]);
  const [vehicleId, setVehicleId] = useState(search.get('vehicle') ?? ''); const [serviceId, setServiceId] = useState(search.get('service') ?? ''); const [locationId, setLocationId] = useState(search.get('location') ?? '');
  const [date, setDate] = useState(() => { const value = new Date(Date.now() + 86_400_000); return value.toISOString().slice(0, 10); }); const [slots, setSlots] = useState<Slot[]>([]); const [slot, setSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const rescheduleId = search.get('reschedule');

  useEffect(() => { void Promise.all([apiRequest<WorkshopService[]>(`/services?locale=${locale}`), apiRequest<Location[]>('/locations')]).then(([s, l]) => { setServices(s); setLocations(l); if (!locationId && l[0]) setLocationId(l[0].id); }); }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (auth.user) void auth.request<Vehicle[]>('/vehicles').then((items) => { setVehicles(items); if (!vehicleId && items[0]) setVehicleId(items[0].id); }); }, [auth.user]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setSlot(''); setSlots([]); if (!serviceId || !locationId || !vehicleId || !date) return;
    setLoadingSlots(true);
    void apiRequest<{ slots: Slot[] }>(`/availability?serviceId=${serviceId}&locationId=${locationId}&vehicleId=${vehicleId}&date=${date}`).then((result) => setSlots(result.slots)).catch((cause) => setError(cause instanceof Error ? cause.message : 'Availability unavailable')).finally(() => setLoadingSlots(false));
  }, [date, locationId, serviceId, vehicleId]);

  const selected = useMemo(() => ({ vehicle: vehicles.find((item) => item.id === vehicleId), service: services.find((item) => item.id === serviceId), location: locations.find((item) => item.id === locationId) }), [locationId, locations, serviceId, services, vehicleId, vehicles]);

  async function confirm() {
    if (!slot) return; setBusy(true); setError('');
    try {
      if (rescheduleId) await auth.request<Booking>(`/bookings/${rescheduleId}/reschedule`, { method: 'PATCH', body: JSON.stringify({ startTime: slot }) });
      else await auth.request<Booking>('/bookings', { method: 'POST', body: JSON.stringify({ vehicleId, serviceId, locationId, startTime: slot }) });
      setMessage(d.success); setTimeout(() => router.push(`/${locale}/account?tab=bookings`), 900);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to create booking'); } finally { setBusy(false); }
  }

  if (!auth.loading && !auth.user) return <div className="shell page-hero"><span className="eyebrow">{d.eyebrow}</span><h1 className="display">{d.title}</h1><div className="panel panel-pad"><p>{d.signIn}</p><Link className="button button-primary" href={`/${locale}/login?next=/${locale}/book`}>Sign in</Link></div></div>;
  return <><section className="page-hero"><div className="shell"><span className="eyebrow">{d.eyebrow}</span><h1 className="display">{d.title}</h1><p>Every displayed time is checked against technician skills, workshop capacity and blocked periods.</p></div></section><div className="shell booking-layout"><div className="panel panel-pad booking-steps">
    {!vehicles.length && !auth.loading ? <div className="alert alert-error">Add a vehicle in <Link href={`/${locale}/account`}>My Garage</Link> before booking.</div> : null}
    <section className="booking-step"><h3>{d.vehicle}</h3><div className="choice-grid">{vehicles.map((vehicle) => <button className={`choice ${vehicleId === vehicle.id ? 'active' : ''}`} key={vehicle.id} onClick={() => setVehicleId(vehicle.id)}><strong>{vehicle.make} {vehicle.model}</strong><span>{vehicle.year} · {vehicle.engine} · {vehicle.licensePlate ?? 'No plate'}</span></button>)}</div></section>
    <section className="booking-step"><h3>{d.service}</h3><div className="choice-grid">{services.map((service) => <button className={`choice ${serviceId === service.id ? 'active' : ''}`} key={service.id} onClick={() => setServiceId(service.id)} disabled={Boolean(rescheduleId)}><strong>{service.name}</strong><span>€{service.price} · {service.durationMinutes} min</span></button>)}</div></section>
    <section className="booking-step"><h3>{d.location}</h3><div className="choice-grid">{locations.map((location) => <button className={`choice ${locationId === location.id ? 'active' : ''}`} key={location.id} onClick={() => setLocationId(location.id)} disabled={Boolean(rescheduleId)}><strong>{location.name}</strong><span>{location.address}</span></button>)}</div></section>
    <section className="booking-step"><h3>{d.date}</h3><div className="field"><input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setDate(event.target.value)} /></div></section>
    <section className="booking-step"><h3>{d.time}</h3>{loadingSlots ? <p>Calculating workshop capacity…</p> : slots.length ? <div className="slot-grid">{slots.map((item) => <button className={`slot ${slot === item.startTime ? 'active' : ''}`} key={item.startTime} onClick={() => setSlot(item.startTime)}>{item.label}</button>)}</div> : <p>{serviceId ? d.noSlots : 'Select a service to see times.'}</p>}</section>
    {message && <div className="alert"><CheckCircle2 size={17} /> {message}</div>}{error && <div className="alert alert-error">{error}</div>}
  </div><aside className="booking-summary"><h3>Visit summary</h3><div className="summary-row"><span>Vehicle</span><strong>{selected.vehicle ? `${selected.vehicle.make} ${selected.vehicle.model}` : '—'}</strong></div><div className="summary-row"><span>Service</span><strong>{selected.service?.name ?? '—'}</strong></div><div className="summary-row"><span><MapPin size={13} /> Workshop</span><strong>{selected.location?.name ?? '—'}</strong></div><div className="summary-row"><span><Clock3 size={13} /> Time</span><strong>{slot ? new Date(slot).toLocaleString(locale) : '—'}</strong></div><div className="summary-row"><span>Estimate</span><strong>{selected.service ? `€${selected.service.price}` : '—'}</strong></div><p style={{ color: '#a8b8b6', fontSize: '.74rem', lineHeight: 1.6 }}><ShieldCheck size={15} /> Backend validation runs again before the slot is committed.</p><button className="button button-primary" style={{ width: '100%' }} disabled={!slot || busy} onClick={() => void confirm()}><CalendarCheck2 size={17} />{busy ? 'Reserving…' : d.confirm}</button></aside></div></>;
}
