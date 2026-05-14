'use server';

import { authenticate } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { getSession } from '@/lib/session';

export async function login(formData: FormData) {
  const username = (formData.get('username') as string ?? '').trim();
  const password = (formData.get('password') as string ?? '').trim();

  let user;
  try {
    user = await authenticate(username, password);
  } catch (e) {
    console.error('[login] authenticate threw:', e);
    throw new Error('认证服务异常: ' + String(e));
  }
  if (!user) return { ok: false };

  try {
    const session = await getSession();
    session.isLoggedIn = true;
    session.userId     = user.id;
    session.userName   = user.name;
    session.userPhone  = user.phone;
    session.role       = user.role;
    await session.save();
    await recordAuditLog({
      action: 'login',
      actionLabel: '登录系统',
      pageUrl: '/login',
      user: {
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
      },
    });
  } catch (e) {
    console.error('[login] session save threw:', e);
    throw new Error('会话保存异常: ' + String(e));
  }
  return { ok: true };
}

export async function logout() {
  const session = await getSession();
  await recordAuditLog({
    action: 'logout',
    actionLabel: '退出登录',
    pageUrl: '/settings',
    user: {
      userId: session.userId,
      userName: session.userName,
      userPhone: session.userPhone,
    },
  });
  await session.destroy();
}
