/// <reference types="@capacitor/splash-screen" />
/// <reference types="@capacitor/keyboard" />
import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.liketrek.trek',
  appName: 'TREK - Plan your trips!',
  // The app ships only the address screen. Once a server is picked, the native
  // side points the WebView at it (TrekBridgeViewController.swift,
  // MainActivity.java) and the UI comes from that server, always in the version
  // the server runs. Session cookie, uploads, /ws and plugins work as they do in
  // a browser, because the WebView is on the server's own origin.
  webDir: 'native-dist',
  server: {
    // Android serves the address screen from https://localhost so it is a
    // secure context. iOS keeps its default capacitor:// scheme: WKWebView
    // handles https itself and Capacitor silently drops an iosScheme of https.
    androidScheme: 'https',
    // Shown, from the app bundle, whenever the server fails to load. The page
    // knows a server is remembered and offers to retry or pick another one;
    // on iOS it first tries the stored offline copy of the server's start page.
    errorPath: 'index.html',
  },
  plugins: {
    SplashScreen: {
      // Matches <meta name="theme-color"> in index.html, so the launch image,
      // the splash and the first painted frame are the same colour and there is
      // no white flash between them.
      backgroundColor: '#09090b',
      // The server's UI hides it once React has mounted (native/nativeApp.ts),
      // the address screen once it has rendered. Auto-hide stays on as the
      // ceiling, so a page that never gets there cannot leave it up for good.
      launchAutoHide: true,
      launchShowDuration: 4000,
      launchFadeOutDuration: 200,
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    Keyboard: {
      // The mobile shell is built from bottom sheets (mobile/screens/**/M*Sheet).
      // `body` resizes the webview itself, so a sheet's own scroll container
      // keeps working; `native` resizes the whole view and fights the sheet.
      resize: KeyboardResize.Body,
      // Android-only workaround: with an edge-to-edge status bar the webview
      // otherwise does not resize at all when the keyboard opens.
      resizeOnFullScreen: true,
    },
  },
};

export default config;
