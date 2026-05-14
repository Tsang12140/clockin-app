'use server';

import { verifyDeveloperPassword } from '@/lib/ai/config';
import { recordAuditLog } from '@/lib/audit';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function unlockDeveloperOptions(formData: FormData) {
  const password = String(formData.get('password') ?? '').trim();
  if (!verifyDeveloperPassword(password)) {
    redirect('/settings/developer?error=1');
  }

  const session = await getSession();
  session.developerUnlocked = true;
  await session.save();

  await recordAuditLog({
    action: 'developer_unlock',
    actionLabel: '进入开发人员选项',
    pageUrl: '/settings/developer',
  });
  redirect('/settings/developer');
}
