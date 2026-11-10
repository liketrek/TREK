package com.liketrek.trek;

import android.net.Uri;
import android.webkit.ClientCertRequest;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
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
    private final Set<String> signInHosts;
    /** A page of the server has shown since launch; from then on no sign-in host is learned (SignInRedirect). */
    private boolean serverShown;

    TrekWebViewClient(Bridge bridge, Runnable onUnreachable, Consumer<Boolean> onSignInPage, Set<String> signInHosts) {
        super(bridge);
        this.onUnreachable = onUnreachable;
        this.onSignInPage = onSignInPage;
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
        onSignInPage.accept(url != null && isSignInHost(Uri.parse(url)));
    }

    /** After the server's first page, a pending welcome code opens the welcome page once (TrekServerStore.takeWelcomeUrl). */
    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
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

    /** Mapbox's map resources go through the app's own store (tiles/TrekTileStore.kt). */
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
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
            com.liketrek.trek.clientcert.ClientCertWatch.serverAsked(view.getContext(), server, onUnreachable);
        }
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
     * and TREK serves its UI for every other path. The exception is a proxy
     * that asked this page for a client certificate and got none, as Cloudflare
     * does with a 403: the address screen then says so and offers to add one.
     */
    @Override
    public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
        int status = errorResponse.getStatusCode();
        if (!request.isForMainFrame()) {
            super.onReceivedHttpError(view, request, errorResponse);
        } else if (status >= 500 || (status >= 400 && wantedCertificate(request.getUrl()))) {
            onUnreachable.run();
        }
    }

    private static boolean wantedCertificate(Uri url) {
        TrekClientIdentity.Request asked = TrekClientIdentity.INSTANCE.getLastRequest();
        return asked != null && !asked.getServed() && TrekClientIdentity.matches(asked.getHost(), asked.getPort(), url.getHost(), url.getPort());
    }
}
