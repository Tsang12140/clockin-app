'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function ActivityLogger() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/login')) return;
    const pageUrl = window.location.pathname + window.location.search;
    void fetch('/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'page_view',
        actionLabel: '访问页面',
        pageUrl,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
