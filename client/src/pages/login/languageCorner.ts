// Where the login page's language menu stands: below the status bar in the app and under a
// notch, and beside an element in the top corner such as an iPhone Duo's status capsule. The
// insets the iOS app measures (--trek-native-*) are a floor under env(), as in the touch shell.
export const LANGUAGE_CORNER_CLASS =
  'absolute z-10 top-[calc(max(env(safe-area-inset-top,0px),var(--trek-native-safe-top,0px))+16px)] ' +
  'end-[calc(16px+max(env(safe-area-inset-right,0px),var(--trek-native-safe-right,0px),var(--trek-native-corner-right,0px)))] ' +
  'rtl:end-[calc(16px+max(env(safe-area-inset-left,0px),var(--trek-native-safe-left,0px),var(--trek-native-corner-left,0px)))]';
