import { Injectable, OnModuleInit } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { existsSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { readEnv } from '../../app-config';
import { execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import type { KiReservation } from './kitinerary.types';

const execFileAsync = promisify(execFile);

/** Also the leaf name looked for on each PATH entry. */
const BINARY_NAME = 'kitinerary-extractor';
const TIMEOUT_MS = 30_000;
const MAX_BUFFER = 5 * 1024 * 1024;

@Injectable()
export class KitineraryExtractorService implements OnModuleInit {
  private binaryPath: string | null = null;

  onModuleInit() {
    this.binaryPath = this.findBinary();
    if (this.binaryPath) {
      console.log(`[KItinerary] extractor found at: ${this.binaryPath}`);
    } else {
      console.info('[KItinerary] extractor not found — booking import feature disabled');
    }
  }

  isAvailable(): boolean {
    return this.binaryPath !== null;
  }

  async extract(buffer: Buffer, fileName: string): Promise<KiReservation[]> {
    if (!this.binaryPath) {
      throw new Error('kitinerary-extractor is not available on this system');
    }

    const ext = extname(fileName).toLowerCase();
    const tmpFile = join(tmpdir(), `trek-ki-${randomUUID()}${ext}`);

    try {
      writeFileSync(tmpFile, buffer);

      const { stdout, stderr } = await execFileAsync(this.binaryPath, [tmpFile], {
        timeout: TIMEOUT_MS,
        maxBuffer: MAX_BUFFER,
      });

      if (stderr?.trim()) {
        // Filter expected noise: currency-symbol ambiguity warnings and vendor
        // extractor script errors are normal (every matching script is tried;
        // most won't match the current document).
        const unexpected = stderr
          .split('\n')
          .filter(l => l.trim())
          .filter(l => !l.includes('Ambig') && !l.includes('JS ERROR') && !l.includes('Invalid result type from script'));
        if (unexpected.length) {
          console.warn(`[KItinerary] stderr for "${fileName}":`, unexpected.join('\n'));
        }
      }

      const text = stdout.trim();
      if (!text) return [];

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        console.warn(`[KItinerary] non-JSON output for "${fileName}"`);
        return [];
      }

      if (Array.isArray(parsed)) return parsed as KiReservation[];
      if (typeof parsed === 'object' && parsed !== null) return [parsed as KiReservation];
      return [];
    } finally {
      try { unlinkSync(tmpFile); } catch {}
    }
  }

  private findBinary(): string | null {
    const envPath = readEnv().integrations.kitineraryExtractorPath;
    if (envPath) {
      if (existsSync(envPath)) return envPath;
      console.warn(`[KItinerary] KITINERARY_EXTRACTOR_PATH="${envPath}" not found`);
      return null;
    }

    // Debian/Ubuntu: /usr/lib/<triplet>/libexec/kf6/kitinerary-extractor
    try {
      for (const dir of readdirSync('/usr/lib')) {
        const candidate = join('/usr/lib', dir, 'libexec', 'kf6', BINARY_NAME);
        if (existsSync(candidate)) return candidate;
      }
    } catch { /* not a Debian system */ }

    // Fallback: binary on the search path — resolved to an absolute path here,
    // not left as a bare name. Storing 'kitinerary-extractor' meant every later
    // extraction re-resolved it through whatever PATH held at that moment, so on
    // a bare-metal install (the official image sets KITINERARY_EXTRACTOR_PATH, so
    // this branch is dead there) anyone who could write to a PATH directory could
    // have their binary run as the TREK user. Probing the concrete file with
    // execFileSync also drops the /bin/sh hop the old execSync string needed.
    for (const dir of readEnv().integrations.searchPath) {
      const candidate = join(dir, BINARY_NAME);
      if (!existsSync(candidate)) continue;
      try {
        execFileSync(candidate, ['--version'], { stdio: 'pipe', timeout: 3000 });
        return candidate;
      } catch { /* present but not runnable — keep looking */ }
    }

    return null;
  }
}
