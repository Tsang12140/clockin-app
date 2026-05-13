import type { Metadata, Viewport } from 'next';
import './globals.css';
import ClientPreferences from '@/components/ClientPreferences';

export const metadata: Metadata = {
  title: '工厂考勤',
  description: '工厂考勤与工资管理系统',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="h-full antialiased">
        <ClientPreferences />
        {children}
      </body>
    </html>
  );
}
