/**
 * Content-Disposition values per RFC 6266. Node validates header values against
 * Latin-1 and throws ERR_INVALID_CHAR on any codepoint above 0xFF, so quoting a
 * trip title like 沖縄 4泊5日 straight into the header 500'd every export
 * (#2165). The quoted filename is folded to printable ASCII here, and when that
 * folding loses anything the real name rides along RFC 5987-encoded as
 * filename*, which browsers prefer. The result is printable ASCII by
 * construction: setHeader cannot throw on it, and CR/LF or quotes in a name
 * cannot break out of the quoted-string. A name that is already plain ASCII
 * produces byte-for-byte the header the call sites used to build by hand.
 */
export function contentDisposition(filename: string, type: 'attachment' | 'inline'): string {
  const name = filename
    // Control characters (tab included) have no business in a filename on
    // either side of the header, and an unpaired surrogate — a name cut
    // mid-emoji — would make encodeURIComponent throw below.
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, ' ')
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD');
  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  if (ascii === filename) return `${type}; filename="${filename}"`;

  // A name the folding erased entirely still needs a usable quoted fallback;
  // the extension survives, the readable name is in filename*.
  const dot = ascii.lastIndexOf('.');
  const stem = dot > 0 ? ascii.slice(0, dot) : ascii;
  const fallback = /[0-9A-Za-z]/.test(stem) ? ascii : `download${dot > 0 ? ascii.slice(dot) : ''}`;

  // RFC 5987 attr-char: encodeURIComponent is close but leaves ' ( ) * bare.
  const encoded = encodeURIComponent(name).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${type}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
