/**
 * The keyboard a field gets in the app: what its return key says, and whether
 * it capitalises and corrects what is typed.
 *
 * Left alone, every field in a web view gets the return key of a text editor
 * and the autocorrect of a letter, so an email address starts with a capital,
 * a booking code is "corrected" into a word, and Enter on a search field reads
 * "return". Before a field is focused (on the touch that focuses it, or on the
 * focus itself when code moves it there) this fills in what the field does not
 * say for itself:
 *
 * - enterkeyhint: "go" in a form, which Enter submits, "done" anywhere else.
 *   Search fields say "search" in their own markup.
 * - autocapitalize, autocorrect and spellcheck off for addresses, codes,
 *   numbers and names a machine reads (email, URL, password, tel, number;
 *   autocomplete such as username or one-time-code; a name or id such as
 *   "code", "token" or "host").
 *
 * An attribute the field sets itself always wins, and textareas, which take
 * Enter as a new line, keep the return key. Only the app calls this.
 *
 * The "done" key also has to close the keyboard: a web view only sends Enter,
 * and a field outside a form has nothing listening for it, so the key did
 * nothing. When no handler took the Enter (the field still has focus and the
 * same text a moment later) the field lets go of the focus. A field that acts
 * on Enter and clears itself, such as a list that adds the next item, keeps it.
 */

const SKIP_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'date',
  'datetime-local',
  'file',
  'hidden',
  'image',
  'month',
  'radio',
  'range',
  'reset',
  'submit',
  'time',
  'week',
]);
const MACHINE_TYPES = new Set(['email', 'url', 'password', 'tel', 'number']);
const MACHINE_MODES = new Set(['email', 'url', 'numeric', 'decimal', 'tel']);
const MACHINE_AUTOCOMPLETE =
  /\b(username|email|url|one-time-code|current-password|new-password|tel|postal-code|cc-[a-z-]+)\b/;
const MACHINE_WORDS = new Set([
  'code',
  'token',
  'key',
  'apikey',
  'secret',
  'host',
  'hostname',
  'url',
  'uri',
  'domain',
  'slug',
  'username',
  'email',
  'mail',
  'iban',
  'bic',
  'pin',
  'otp',
  'totp',
  'ref',
  'reference',
  'server',
  'port',
  'ip',
]);

/** The words of an id or name: "bookingCode", "booking_code" and "booking-code" all give booking, code. */
function words(...values: (string | null)[]): string[] {
  return values
    .filter((v): v is string => !!v)
    .flatMap((v) =>
      v
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
    )
    .filter(Boolean);
}

function readByMachine(el: HTMLInputElement): boolean {
  if (MACHINE_TYPES.has(el.type)) return true;
  if (MACHINE_MODES.has((el.getAttribute('inputmode') ?? '').toLowerCase())) return true;
  if (MACHINE_AUTOCOMPLETE.test((el.getAttribute('autocomplete') ?? '').toLowerCase())) return true;
  return words(el.name, el.id).some((w) => MACHINE_WORDS.has(w));
}

function setIfAbsent(el: Element, name: string, value: string) {
  if (!el.hasAttribute(name)) el.setAttribute(name, value);
}

export function prepareField(target: EventTarget | null): void {
  if (!(target instanceof HTMLInputElement) || SKIP_TYPES.has(target.type) || target.readOnly) return;
  const el = target;
  const search = el.type === 'search' || el.getAttribute('role') === 'searchbox';
  setIfAbsent(el, 'enterkeyhint', search ? 'search' : el.form ? 'go' : 'done');
  if (search || readByMachine(el)) {
    setIfAbsent(el, 'autocapitalize', 'none');
    setIfAbsent(el, 'autocorrect', 'off');
    setIfAbsent(el, 'spellcheck', 'false');
  }
}

/** Enter on a "done" field that nothing acted on closes the keyboard. */
export function closeOnDone(e: KeyboardEvent): void {
  const el = e.target;
  if (e.key !== 'Enter' || e.isComposing || e.defaultPrevented) return;
  if (!(el instanceof HTMLInputElement) || el.getAttribute('enterkeyhint') !== 'done') return;
  const before = el.value;
  // After every handler of this Enter, including ones React schedules.
  setTimeout(() => {
    if (el.ownerDocument.activeElement === el && el.value === before) el.blur();
  }, 0);
}

export function prepareKeyboardFields(doc: Document = document): () => void {
  // On the touch, before the focus: the keyboard is set up as the field takes it.
  const onTouch = (e: Event) => prepareField(e.target instanceof Element ? e.target.closest('input') : null);
  const onFocus = (e: FocusEvent) => prepareField(e.target);
  doc.addEventListener('touchstart', onTouch, { capture: true, passive: true });
  doc.addEventListener('focusin', onFocus, true);
  // Bubbling, so a field's own handler runs first and can take the Enter.
  doc.addEventListener('keydown', closeOnDone);
  return () => {
    doc.removeEventListener('touchstart', onTouch, { capture: true });
    doc.removeEventListener('focusin', onFocus, true);
    doc.removeEventListener('keydown', closeOnDone);
  };
}
