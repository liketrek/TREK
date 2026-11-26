/**
 * 芽芽 (Yaya) — the YOUYA brand sprout. Decorative only: it never carries
 * information by itself, so it stays aria-hidden and needs no translation.
 */
export default function Sprout({ size = 72, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true" focusable="false" className={className}>
      <ellipse cx="48" cy="87" rx="25" ry="5" fill="#21443B" opacity="0.12" />
      <circle cx="48" cy="53" r="29" fill="#FFF5E9" stroke="#21443B" strokeWidth="3" />
      <path d="M48 25 L48 34" stroke="#21443B" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M47 25 C 40 18 30 15 22 18 C 24 27 33 32 47 31 Z" fill="#72CDA7" />
      <path d="M49 25 C 56 18 66 15 74 18 C 72 27 63 32 49 31 Z" fill="#72CDA7" />
      <circle cx="39" cy="52" r="2.6" fill="#21443B" />
      <circle cx="57" cy="52" r="2.6" fill="#21443B" />
      <path d="M42 60 Q 48 65 54 60" stroke="#21443B" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="58" r="3.4" fill="#FF9858" opacity="0.45" />
      <circle cx="64" cy="58" r="3.4" fill="#FF9858" opacity="0.45" />
    </svg>
  );
}
