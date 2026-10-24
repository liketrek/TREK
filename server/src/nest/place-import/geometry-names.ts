/**
 * The names an import gives the lines of one file. Routes and tracks rarely
 * carry their own name. Without one they would all fall back to the same
 * generic label, so name-based dedup would drop every import after the first.
 * The base is the source file's name (without its extension) and an index
 * keeps several unnamed lines of one file distinct: `walk`, `walk 2`, `walk 3`.
 */
type GeometryNamer = (explicit: string | null, fallback: string) => string;

export function createGeometryNamer(defaultName: string | null | undefined): GeometryNamer {
  const rawName = defaultName != null ? String(defaultName).trim() : null;
  const baseName = rawName ? rawName.replace(/\.[^.]+$/, '').trim() || rawName : null;
  let unnamed = 0;
  return (explicit, fallback) => {
    if (explicit) return explicit;
    unnamed++;
    const base = baseName || fallback;
    return unnamed === 1 ? base : `${base} ${unnamed}`;
  };
}
