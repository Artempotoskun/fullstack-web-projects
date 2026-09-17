'use client';

import { CarFront, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { VehicleMake } from '@/lib/types';
import { useI18n } from './providers/i18n-provider';

export function VehicleFinder() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [makeId, setMakeId] = useState('');
  const [modelId, setModelId] = useState('');
  const [year, setYear] = useState('2019');
  const [engineId, setEngineId] = useState('');
  useEffect(() => { void api<VehicleMake[]>('/vehicles').then(setMakes).catch(() => setMakes([])); }, []);
  const models = useMemo(() => makes.find((item) => item.id === makeId)?.models ?? [], [makes, makeId]);
  const engines = useMemo(() => models.find((item) => item.id === modelId)?.engines ?? [], [models, modelId]);
  const go = () => engineId && router.push(`/${locale}/catalog?engineId=${engineId}&year=${year}`);
  return (
    <section id="fitment" className="container-page -mt-12 relative z-10">
      <div className="overflow-hidden rounded-[2rem] bg-lime shadow-card">
        <div className="grid lg:grid-cols-[.72fr_2fr]">
          <div className="bg-ink p-7 text-white sm:p-9"><span className="mb-5 grid size-12 place-items-center rounded-2xl bg-lime text-ink"><CarFront/></span><p className="eyebrow !text-lime">{t('vehicle.eyebrow')}</p><h2 className="mt-2 font-display text-3xl font-bold">{t('vehicle.title')}</h2></div>
          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-9 lg:grid-cols-5 lg:items-end">
            <Select label={t('vehicle.make')} value={makeId} onChange={(v) => { setMakeId(v); setModelId(''); setEngineId(''); }} options={makes.map((x) => [x.id, x.name])} placeholder={t('vehicle.choose')}/>
            <Select label={t('vehicle.model')} value={modelId} onChange={(v) => { setModelId(v); setEngineId(''); }} options={models.map((x) => [x.id, x.name])} placeholder={t('vehicle.choose')}/>
            <Select label={t('vehicle.year')} value={year} onChange={setYear} options={Array.from({length: 15}, (_, i) => [String(2026 - i), String(2026 - i)])} placeholder={t('vehicle.choose')}/>
            <Select label={t('vehicle.engine')} value={engineId} onChange={setEngineId} options={engines.map((x) => [x.id, `${x.name} · ${x.fuelType}`])} placeholder={t('vehicle.choose')}/>
            <button disabled={!engineId} onClick={go} className="btn-primary h-12 px-4"><Search size={17}/><span className="lg:hidden 2xl:inline">{t('vehicle.button')}</span></button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Select({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: string[][] | readonly string[][]; placeholder: string }) {
  return <label><span className="mb-2 block text-xs font-extrabold uppercase tracking-wider">{label}</span><select className="w-full rounded-xl border-0 bg-white px-3 py-3.5 text-sm font-bold outline-none" value={value} onChange={(e) => onChange(e.target.value)}><option value="">{placeholder}</option>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>;
}
