import { afterEach, describe, expect, it, vi } from 'vitest';
import { closeOnDone, prepareField, prepareKeyboardFields } from './keyboardFields';

function field(html: string): HTMLInputElement {
  document.body.innerHTML = html;
  return document.body.querySelector('input') as HTMLInputElement;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('prepareField', () => {
  it('gives a field outside a form a "done" key and leaves its text alone', () => {
    const el = field('<input name="title">');
    prepareField(el);
    expect(el.getAttribute('enterkeyhint')).toBe('done');
    expect(el.hasAttribute('autocapitalize')).toBe(false);
    expect(el.hasAttribute('autocorrect')).toBe(false);
  });

  it('says "go" in a form, which Enter submits', () => {
    const el = field('<form><input name="title"><button>Save</button></form>');
    prepareField(el);
    expect(el.getAttribute('enterkeyhint')).toBe('go');
  });

  it('turns capitals and corrections off for what a machine reads', () => {
    for (const html of [
      '<input type="email">',
      '<input type="url">',
      '<input inputmode="numeric">',
      '<input autocomplete="one-time-code">',
      '<input name="bookingCode">',
      '<input id="api_token">',
      '<input name="server-host">',
    ]) {
      const el = field(html);
      prepareField(el);
      expect([
        html,
        el.getAttribute('autocapitalize'),
        el.getAttribute('autocorrect'),
        el.getAttribute('spellcheck'),
      ]).toEqual([html, 'none', 'off', 'false']);
    }
  });

  it('does not take a word that only contains a machine word for one', () => {
    for (const html of ['<input name="keyword">', '<input name="preferredName">', '<input id="pinnedNote">']) {
      const el = field(html);
      prepareField(el);
      expect([html, el.hasAttribute('autocapitalize')]).toEqual([html, false]);
    }
  });

  it('treats a search field as one, in its key and its text', () => {
    const el = field('<input type="search">');
    prepareField(el);
    expect(el.getAttribute('enterkeyhint')).toBe('search');
    expect(el.getAttribute('autocorrect')).toBe('off');
  });

  it('never overrides what a field says itself', () => {
    const el = field('<input type="email" enterkeyhint="send" autocapitalize="words">');
    prepareField(el);
    expect(el.getAttribute('enterkeyhint')).toBe('send');
    expect(el.getAttribute('autocapitalize')).toBe('words');
  });

  it('leaves textareas, checkboxes and read-only fields alone', () => {
    document.body.innerHTML = '<textarea></textarea><input type="checkbox"><input readonly>';
    for (const el of Array.from(document.body.children)) {
      prepareField(el);
      expect(el.hasAttribute('enterkeyhint')).toBe(false);
    }
  });
});

describe('prepareKeyboardFields', () => {
  it('prepares a field as it is focused, and stops when told to', () => {
    const stop = prepareKeyboardFields();
    const a = field('<input name="title">');
    a.focus();
    expect(a.getAttribute('enterkeyhint')).toBe('done');
    stop();
    const b = field('<input name="other">');
    b.focus();
    expect(b.hasAttribute('enterkeyhint')).toBe(false);
  });
});

describe('closeOnDone', () => {
  const enter = (el: HTMLElement) => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

  it('closes the keyboard when nothing took the Enter of a "done" field', () => {
    vi.useFakeTimers();
    const el = field('<input name="title" enterkeyhint="done">');
    el.focus();
    el.addEventListener('keydown', closeOnDone);
    enter(el);
    vi.runAllTimers();
    expect(document.activeElement).not.toBe(el);
    vi.useRealTimers();
  });

  it('keeps the keyboard for a field that acted on the Enter and cleared itself', () => {
    vi.useFakeTimers();
    const el = field('<input name="item" enterkeyhint="done">');
    el.value = 'Socks';
    el.focus();
    el.addEventListener('keydown', () => {
      el.value = '';
    });
    el.addEventListener('keydown', closeOnDone);
    enter(el);
    vi.runAllTimers();
    expect(document.activeElement).toBe(el);
    vi.useRealTimers();
  });

  it('leaves "go" and "search" fields and handled Enters alone', () => {
    vi.useFakeTimers();
    for (const hint of ['go', 'search']) {
      const el = field(`<input enterkeyhint="${hint}">`);
      el.focus();
      el.addEventListener('keydown', closeOnDone);
      enter(el);
      vi.runAllTimers();
      expect(document.activeElement).toBe(el);
    }
    const handled = field('<input enterkeyhint="done">');
    handled.focus();
    handled.addEventListener('keydown', (e) => e.preventDefault());
    handled.addEventListener('keydown', closeOnDone);
    handled.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    vi.runAllTimers();
    expect(document.activeElement).toBe(handled);
    vi.useRealTimers();
  });
});
