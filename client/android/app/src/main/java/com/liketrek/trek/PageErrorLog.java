package com.liketrek.trek;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * The log line for a page of the server that came back with an error status.
 * "HTTP 503" on the address screen cannot tell the server, a proxy in front of
 * it and something on the phone apart, so the line names the page and the
 * headers that say who answered (#3014).
 */
final class PageErrorLog {

    /** The headers that name whoever answered a page, in the order they are logged. */
    private static final String[] SENDER_HEADERS = { "Server", "Via", "CF-Ray", "Content-Type" };

    private PageErrorLog() {}

    /**
     * For example "Page answered HTTP 503 Service Unavailable for
     * https://trek.example.com/login (server: cloudflare, cf-ray: 8f1a2b3c4d5e6f70-FRA)".
     * The address goes without its query and fragment, where a sign-in page
     * carries a challenge or a code. A header the answer did not have is left
     * out, and an answer with none of them says so: no server sends a page
     * without at least its type, so that points at something on the phone.
     */
    static String describe(String url, int status, String reason, Map<String, String> headers) {
        StringBuilder line = new StringBuilder("Page answered HTTP ").append(status);
        if (reason != null && !reason.trim().isEmpty()) line.append(' ').append(reason.trim());
        line.append(" for ").append(withoutQuery(url));
        List<String> senders = new ArrayList<>();
        for (String name : SENDER_HEADERS) {
            String value = header(headers, name);
            if (value != null && !value.trim().isEmpty()) senders.add(name.toLowerCase(Locale.ROOT) + ": " + value.trim());
        }
        line.append(senders.isEmpty() ? " (no server headers)" : " (" + String.join(", ", senders) + ")");
        return line.toString();
    }

    /** A header by name, whatever case the answer wrote it in. */
    private static String header(Map<String, String> headers, String name) {
        if (headers == null) return null;
        for (Map.Entry<String, String> entry : headers.entrySet()) {
            if (name.equalsIgnoreCase(entry.getKey())) return entry.getValue();
        }
        return null;
    }

    private static String withoutQuery(String url) {
        if (url == null) return "";
        int end = url.length();
        int query = url.indexOf('?');
        if (query >= 0) end = query;
        int fragment = url.indexOf('#');
        if (fragment >= 0 && fragment < end) end = fragment;
        return url.substring(0, end);
    }
}
