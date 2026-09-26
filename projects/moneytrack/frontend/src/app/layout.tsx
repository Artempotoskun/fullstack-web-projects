import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'MoneyTrack', template: '%s · MoneyTrack' },
  description: 'Multilingual personal finance management for accounts, budgets, goals and analytics.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
