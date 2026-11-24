import { escapeHtml } from '@trek/shared';

import { isIosStandalone } from '../../utils/iosDevice';
import { pdfExportUrl } from '../../utils/pdfSafariHandoff';
import { rememberPdfSwitch } from '../../utils/pdfSwitch';

/**
 * Every day starts a new page by default. On a trip of short days that prints
 * one sheet per handful of lines, so the preview offers the flowing layout the
 * in-app view already uses, and remembers which one was picked (#1292).
 */
export const PAGE_BREAK_KEY = 'trek_pdf_page_break_per_day';

/**
 * The notes of a flight, train or rental (#1571): printed by default, like the
 * notes of a place, and a switch in the preview leaves them out for a reader who
 * wants the plan without the fine print.
 */
export const TRANSPORT_NOTES_KEY = 'trek_pdf_transport_notes';

/**
 * Larger type and darker greys for a reader who prints the plan and finds the
 * small grey text hard to read (#2817). Off by default, so the document keeps
 * its compact look unless someone asks for more.
 */
export const LARGE_TEXT_KEY = 'trek_pdf_large_text';

/**
 * What the document shows besides the plan itself, each on by default and each a
 * switch in the preview: the photos of the places and stays, the overview pages
 * (route map, the days at a glance, bookings and stays), the coordinates under the
 * addresses, and the contact lines, opening hours and companions of a place.
 */
export const PHOTOS_KEY = 'trek_pdf_photos';
export const OVERVIEW_KEY = 'trek_pdf_overview';
export const COORDINATES_KEY = 'trek_pdf_coordinates';
export const DETAILS_KEY = 'trek_pdf_details';

/* The overlay is imperative DOM, so the switch from Settings/ToggleSwitch is
   rebuilt here rather than rendered — as static markup it would carry no
   behaviour. Same geometry and the same tokens, so it reads as the same control. */
const TOGGLE_TRACK =
  'position:relative;width:44px;height:24px;min-width:44px;flex-shrink:0;border-radius:12px;border:none;padding:0;cursor:pointer;transition:background 0.2s;';
const TOGGLE_KNOB =
  'position:absolute;top:2px;width:20px;height:20px;border-radius:50%;background:white;transition:left 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.2);';
const trackColour = (on: boolean) => (on ? 'var(--accent, #111827)' : 'var(--border-primary, #d1d5db)');
const knobOffset = (on: boolean) => (on ? '22px' : '2px');

const HEADER_ACTION =
  'display:flex;align-items:center;gap:5px;font-size:12px;font-weight:500;color:var(--text-muted);background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:6px;font-family:inherit';

type Translate = (key: string, params?: Record<string, string | number>) => string;

export interface PdfPreviewOptions {
  /** The finished document, shown in a sandboxed srcdoc frame. */
  html: string;
  title: string;
  /** The trip the document prints, for the hand-over to Safari; without it the preview only prints. */
  tripId?: number;
  tr: Translate;
  breaksPerDay: boolean;
  showTransportNotes: boolean;
  /** The transport-notes switch only shows when there is a note to hide. */
  hasTransportNotes: boolean;
  largeText: boolean;
  photos: boolean;
  overview: boolean;
  coordinates: boolean;
  details: boolean;
}

/**
 * The control that saves the document. A browser prints the frame and offers
 * "Save as PDF" in its dialog. An iPhone or iPad running TREK from the Home
 * Screen ignores print() altogether, so there the control opens the trip in
 * Safari with the export dialog up, and a line under the header says why.
 */
function saveControl(tripId: number | undefined, tr: Translate): { html: string; hint: string | null } {
  if (tripId == null || !isIosStandalone()) {
    return {
      html: `<button type="button" id="pdf-print-btn" style="${HEADER_ACTION}">${escapeHtml(tr('pdf.saveAsPdf'))}</button>`,
      hint: null,
    };
  }
  return {
    // target=_blank leaves the installed app for Safari; a link, not script, so the tap itself opens it.
    html: `<a id="pdf-safari-link" href="${escapeHtml(pdfExportUrl(tripId))}" target="_blank" rel="noopener" style="${HEADER_ACTION};text-decoration:none">${escapeHtml(tr('pdf.openInSafari'))}</a>`,
    hint: tr('pdf.safariHint'),
  };
}

/** Opens the document in a modal over the app, with its layout switches and the control that saves it. */
export function openPdfPreview({
  html,
  title,
  tripId,
  tr,
  breaksPerDay,
  showTransportNotes,
  hasTransportNotes,
  largeText,
  photos,
  overview,
  coordinates,
  details,
}: PdfPreviewOptions): void {
  // Open in modal with srcdoc iframe (no URL loading = no X-Frame-Options issue)
  const overlay = document.createElement('div');
  overlay.id = 'pdf-preview-overlay';
  overlay.style.cssText =
    'position:fixed;inset:0;background:var(--overlay);z-index:var(--z-modal);display:flex;align-items:center;justify-content:center;padding:8px;';
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

  const card = document.createElement('div');
  card.style.cssText =
    'width:100%;max-width:1000px;height:95vh;background:var(--bg-card);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.3);';

  const save = saveControl(tripId, tr);
  const header = document.createElement('div');
  header.style.cssText =
    'display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:10px 16px;border-bottom:1px solid var(--border-primary);flex-shrink:0;';
  header.innerHTML = `
    <span style="font-size:13px;font-weight:600;color:var(--text-primary);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(title)}</span>
    <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px">
      ${save.html}
      <button type="button" id="pdf-close-btn" style="background:none;border:none;cursor:pointer;color:var(--text-faint);display:flex;padding:4px;border-radius:6px">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `;

  // The document's switches in a row of their own under the header: the layout first,
  // then what it shows, so the header keeps only the title and the actions.
  const settings = document.createElement('div');
  settings.id = 'pdf-settings-row';
  settings.style.cssText =
    'display:flex;align-items:center;flex-wrap:wrap;gap:8px 18px;padding:8px 16px;border-bottom:1px solid var(--border-primary);background:var(--bg-secondary);flex-shrink:0;';
  settings.innerHTML = [
    previewSwitch('pdf-daybreak-toggle', tr('pdf.pageBreakPerDay'), breaksPerDay),
    previewSwitch('pdf-large-text-toggle', tr('pdf.largeText'), largeText),
    '<span aria-hidden="true" style="width:1px;align-self:stretch;background:var(--border-primary)"></span>',
    previewSwitch('pdf-overview-toggle', tr('pdf.showOverview'), overview),
    previewSwitch('pdf-photos-toggle', tr('pdf.showPhotos'), photos),
    previewSwitch('pdf-coordinates-toggle', tr('collections.coordinates'), coordinates),
    previewSwitch('pdf-details-toggle', tr('pdf.showDetails'), details),
    hasTransportNotes ? previewSwitch('pdf-transport-notes-toggle', tr('pdf.transportNotes'), showTransportNotes) : '',
  ].join('');

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'flex:1;width:100%;border:none;';
  // No script runs inside the document (print is parent-initiated), so withhold
  // allow-scripts to keep the sandbox tight.
  iframe.sandbox = 'allow-same-origin allow-modals';
  iframe.srcdoc = html;

  card.appendChild(header);
  card.appendChild(settings);
  if (save.hint) {
    const hint = document.createElement('p');
    hint.id = 'pdf-safari-hint';
    hint.style.cssText =
      'margin:0;padding:8px 16px;font-size:12px;line-height:1.4;color:var(--text-muted);background:var(--bg-secondary);border-bottom:1px solid var(--border-primary);flex-shrink:0;';
    hint.textContent = save.hint;
    card.appendChild(hint);
  }
  card.appendChild(iframe);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const closeBtn = header.querySelector<HTMLElement>('#pdf-close-btn');
  if (closeBtn) closeBtn.onclick = () => overlay.remove();
  const printBtn = header.querySelector<HTMLElement>('#pdf-print-btn');
  if (printBtn)
    printBtn.onclick = () => {
      iframe.contentWindow?.print();
    };

  // Each choice differs by one class on <body>, so switching is instant in the
  // preview and there is no need to re-fetch photos or rebuild the document.
  const bodyClass = (id: string, key: string, className: string, addWhenOn: boolean) =>
    wirePreviewSwitch(settings, id, (on) => {
      rememberPdfSwitch(key, on);
      iframe.contentDocument?.body.classList.toggle(className, addWhenOn ? on : !on);
    });
  bodyClass('pdf-daybreak-toggle', PAGE_BREAK_KEY, 'pdf-flow', false);
  bodyClass('pdf-transport-notes-toggle', TRANSPORT_NOTES_KEY, 'pdf-no-transport-notes', false);
  bodyClass('pdf-large-text-toggle', LARGE_TEXT_KEY, 'pdf-large-text', true);
  bodyClass('pdf-overview-toggle', OVERVIEW_KEY, 'pdf-no-overview', false);
  bodyClass('pdf-photos-toggle', PHOTOS_KEY, 'pdf-no-photos', false);
  bodyClass('pdf-coordinates-toggle', COORDINATES_KEY, 'pdf-no-coords', false);
  bodyClass('pdf-details-toggle', DETAILS_KEY, 'pdf-no-details', false);
}

/**
 * A labelled switch for the preview header, as markup; wirePreviewSwitch gives it behaviour.
 * Label and switch are one unit, so a narrow header wraps between switches, never inside one.
 */
function previewSwitch(id: string, label: string, on: boolean): string {
  return `<span style="display:inline-flex;align-items:center;gap:8px;white-space:nowrap">
      <label for="${id}" style="font-size:12px;color:var(--text-muted);cursor:pointer;user-select:none">${escapeHtml(label)}</label>
      <button id="${id}" type="button" role="switch" aria-checked="${on}" aria-label="${escapeHtml(label)}" style="${TOGGLE_TRACK} background:${trackColour(on)}">
        <span style="${TOGGLE_KNOB} inset-inline-start:${knobOffset(on)}"></span>
      </button>
    </span>`;
}

function wirePreviewSwitch(header: HTMLElement, id: string, onChange: (on: boolean) => void): void {
  const button = header.querySelector<HTMLButtonElement>(`#${id}`);
  if (!button) return;
  button.onclick = () => {
    const on = button.getAttribute('aria-checked') !== 'true';
    button.setAttribute('aria-checked', String(on));
    button.style.background = trackColour(on);
    const knob = button.firstElementChild as HTMLElement | null;
    if (knob) knob.style.insetInlineStart = knobOffset(on);
    onChange(on);
  };
}
