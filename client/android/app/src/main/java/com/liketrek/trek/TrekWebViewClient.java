package com.liketrek.trek;

import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

/**
 * Used while the WebView shows the user's server. When that server cannot be
 * loaded, Capacitor would show server.errorPath, but on Android it injects
 * its bridge only into the server's origin, so that local page could neither
 * retry nor change the server and stayed blank. Instead the app restarts on
 * the bundled address screen, where the bridge is present and the screen
 * offers exactly those two things.
 */
class TrekWebViewClient extends BridgeWebViewClient {

    private final Runnable onUnreachable;

    TrekWebViewClient(Bridge bridge, Runnable onUnreachable) {
        super(bridge);
        this.onUnreachable = onUnreachable;
    }

    @Override
    public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        if (request.isForMainFrame()) {
            onUnreachable.run();
            return;
        }
        super.onReceivedError(view, request, error);
    }

    /**
     * Only a 5xx on the page itself means the server is down (a proxy's 502 or
     * 503 while TREK restarts). A 4xx page is left alone: the server answered,
     * and TREK serves its UI for every other path.
     */
    @Override
    public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
        if (!request.isForMainFrame()) {
            super.onReceivedHttpError(view, request, errorResponse);
        } else if (errorResponse.getStatusCode() >= 500) {
            onUnreachable.run();
        }
    }
}
