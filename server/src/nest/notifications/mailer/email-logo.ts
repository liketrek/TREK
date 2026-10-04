import type Mail from 'nodemailer/lib/mailer';

/**
 * The TREK mark in the mail header, sent as a PNG part of the message and
 * addressed from the HTML by Content-ID (#2507).
 *
 * It used to be an SVG inlined as a data: URI. Gmail strips data: URIs, Outlook
 * blocks them and neither of them renders SVG, so most people saw a broken image
 * with "TREK" as its alt text. An inline part referenced through cid: is what
 * Gmail, Outlook and Apple Mail all display, and unlike a hosted image it does
 * not depend on the instance being reachable from the recipient's mail provider.
 *
 * Rasterized from client/public/icons/icon.svg at 96x96, twice the size the
 * header shows it at, with the corner radius baked into the image because
 * Outlook ignores border-radius on an img.
 */
export const EMAIL_LOGO_CID = 'logo@trek';

const EMAIL_LOGO_PNG = Buffer.from(
  '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',
  'base64',
);

/**
 * A fresh attachment object per message, so nodemailer never shares state
 * between two sends. Every HTML mail from buildEmailHtml needs it.
 */
export function emailLogoAttachment(): Mail.Attachment {
  return {
    filename: 'trek-logo.png',
    content: EMAIL_LOGO_PNG,
    contentType: 'image/png',
    contentDisposition: 'inline',
    cid: EMAIL_LOGO_CID,
  };
}
