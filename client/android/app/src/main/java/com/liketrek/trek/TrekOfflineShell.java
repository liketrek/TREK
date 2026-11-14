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
import com.getcapacitor.JSInjector;
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

    /** The UI comes from the copy in this run: the server did not answer when the app started. */
    private static volatile boolean active;
    private static volatile JSInjector injector;
    private static volatile boolean injectorLooked;

    private TrekOfflineShell() {}

    static boolean isActive() {
        return active;
    }

    static void activate() {
        active = true;
    }

    private static File root(Context context) {
        return new File(context.getFilesDir(), DIR);
    }

    /** Whether there is a copy of this server's UI to start from. */
    static boolean hasCopy(Context context, String server) {
        if (server == null) return false;
        File page = new File(root(context), PAGE);
        return page.isFile() && server.equals(readStamp(context));
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

    /** Keeps the start page; a copy of another server is thrown away first. */
    static boolean savePage(Context context, String server, byte[] html) {
        if (!server.equals(readStamp(context))) clear(context);
        File dir = root(context);
        if (!dir.isDirectory() && !dir.mkdirs()) return false;
        return write(new File(dir, STAMP), server.getBytes(StandardCharsets.UTF_8)) && write(new File(dir, PAGE), html);
    }

    static boolean hasFile(Context context, String path) {
        File file = fileFor(context, path);
        return file != null && file.isFile();
    }

    static boolean saveFile(Context context, String path, byte[] data) {
        File file = fileFor(context, path);
        if (file == null) return false;
        File parent = file.getParentFile();
        if (parent != null && !parent.isDirectory() && !parent.mkdirs()) return false;
        return write(file, data);
    }

    /** Drops the files of older builds once the current one is complete. */
    static void prune(Context context, Set<String> keep) {
        File base = new File(root(context), FILES);
        pruneDir(base, base, keep);
    }

    static void clear(Context context) {
        active = false;
        deleteTree(root(context));
    }

    /**
     * The copy's answer for a request of the server's UI while it is active:
     * the start page for any page of the app (it routes itself), with
     * Capacitor's bridge injected as into the server's own page, and a file of
     * the build by its path. Null for anything else, which goes on as usual.
     */
    static WebResourceResponse serve(Context context, Bridge bridge, String server, WebResourceRequest request) {
        if (!active || server == null || !"GET".equalsIgnoreCase(request.getMethod())) return null;
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
            File file = fileFor(context, path);
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
     * the reflection (kept in proguard-rules.pro). Without it the UI still runs,
     * as it would in a browser, just without the app's native parts.
     */
    private static InputStream withBridge(Bridge bridge, InputStream html) {
        if (!injectorLooked) {
            injectorLooked = true;
            try {
                Method method = Bridge.class.getDeclaredMethod("getJSInjector");
                method.setAccessible(true);
                Object built = method.invoke(bridge);
                if (built instanceof JSInjector) injector = (JSInjector) built;
            } catch (ReflectiveOperationException | RuntimeException e) {
                Log.w("TrekShell", "No bridge for the offline copy", e);
            }
        }
        JSInjector current = injector;
        return current == null ? html : current.getInjectedStream(html);
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

    private static File fileFor(Context context, String path) {
        String clean = path.startsWith("/") ? path.substring(1) : path;
        if (clean.isEmpty() || clean.contains("..") || !SAFE_PATH.matcher(clean).matches()) return null;
        return new File(new File(root(context), FILES), clean);
    }

    private static String typeOf(String path) {
        int dot = path.lastIndexOf('.');
        String ext = dot < 0 ? "" : path.substring(dot + 1).toLowerCase(Locale.ROOT);
        String type = TYPES.get(ext);
        return type == null ? "application/octet-stream" : type;
    }

    private static String readStamp(Context context) {
        File stamp = new File(root(context), STAMP);
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
