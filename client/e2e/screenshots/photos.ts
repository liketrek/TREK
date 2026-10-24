import type { APIRequestContext } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Cover photos for the demo trips.
 *
 * A drawn cover reads as a placeholder at the size the dashboard shows it, and
 * the help pictures are meant to look like a real traveller's TREK. So the
 * covers are landscape photographs from Wikimedia Commons under free licences,
 * downloaded at run time into `e2e/.tmp/photos/` and never committed: the
 * repository carries no photographs. No person is recognisable in any of them.
 *
 * When Commons cannot be reached the trip simply keeps no cover, which the
 * dashboard handles; the run does not fail over a decoration.
 */
export const COVER_PHOTOS = {
  // Kiyomizu-dera, Kyoto, November 2016 -02.jpg, CC BY-SA 4.0
  japan:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Kiyomizu-dera%2C_Kyoto%2C_November_2016_-02.jpg/1920px-Kiyomizu-dera%2C_Kyoto%2C_November_2016_-02.jpg',
  // Croda dei Toni and Tre Cime di Lavaredo from Monte Specie, 2025 October.jpg, CC BY-SA 4.0
  dolomites:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/Croda_dei_Toni_and_Tre_Cime_di_Lavaredo_from_Monte_Specie%2C_Val_Pusteria%2C_Trentino-Alto_Adige%2C_Italy%2C_2025_October.jpg/1920px-Croda_dei_Toni_and_Tre_Cime_di_Lavaredo_from_Monte_Specie%2C_Val_Pusteria%2C_Trentino-Alto_Adige%2C_Italy%2C_2025_October.jpg',
  // Sella Ronda Overview.jpg, CC0
  ski: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/Sella_Ronda_Overview.jpg/1920px-Sella_Ronda_Overview.jpg',
  // Geirangerfjord from Ørnesvingen, 2013 June.jpg, CC BY-SA 3.0
  norway:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/Geirangerfjord_from_%C3%98rnesvingen%2C_2013_June.jpg/1920px-Geirangerfjord_from_%C3%98rnesvingen%2C_2013_June.jpg',
  // RhB ABe 4-4 III mit Bernina-Express am Lago Bianco.jpg, CC BY-SA 3.0
  alps: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/RhB_ABe_4-4_III_mit_Bernina-Express_am_Lago_Bianco.jpg/1920px-RhB_ABe_4-4_III_mit_Bernina-Express_am_Lago_Bianco.jpg',
  // Le tram 28.jpg, CC BY-SA 4.0
  lisbon: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/Le_tram_28.jpg/1920px-Le_tram_28.jpg',
} as const;

export type CoverPhoto = keyof typeof COVER_PHOTOS;

const PHOTO_DIR = path.join(process.cwd(), 'e2e', '.tmp', 'photos');
// Commons asks every client to name itself; anonymous bursts get a 429.
const USER_AGENT = 'TREK-help-media/1.0 (documentation screenshots; https://github.com/liketrek/TREK)';

/** The photo on disk, downloaded once; null when Commons cannot be reached. */
export async function coverPhoto(key: CoverPhoto): Promise<string | null> {
  const file = path.join(PHOTO_DIR, `${key}.jpg`);
  if (existsSync(file)) return file;
  mkdirSync(PHOTO_DIR, { recursive: true });
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(COVER_PHOTOS[key], {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 5_000));
        continue;
      }
      if (!res.ok) break;
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      return file;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  }
  console.warn(`cover photo "${key}" could not be downloaded; the trip keeps no cover`);
  return null;
}

/** Upload the photo as the trip's cover, the way the trip form does. */
export async function setTripCover(api: APIRequestContext, tripId: number, key: CoverPhoto): Promise<void> {
  const file = await coverPhoto(key);
  if (!file) return;
  const { readFileSync } = await import('node:fs');
  const res = await api.post(`/api/trips/${tripId}/cover`, {
    multipart: { cover: { name: `${key}.jpg`, mimeType: 'image/jpeg', buffer: readFileSync(file) } },
  });
  if (!res.ok()) console.warn(`cover for trip ${tripId} was refused: ${res.status()} ${await res.text()}`);
}
