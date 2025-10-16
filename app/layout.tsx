import './globals.css';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import LayoutContent from '@/components/LayoutContent';

export const metadata = {
  title: 'FitLog - Activity Dashboard',
  description: 'Anonymous workout logger with hydration and weight tracking',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
