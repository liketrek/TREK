package com.liketrek.trek;

import java.net.URI;
import java.util.Locale;

/**
 * A sign-in page in front of the server that the address screen never saw.
 * A proxy can let the app's check through (an Authelia or Authentik rule that
 * bypasses /api) and still send the page itself to its sign-in. Handed to the
 * browser, that sign-in leaves its session there and the app stays blank on
 * every launch. So a redirect away from the server, while the server's first
 * page is still loading, is taken as the proxy's sign-in: it loads in the web
 * view and its host is kept, the way the address screen keeps the ones it saw.
 * A link the user follows is no redirect, and once a page of the server has
 * shown, nothing is learned any more.
 */
final class SignInRedirect {

    private SignInRedirect() {}

    /** The host (host:port with an explicit port) to keep as a sign-in host, or null. */
    static String learnedHost(String server, String target, boolean mainFrame, boolean redirect, boolean serverShown) {
        if (!mainFrame || !redirect || serverShown || server == null || target == null) return null;
        URI from;
        URI to;
        try {
            from = new URI(server);
            to = new URI(target);
        } catch (Exception e) {
            return null;
        }
        String fromHost = lower(from.getHost());
        String toHost = lower(to.getHost());
        String toScheme = lower(to.getScheme());
        if (fromHost == null || toHost == null) return null;
        if (!"https".equals(toScheme) && !"http".equals(toScheme)) return null;
        // Never from https down to plain http: the sign-in would send a password in the clear.
        if ("https".equals(lower(from.getScheme())) && !"https".equals(toScheme)) return null;
        if (toHost.equals(fromHost)) return null;
        return to.getPort() == -1 ? toHost : toHost + ":" + to.getPort();
    }

    /** Whether `url` is on the server's host, where the app's own pages come from. */
    static boolean onServer(String server, String url) {
        if (server == null || url == null) return false;
        try {
            String serverHost = lower(new URI(server).getHost());
            return serverHost != null && serverHost.equals(lower(new URI(url).getHost()));
        } catch (Exception e) {
            return false;
        }
    }

    private static String lower(String value) {
        return value == null ? null : value.toLowerCase(Locale.ROOT);
    }
}
