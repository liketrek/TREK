import type { JSX } from 'react';
import { useTranslation } from './TranslationContext';

interface TransHtmlProps<T extends keyof JSX.IntrinsicElements = 'span'> {
  /**
   * Translation key whose template legitimately contains markup (e.g.
   * `'Turn <strong>{title}</strong> into a Journey'`).
   */
  html: string;
  /**
   * Values to interpolate into `{paramName}` placeholders. Every value is
   * HTML-escaped before substitution, so passing user-controlled data is safe.
   */
  params?: Record<string, string | number>;
  /**
   * Element to render. Defaults to `<span>`. Use the tag that fits the
   * surrounding flow — block, inline, list item, etc.
   */
  as?: T;
  className?: string;
  /**
   * `id` is forwarded so the component can be the target of `aria-labelledby`
   * or `htmlFor`. Other ARIA attributes can be added if needed; we intentionally
   * keep the surface small to discourage overloading this with arbitrary props.
   */
  id?: string;
}

/**
 * Renders a translation that contains markup (e.g. `<strong>`) safely.
 *
 * Replaces the pattern that bit us in the Journey suggestion banner:
 *   <span dangerouslySetInnerHTML={{ __html: t('...', { user_input }) }} />
 *
 * That pattern interpolates `user_input` into the template *before* React
 * ever sees it, so a trip title like `<script>alert(1)</script>` would inject
 * a script tag. `TransHtml` runs `tHtml()` which:
 *
 *   1. HTML-escapes every interpolated value, neutralising it.
 *   2. Sanitises the resulting string against an inline tag allow-list.
 *
 * Use this for any user-controlled value that lands in a markup template.
 * Plain text-only templates can continue to use `<>{t('key', params)}</>`.
 */
export function TransHtml<T extends keyof JSX.IntrinsicElements = 'span'>({
  html,
  params,
  as,
  className,
  id,
}: TransHtmlProps<T>) {
  const { tHtml } = useTranslation();
  const Tag = (as ?? 'span') as keyof JSX.IntrinsicElements;
  return (
    // eslint-disable-next-line react/no-danger -- sanitised by tHtml (defence in depth)
    <Tag className={className} id={id} dangerouslySetInnerHTML={{ __html: tHtml(html, params) }} />
  );
}
