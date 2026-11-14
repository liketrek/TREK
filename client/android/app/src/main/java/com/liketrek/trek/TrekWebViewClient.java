package com.liketrek.trek;

import android.net.Uri;
import android.util.Log;
import android.webkit.ClientCertRequest;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;
import com.liketrek.trek.clientcert.TrekClientIdentity;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.function.Consumer;

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
    /** Told whether the page now shown is a proxy's sign-in page, for the bar with the way out. */
    private final Consumer<Boolean> onSignInPage;
    /** Told whether the page now shown is an error page in place of the server's, for the same bar. */
    private final Consumer<Boolean> onErrorPage;
    /** The main-frame address that last came back as a 4xx page nobody else handled. */
    private String errorPageUrl;
    private final Set<String> signInHosts;
    /** A page of the server has shown since launch; from then on no sign-in host is learned (SignInRedirect). */
    private boolean serverShown;
    /** The page itself failed on the network once already; the next failure goes to the address screen. */
    private boolean retriedMainFrame;
    /** The page loaded again after a network error, until that load starts: its error page counts for nothing. */
    private String retryUrl;
    private final Bridge bridge;

    TrekWebViewClient(
        Bridge bridge,
        Runnable onUnreachable,
        Consumer<Boolean> onSignInPage,
        Consumer<Boolean> onErrorPage,
        Set<String> signInHosts
    ) {
        super(bridge);
        this.bridge = bridge;
        this.onUnreachable = onUnreachable;
        this.onSignInPage = onSignInPage;
        this.onErrorPage = onErrorPage;
        this.signInHosts = new HashSet<>(signInHosts);
    }

    /**
     * The sign-in page of a proxy in front of the server loads here rather than
     * in the browser, so its session cookie is the web view's and every request
     * of the app carries it, as in a browser. Only the hosts the address screen
     * saw that proxy send it to (TrekServerStore.getSignInHosts), and only as a
     * page: Capacitor injects its bridge into the server's origin alone, so the
     * proxy's page gets no access to the app. Everything else goes on to
     * Capacitor, which opens a foreign page in the browser.
     */
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        if (request.isForMainFrame() && isSignInHost(request.getUrl())) return false;
        String learned = SignInRedirect.learnedHost(
            TrekServerStore.getUrl(view.getContext()),
            request.getUrl().toString(),
            request.isForMainFrame(),
            request.isRedirect(),
            serverShown
        );
        if (learned != null) {
            signInHosts.add(learned);
            TrekServerStore.addSignInHost(view.getContext(), learned);
            return false;
        }
        return super.shouldOverrideUrlLoading(view, request);
    }

    /** Every page the main frame shows, pushState included: is it a proxy's sign-in page? */
    @Override
    public void doUpdateVisitedHistory(WebView view, String url, boolean isReload) {
        super.doUpdateVisitedHistory(view, url, isReload);
        if (retryUrl != null) return;
        onSignInPage.accept(url != null && isSignInHost(Uri.parse(url)));
        // The 4xx answer arrives before this commit or after it; either way the
        // flag is read once here, so the next page clears the bar again.
        boolean error = url != null && url.equals(errorPageUrl);
        errorPageUrl = null;
        onErrorPage.accept(error);
    }

    /** After the server's first page, a pending welcome code opens the welcome page once (TrekServerStore.takeWelcomeUrl). */
    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        // The error page of a load that is about to be retried: not the server's
        // first page, so no welcome page and no learning of sign-in hosts yet.
        if (retryUrl != null) return;
        if (SignInRedirect.onServer(TrekServerStore.getUrl(view.getContext()), url)) serverShown = true;
        String welcome = TrekServerStore.takeWelcomeUrl(view.getContext());
        if (welcome != null) view.loadUrl(welcome);
    }

    private boolean isSignInHost(Uri url) {
        String scheme = url.getScheme();
        String host = url.getHost();
        if (host == null || !("https".equals(scheme) || "http".equals(scheme))) return false;
        String key = host.toLowerCase(Locale.ROOT);
        return signInHosts.contains(key) || (url.getPort() != -1 && signInHosts.contains(key + ":" + url.getPort()));
    }

    /**
     * Mapbox's map resources go through the app's own store (tiles/TrekTileStore.kt),
     * and while the server is out of reach the UI comes from its stored copy
     * (TrekOfflineShell).
     */
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        WebResourceResponse copy = TrekOfflineShell.serve(view.getContext(), bridge, TrekServerStore.getUrl(view.getContext()), request);
        if (copy != null) return copy;
        if (com.liketrek.trek.tiles.TrekTileStore.INSTANCE.handles(request)) {
            WebResourceResponse stored = com.liketrek.trek.tiles.TrekTileStore.INSTANCE.serve(request);
            if (stored != null) return stored;
        }
        return super.shouldInterceptRequest(view, request);
    }

    /**
     * A proxy in front of the server asks for a client certificate (mutual TLS).
     * The stored one goes only to the host and port it was imported for; every
     * other site that asks is told there is none, as a browser without a
     * matching certificate would. The WebView remembers either answer for the
     * host until the app restarts, which a new certificate always brings along.
     */
    @Override
    public void onReceivedClientCertRequest(WebView view, ClientCertRequest request) {
        TrekClientIdentity.Identity identity = TrekClientIdentity.identityFor(view.getContext(), request.getHost(), request.getPort());
        TrekClientIdentity.noteRequest(request.getHost(), request.getPort(), identity != null);
        if (identity != null) request.proceed(identity.getKey(), identity.getChain());
        else request.ignore();
        // The page may still come from the service worker's cache while every
        // request fails: check natively whether the server lets the app in.
        String server = TrekServerStore.getUrl(view.getContext());
        Uri serverUri = server == null ? null : Uri.parse(server);
        if (serverUri != null && TrekClientIdentity.matches(String.valueOf(serverUri.getHost()), serverUri.getPort() > 0 ? serverUri.getPort() : 443, request.getHost(), request.getPort())) {
            com.liketrek.trek.clientcert.ClientCertWatch.serverAsked(view.getContext(), server, () -> {
                TrekServerStore.setFailure(view.getContext(), "client certificate requested");
                onUnreachable.run();
            });
        }
    }

    /**
     * A page that failed on the network is loaded once more before the app says
     * the server is unreachable. Started from the background, as when the
     * browser hands a sign-in back to an app Android had ended, a Samsung phone
     * may hold its network back for a moment, and the first load fails with the
     * server there all along. The error is logged, as a report has nothing else.
     */
    @Override
    public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        if (request.isForMainFrame()) {
            Log.w("TrekShell", "Page failed: " + error.getErrorCode() + " " + error.getDescription());
            if (!retriedMainFrame && isNetworkError(error.getErrorCode())) {
                retriedMainFrame = true;
                retryUrl = request.getUrl().toString();
                view.postDelayed(() -> {
                    String url = retryUrl;
                    retryUrl = null;
                    view.loadUrl(url);
                }, 1500);
                return;
            }
            // Out of reach for good (a trip without reception, a server at home):
            // the stored copy of the UI takes over, with the app's own offline data.
            String server = TrekServerStore.getUrl(view.getContext());
            if (isNetworkError(error.getErrorCode()) && !TrekOfflineShell.isActive() && TrekOfflineShell.hasCopy(view.getContext(), server)) {
                TrekOfflineShell.activate();
                String url = request.getUrl().toString();
                view.post(() -> view.loadUrl(url));
                return;
            }
            TrekServerStore.setFailure(view.getContext(), error.getDescription() + " (" + error.getErrorCode() + ")");
            onUnreachable.run();
            return;
        }
        super.onReceivedError(view, request, error);
    }

    /**
     * Only a 5xx on the page itself means the server is down (a proxy's 502 or
     * 503 while TREK restarts). A 4xx page is not TREK's, which serves its UI for
     * every path: a proxy that asked this page for a client certificate and got
     * none, as Cloudflare does with a 403, sends the app to the address screen,
     * which says so and offers to add one. Any other 4xx page (a proxy's block
     * page, a certificate it refused) stays up with the bar and its way out, so
     * the app is never stuck on a page without TREK's UI.
     */
    @Override
    public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
        int status = errorResponse.getStatusCode();
        if (!request.isForMainFrame()) {
            super.onReceivedHttpError(view, request, errorResponse);
        } else if (status >= 500 || (status >= 400 && wantedCertificate(request.getUrl()))) {
            TrekServerStore.setFailure(view.getContext(), "HTTP " + status);
            onUnreachable.run();
        } else if (status >= 400) {
            errorPageUrl = request.getUrl().toString();
            onErrorPage.accept(true);
        }
    }

    private static boolean isNetworkError(int code) {
        return code == WebViewClient.ERROR_HOST_LOOKUP
            || code == WebViewClient.ERROR_CONNECT
            || code == WebViewClient.ERROR_TIMEOUT
            || code == WebViewClient.ERROR_IO
            || code == WebViewClient.ERROR_UNKNOWN;
    }

    private static boolean wantedCertificate(Uri url) {
        TrekClientIdentity.Request asked = TrekClientIdentity.INSTANCE.getLastRequest();
        return asked != null && !asked.getServed() && TrekClientIdentity.matches(asked.getHost(), asked.getPort(), url.getHost(), url.getPort());
    }
}
