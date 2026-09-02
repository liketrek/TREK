/**
 * How the journey gallery is ordered (#2200).
 *
 * `journey_photos.sort_order` is nothing but MAX+1 at insert time and no surface
 * ever writes it again, so ordering by it is ordering by "whenever this got
 * added". Upload day one's pictures after day two's and the gallery stays
 * shuffled, with nothing in the UI to straighten it out.
 *
 * The anchor is instead the best time TREK knows for the picture:
 *
 *  1. its capture time, when EXIF or the photo provider gave one up,
 *  2. otherwise the date of the earliest entry it hangs on, which is where the
 *     journey itself says the reader was standing when it was taken,
 *  3. otherwise the moment it was added, the old behaviour and the only thing
 *     left to go on for a loose photo whose EXIF was stripped.
 *
 * All three are compared as ISO text. Entry dates are local wall clock and
 * capture times are UTC, which only disagree in the hours either side of
 * midnight, and a gallery is read by the day.
 *
 * `sort_order`, then the row id, break ties: insertion order still decides
 * between two pictures taken in the same minute, and the id makes the order
 * total, so paging through the gallery cannot show or skip a photo twice.
 *
 * Consumers must alias journey_photos as `gp` and trek_photos as `tp`.
 */
export const GALLERY_CHRONOLOGICAL_ORDER = `
  ORDER BY COALESCE(
             NULLIF(tp.taken_at, ''),
             (SELECT MIN(je.entry_date || 'T' || COALESCE(NULLIF(je.entry_time, ''), '00:00'))
                FROM journey_entry_photos jep
                JOIN journey_entries je ON je.id = jep.entry_id
               WHERE jep.journey_photo_id = gp.id),
             strftime('%Y-%m-%dT%H:%M:%SZ', gp.created_at / 1000, 'unixepoch')
           ) ASC,
           gp.sort_order ASC,
           gp.id ASC
`;
