package com.liketrek.trek;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.util.Log;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import com.getcapacitor.Bridge;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * The server's UI kept on the device, so the app starts without its server: on
 * a trip without reception, or away from home with a server on the home
 * network. The web view runs no service worker on a plain-http server, the
 * usual address of a server at home, so the app keeps the start page and every
 * file of the build itself (refreshed by native/offlineShell.ts while the
 * server is reachable) and serves them under the server's own origin while it
 * is not. The data comes from the UI's own offline store; the API is tried as
 * usual and answers again once the server is back.
 */
final class TrekOfflineShell {

    private static final String DIR = "offline-shell";
    private static final String PAGE = "index.html";
    private static final String STAMP = "server.txt";
    private static final String FILES = "files";
    /** A path of the build: no "..", no query, nothing outside the copy's folder. */
    private static final Pattern SAFE_PATH = Pattern.compile("^[A-Za-z0-9._@\\-]+(?:/[A-Za-z0-9._@\\-]+)*$");
    private static final Map<String, String> TYPES = new HashMap<>();

    static {
        TYPES.put("js", "text/javascript");
        TYPES.put("mjs", "text/javascript");
        TYPES.put("css", "text/css");
        TYPES.put("json", "application/json");
        TYPES.put("webmanifest", "application/manifest+json");
        TYPES.put("svg", "image/svg+xml");
        TYPES.put("png", "image/png");
        TYPES.put("jpg", "image/jpeg");
        TYPES.put("jpeg", "image/jpeg");
        TYPES.put("webp", "image/webp");
        TYPES.put("ico", "image/x-icon");
        TYPES.put("woff", "font/woff");
        TYPES.put("woff2", "font/woff2");
        TYPES.put("ttf", "font/ttf");
        TYPES.put("wasm", "application/wasm");
        TYPES.put("html", "text/html");
    }

    /**
     * The server whose copy the UI comes from in this run: it did not answer
     * when the app started. Null while the UI comes from the server itself.
     * Bound to the server, so a copy never answers for another one.
     */
    private static volatile String activeServer;
    /** Capacitor's JSInjector (package-private there) and its getInjectedStream, found once. */
    private static volatile Object injector;
    private static volatile Method injectMethod;
    private static volatile boolean injectorLooked;

    private TrekOfflineShell() {}

    static boolean isActive() {
        return activeServer != null;
    }

    static void activate(String server) {
        activeServer = server;
    }

    /**
     * A start that goes to the server. The flag lives in the process, and
     * restart() recreates the activity in that same process (another server
     * picked, the address screen, a reload once the server is back), so each
     * start sets it anew instead of keeping the last run's copy in front.
     */
    static void deactivate() {
        activeServer = null;
    }

    /** Whether the copy stands in for this server in this run. */
    static boolean isActiveFor(String server) {
        String current = activeServer;
        return current != null && current.equals(server);
    }

    private static File root(Context context) {
        return new File(context.getFilesDir(), DIR);
    }

    /** Whether there is a copy of this server's UI to start from. */
    static boolean hasCopy(Context context, String server) {
        return hasCopy(root(context), server);
    }

    static boolean hasCopy(File root, String server) {
        if (server == null) return false;
        File page = new File(root, PAGE);
        return page.isFile() && server.equals(readStamp(root));
    }

    /** Whether the device has a network at all; with none, the server cannot answer and the copy starts at once. */
    static boolean hasNetwork(Context context) {
        try {
            ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return true;
            Network network = cm.getActiveNetwork();
            if (network == null) return false;
            NetworkCapabilities caps = cm.getNetworkCapabilities(network);
            return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
        } catch (RuntimeException e) {
            return true;
        }
    }

    /**
     * Before a refresh fetches the files of a build: a copy of another server
     * is thrown away, one of this server stays as it is until savePage.
     */
    static boolean beginRefresh(Context context, String server) {
        return beginRefresh(root(context), server);
    }

    static boolean beginRefresh(File root, String server) {
        if (!server.equals(readStamp(root))) deleteTree(root);
        return root.isDirectory() || root.mkdirs();
    }

    /**
     * Keeps the start page, and only once every file it names is stored: the
     * page points at the build's files by their hashes, so a refresh cut off
     * halfway (no reception, the app ended) keeps the previous page with its
     * complete build instead of a new page whose scripts are missing.
     */
    static boolean savePage(Context context, String server, byte[] html) {
        return savePage(root(context), server, html);
    }

    static boolean savePage(File root, String server, byte[] html) {
        if (!root.isDirectory() && !root.mkdirs()) return false;
        return write(new File(root, STAMP), server.getBytes(StandardCharsets.UTF_8)) && write(new File(root, PAGE), html);
    }

    static boolean hasFile(Context context, String path) {
        return hasFile(root(context), path);
    }

    static boolean hasFile(File root, String path) {
        File file = fileFor(root, path);
        return file != null && file.isFile();
    }

    static boolean saveFile(Context context, String path, byte[] data) {
        return saveFile(root(context), path, data);
    }

    static boolean saveFile(File root, String path, byte[] data) {
        File file = fileFor(root, path);
        if (file == null) return false;
        File parent = file.getParentFile();
        if (parent != null && !parent.isDirectory() && !parent.mkdirs()) return false;
        return write(file, data);
    }

    /** Drops the files of older builds once the current one is complete. */
    static void prune(Context context, Set<String> keep) {
        prune(root(context), keep);
    }

    static void prune(File root, Set<String> keep) {
        File base = new File(root, FILES);
        pruneDir(base, base, keep);
    }

    /**
     * The copy's answer for a request of the server's UI while it is active:
     * the start page for any page of the app (it routes itself), with
     * Capacitor's bridge injected as into the server's own page, and a file of
     * the build by its path. Null for anything else, which goes on as usual.
     */
    static WebResourceResponse serve(Context context, Bridge bridge, String server, WebResourceRequest request) {
        if (!isActiveFor(server) || !"GET".equalsIgnoreCase(request.getMethod())) return null;
        Uri url = request.getUrl();
        Uri origin = Uri.parse(server);
        if (!sameOrigin(url, origin)) return null;
        try {
            if (request.isForMainFrame()) {
                File page = new File(root(context), PAGE);
                if (!page.isFile()) return null;
                InputStream html = withBridge(bridge, new FileInputStream(page));
                return response("text/html", html);
            }
            String path = url.getPath();
            if (path == null) return null;
            File file = fileFor(root(context), path);
            if (file == null || !file.isFile()) return null;
            return response(typeOf(path), new FileInputStream(file));
        } catch (IOException e) {
            Log.w("TrekShell", "Offline copy could not answer " + url, e);
            return null;
        }
    }

    private static WebResourceResponse response(String type, InputStream body) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "no-store");
        String charset = type.startsWith("text/") || type.endsWith("json") ? "utf-8" : null;
        return new WebResourceResponse(type, charset, 200, "OK", headers, body);
    }

    /**
     * Capacitor injects its bridge into the server's page as it passes through;
     * the copy gets the same script. Its builder is internal to Capacitor, hence
     * the reflection on both (kept in proguard-rules.pro). Without it the UI still runs,
     * as it would in a browser, just without the app's native parts.
     */
    private static InputStream withBridge(Bridge bridge, InputStream html) {
        if (!injectorLooked) {
            injectorLooked = true;
            try {
                Method method = Bridge.class.getDeclaredMethod("getJSInjector");
                method.setAccessible(true);
                Object built = method.invoke(bridge);
                if (built != null) {
                    Method inject = built.getClass().getDeclaredMethod("getInjectedStream", InputStream.class);
                    inject.setAccessible(true);
                    injectMethod = inject;
                    injector = built;
                }
            } catch (ReflectiveOperationException | RuntimeException e) {
                Log.w("TrekShell", "No bridge for the offline copy", e);
            }
        }
        Object current = injector;
        Method inject = injectMethod;
        if (current == null || inject == null) return html;
        try {
            Object injected = inject.invoke(current, html);
            return injected instanceof InputStream ? (InputStream) injected : html;
        } catch (ReflectiveOperationException | RuntimeException e) {
            Log.w("TrekShell", "Bridge not injected into the offline copy", e);
            return html;
        }
    }

    private static boolean sameOrigin(Uri a, Uri b) {
        if (a.getScheme() == null || b.getScheme() == null || a.getHost() == null || b.getHost() == null) return false;
        return a.getScheme().equalsIgnoreCase(b.getScheme())
            && a.getHost().equalsIgnoreCase(b.getHost())
            && port(a) == port(b);
    }

    private static int port(Uri uri) {
        if (uri.getPort() != -1) return uri.getPort();
        return "https".equalsIgnoreCase(uri.getScheme()) ? 443 : 80;
    }

    private static File fileFor(File root, String path) {
        String clean = path.startsWith("/") ? path.substring(1) : path;
        if (clean.isEmpty() || clean.contains("..") || !SAFE_PATH.matcher(clean).matches()) return null;
        return new File(new File(root, FILES), clean);
    }

    private static String typeOf(String path) {
        int dot = path.lastIndexOf('.');
        String ext = dot < 0 ? "" : path.substring(dot + 1).toLowerCase(Locale.ROOT);
        String type = TYPES.get(ext);
        return type == null ? "application/octet-stream" : type;
    }

    private static String readStamp(File root) {
        File stamp = new File(root, STAMP);
        if (!stamp.isFile()) return null;
        try (FileInputStream in = new FileInputStream(stamp)) {
            byte[] data = new byte[(int) Math.min(stamp.length(), 4096)];
            int read = in.read(data);
            return read <= 0 ? null : new String(data, 0, read, StandardCharsets.UTF_8);
        } catch (IOException e) {
            return null;
        }
    }

    /** Written beside the target and moved over it, so a cut-off write never leaves half a file. */
    private static boolean write(File target, byte[] data) {
        File temp = new File(target.getPath() + ".part");
        try (FileOutputStream out = new FileOutputStream(temp)) {
            out.write(data);
            out.getFD().sync();
        } catch (IOException e) {
            temp.delete();
            return false;
        }
        return temp.renameTo(target);
    }

    private static void pruneDir(File base, File dir, Set<String> keep) {
        File[] children = dir.listFiles();
        if (children == null) return;
        for (File child : children) {
            if (child.isDirectory()) {
                pruneDir(base, child, keep);
                String[] left = child.list();
                if (left != null && left.length == 0) child.delete();
            } else {
                String relative = base.toURI().relativize(child.toURI()).getPath();
                if (!keep.contains(relative)) child.delete();
            }
        }
    }

    private static void deleteTree(File file) {
        File[] children = file.listFiles();
        if (children != null) for (File child : children) deleteTree(child);
        file.delete();
    }
}
