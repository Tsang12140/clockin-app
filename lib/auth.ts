import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

// Verify a scrypt hash in the format "scrypt:{salt_hex}:{hash_hex}"
// Matches the rent project's password hashing scheme exactly.
async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, saltHex, hashHex] = parts;
  try {
    // salt is passed as the raw hex string (same as rent project — NOT decoded to Buffer)
    const storedBuf = Buffer.from(hashHex, 'hex');
    const derived   = (await scryptAsync(plain, saltHex, storedBuf.length)) as Buffer;
    return storedBuf.length === derived.length && timingSafeEqual(storedBuf, derived);
  } catch {
    return false;
  }
}

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: string;
  mustChangePassword: boolean;
}

// Query family_members from the public schema (shared with rent project).
// Falls back to APP_USERNAME / APP_PASSWORD env vars.
export async function authenticate(username: string, password: string): Promise<AuthUser | null> {
  // --- env-var fallback (same as rent project) ---
  if (
    process.env.APP_USERNAME && process.env.APP_PASSWORD &&
    username === process.env.APP_USERNAME &&
    password === process.env.APP_PASSWORD
  ) {
    return { id: 'env', name: username, phone: username, role: 'super_admin', mustChangePassword: false };
  }

  // --- family_members table ---
  try {
    const normalized = username.replace(/[\s-]/g, '');
    const rows = await db.execute(sql`
      SELECT id, name, phone, role, login_enabled, password_hash, must_change_password,
             failed_login_count, locked_until
      FROM   family_members
      WHERE  phone = ${normalized}
      LIMIT  1
    `);

    const user = rows.rows?.[0] as Record<string, unknown> | undefined;
    if (!user) return null;
    if (!user.login_enabled) return null;
    if (!user.password_hash) return null;

    // Check lockout
    if (user.locked_until && new Date(user.locked_until as string) > new Date()) return null;

    const ok = await verifyPassword(password, user.password_hash as string);

    // Update login metadata
    const now = new Date();
    if (ok) {
      await db.execute(sql`
        UPDATE family_members
        SET    failed_login_count = 0, last_login_at = ${now.toISOString()}, locked_until = NULL
        WHERE  id = ${user.id}
      `);
      return {
        id:                 String(user.id),
        name:               String(user.name),
        phone:              String(user.phone),
        role:               String(user.role ?? 'member'),
        mustChangePassword: Boolean(user.must_change_password),
      };
    } else {
      const failCount = ((user.failed_login_count as number) ?? 0) + 1;
      const lockedUntil = failCount >= 5
        ? new Date(Date.now() + 10 * 60 * 1000).toISOString()
        : null;
      await db.execute(sql`
        UPDATE family_members
        SET    failed_login_count = ${failCount}, locked_until = ${lockedUntil}
        WHERE  id = ${user.id}
      `);
      return null;
    }
  } catch (e) {
    console.error('auth error', e);
    return null;
  }
}
