import type { Metadata } from 'next';
import { Manrope, Space_Grotesk } from 'next/font/google';
import { AuthProvider } from '@/components/providers/auth-provider';
import './globals.css';

const manrope = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font-body' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = { title: 'AutoService Booking', description: 'Live workshop scheduling for modern drivers.' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${manrope.variable} ${space.variable}`}><AuthProvider>{children}</AuthProvider></body></html>;
}
