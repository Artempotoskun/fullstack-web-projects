import type { Metadata } from 'next';
import { Manrope, Space_Grotesk } from 'next/font/google';
import './globals.css';

const manrope = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font-manrope' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

export const metadata: Metadata = {
  title: { default: 'AutoParts Store', template: '%s · AutoParts Store' },
  description: 'Trusted automotive parts, matched precisely to your car.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html suppressHydrationWarning className={`${manrope.variable} ${space.variable}`}><body className="font-sans">{children}</body></html>;
}
