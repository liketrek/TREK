import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';
import { Capacitor } from '@capacitor/core';
import { Dialog } from '@capacitor/dialog';
import { isNativeApp } from './platform';
import { reportNativeFailure } from './reportFailure';

/**
 * A yes-or-no question asked the way the phone asks it.
 *
 * Asked in HTML, "Delete this place?" is a card drawn by the page, and it
 * looks like one. In the app it goes to the system instead: an action sheet
 * with the action in red when it destroys something, an alert when it does
 * not. That is what iOS and Android show in their own apps for the same
 * question, with the system's own animation, sound and accessibility.
 *
 * Only where the binary carries both plugins: an app from before them keeps
 * the HTML dialog, as does a browser.
 */

export interface NativeQuestion {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Destroys or throws something away: the action shows in red, on a sheet. */
  danger: boolean;
}

export function canAskNatively(): boolean {
  return isNativeApp() && Capacitor.isPluginAvailable('ActionSheet') && Capacitor.isPluginAvailable('Dialog');
}

/**
 * True when the user chose the action, false when they did not. Null when the
 * system could not ask: the caller then shows its HTML dialog, so a question
 * is never lost and nothing is done that was not confirmed.
 */
export async function askNatively(q: NativeQuestion): Promise<boolean | null> {
  try {
    if (q.danger) {
      const { index } = await ActionSheet.showActions({
        title: q.title,
        message: q.message,
        options: [
          { title: q.confirmLabel, style: ActionSheetButtonStyle.Destructive },
          { title: q.cancelLabel, style: ActionSheetButtonStyle.Cancel },
        ],
      });
      return index === 0;
    }
    const { value } = await Dialog.confirm({
      title: q.title,
      message: q.message ?? '',
      okButtonTitle: q.confirmLabel,
      cancelButtonTitle: q.cancelLabel,
    });
    return value;
  } catch (err) {
    reportNativeFailure(err);
    return null;
  }
}
