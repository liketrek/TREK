import { readEnv } from '../../app-config';
import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/** bcrypt cost factor for the seeded admin password — kept in sync with authService. */
const BCRYPT_COST = 12;

/**
 * Seeds run before the DB admin panel can be used, so only env vars are checked
 * here. The granular password_login/password_registration DB toggles are only
 * relevant after the first user exists; by then this seeder has already skipped
 * via the userCount guard.
 */
function isOidcOnlyConfigured(): boolean {
  const oidc = readEnv().oidc;
  if (!oidc.only) return false;
  return !!(oidc.issuer && oidc.clientId);
}

/**
 * Creates the first-run admin account.
 *
 * Only ever on an empty `users` table — `ADMIN_EMAIL`/`ADMIN_PASSWORD` are a
 * first-run bootstrap, not an ongoing setting, and a later run says so out loud
 * rather than silently ignoring them.
 */
export class AdminSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const connection = em.getConnection();
    try {
      const env_admin_email = readEnv().adminBootstrap.email;
      const env_admin_pw = readEnv().adminBootstrap.password;
      const adminEnvProvided = !!(env_admin_email || env_admin_pw);

      const rows = (await connection.execute('SELECT COUNT(*) as count FROM users')) as { count: number }[];
      if (rows[0].count > 0) {
        // A common trip-up: people add the vars after the fact, restart, nothing
        // changes, and there is no hint why. Say so instead of staying silent.
        if (adminEnvProvided) {
          console.warn(
            '[admin] ADMIN_EMAIL/ADMIN_PASSWORD are set, but users already exist — these only apply on first run (empty database) and are being ignored.',
          );
          console.warn(
            '[admin] Change an existing password from Settings after signing in, reset the admin (see the Troubleshooting wiki), or start with an empty data volume to re-run setup.',
          );
        }
        return;
      }

      // Demo mode seeds its own admin (admin@trek.app, username 'admin') right
      // after this. Creating a first-run admin here would grab username 'admin'
      // first and make the demo seeder fail on the UNIQUE(username) constraint.
      if (readEnv().demo.enabled) return;

      if (isOidcOnlyConfigured()) {
        console.log('');
        console.log('╔══════════════════════════════════════════════╗');
        console.log('║  TREK — OIDC-Only Mode                       ║');
        console.log('║  First SSO login will become admin.           ║');
        console.log('╚══════════════════════════════════════════════╝');
        console.log('');
        return;
      }

      let password: string;
      let email: string;
      if (env_admin_email && env_admin_pw) {
        password = env_admin_pw;
        email = env_admin_email;
      } else {
        // A partial config (only one of the two) is an easy mistake: neither
        // value is used and a generated password is created instead. Flag it so
        // the chosen credentials silently not working isn't a surprise.
        if (adminEnvProvided) {
          console.warn(
            '[admin] Only one of ADMIN_EMAIL/ADMIN_PASSWORD is set — both are required for a custom admin. Falling back to admin@trek.local with a generated password (shown below).',
          );
        }
        password = crypto.randomBytes(12).toString('base64url');
        email = 'admin@trek.local';
      }

      const hash = bcrypt.hashSync(password, BCRYPT_COST);
      await connection.execute(
        'INSERT INTO users (username, email, password_hash, role, must_change_password) VALUES (?, ?, ?, ?, 1)',
        ['admin', email, hash, 'admin'],
      );

      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║  TREK — First Run: Admin Account Created     ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log(`║  Email:    ${email.padEnd(33)}║`);
      console.log(`║  Password: ${password.padEnd(33)}║`);
      console.log('╚══════════════════════════════════════════════╝');
      console.log('');
    } catch (err: unknown) {
      console.error('[ERROR] Error seeding admin account:', err instanceof Error ? err.message : err);
    }
  }
}
