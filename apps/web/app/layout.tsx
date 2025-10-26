import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Adaptive Training Plan',
  description: 'Intelligently adjust your training plans based on performance and health data from Strava',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
