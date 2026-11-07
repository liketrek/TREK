import { Capacitor } from '@capacitor/core';

/** True inside the iOS and Android apps, where the WebView shows this server's UI. */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function isNativeIos(): boolean {
  return isNativeApp() && Capacitor.getPlatform() === 'ios';
}

export function isNativeAndroid(): boolean {
  return isNativeApp() && Capacitor.getPlatform() === 'android';
}

/** The server the app is connected to: the WebView sits on its origin. */
export function nativeServerHost(): string | null {
  return isNativeApp() ? window.location.host : null;
}
