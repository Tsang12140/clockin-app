'use client';

import { useEffect } from 'react';

export default function ClientPreferences() {
  useEffect(() => {
    document.documentElement.classList.toggle(
      'bold-mode',
      localStorage.getItem('clockin_bold') !== '0',
    );
  }, []);

  return null;
}
