import { Landmark } from 'lucide-react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="brand"><span className="brand-mark"><Landmark size={20} /></span>{!compact && <span>Money<span>Track</span></span>}</div>;
}
