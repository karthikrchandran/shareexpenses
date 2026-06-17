import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShareExpenses',
  description: 'Share expenses with friends easily',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
