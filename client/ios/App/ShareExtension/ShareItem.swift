import Foundation
import UIKit
import UniformTypeIdentifiers

/// What was shared to TREK, read into a file the booking import takes: a Wallet
/// pass, a PDF, a mail, a web page as Safari rendered it, a piece of text or a
/// photo. The app's booking import (BookingImportModal) decides what it can read;
/// this only carries the bytes over with a name and a type.
struct ShareItem {
    enum Kind: String {
        case pass, pdf, mail, page, text, image, file

        var symbol: String {
            switch self {
            case .pass: return "wallet.pass.fill"
            case .pdf: return "doc.richtext.fill"
            case .mail: return "envelope.fill"
            case .page: return "safari.fill"
            case .text: return "text.alignleft"
            case .image: return "photo.fill"
            case .file: return "doc.fill"
            }
        }
    }

    var kind: Kind
    /// The file name the import sees.
    var name: String
    var mimeType: String
    var data: Data
    /// What the sheet shows: a page title, a file name, the first line of a text.
    var title: String
    /// A host, for a page.
    var source: String?
    /// The web address it came from, when it is a page or a link: the app offers to
    /// keep it among the trip's links as well as to read a booking out of it.
    var url: String? = nil

    var sizeLabel: String {
        ByteCountFormatter.string(fromByteCount: Int64(data.count), countStyle: .file)
    }
}

enum ShareLoadError: Error {
    case unsupported
    case tooLarge
}

enum ShareLoader {
    /// The keychain carries the item to the app, so it has to stay modest; a
    /// booking confirmation is far below this.
    static let maxBytes = 10 * 1024 * 1024

    private static let passType = "com.apple.pkpass"
    private static let mailTypes = ["com.apple.mail.email", "public.email-message"]

    static func load(_ items: [NSExtensionItem]) async throws -> ShareItem {
        let providers = items.flatMap { $0.attachments ?? [] }
        guard !providers.isEmpty else { throw ShareLoadError.unsupported }

        // Safari hands over the page as it is rendered (SharePage.js), which also
        // covers confirmation pages behind a sign-in that a fresh download would miss.
        for provider in providers where provider.hasItemConformingToTypeIdentifier(UTType.propertyList.identifier) {
            if let page = try? await pageFromSafari(provider) { return page }
        }
        for provider in providers where provider.hasItemConformingToTypeIdentifier(passType) {
            return try await file(provider, type: passType, kind: .pass, ext: "pkpass", mime: "application/vnd.apple.pkpass")
        }
        for provider in providers where provider.hasItemConformingToTypeIdentifier(UTType.pdf.identifier) {
            return try await file(provider, type: UTType.pdf.identifier, kind: .pdf, ext: "pdf", mime: "application/pdf")
        }
        for type in mailTypes {
            for provider in providers where provider.hasItemConformingToTypeIdentifier(type) {
                return try await file(provider, type: type, kind: .mail, ext: "eml", mime: "message/rfc822")
            }
        }
        for provider in providers where provider.hasItemConformingToTypeIdentifier(UTType.html.identifier) {
            return try await file(provider, type: UTType.html.identifier, kind: .page, ext: "html", mime: "text/html")
        }
        for provider in providers where provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
            return try await image(provider)
        }
        for provider in providers where provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
            if let url = try await provider.loadShared(UTType.url.identifier) as? URL {
                if url.isFileURL { return try fromFile(url) }
                return try await page(at: url)
            }
        }
        for provider in providers where provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
            let item = try await provider.loadShared(UTType.plainText.identifier)
            let text = (item as? String) ?? (item as? Data).flatMap { String(data: $0, encoding: .utf8) } ?? ""
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty else { throw ShareLoadError.unsupported }
            // A text that is just a link (what many apps share) is that link.
            if !trimmed.contains(where: \.isWhitespace), let url = URL(string: trimmed), webAddress(url) != nil {
                return try await page(at: url)
            }
            let firstLine = trimmed.split(whereSeparator: \.isNewline).first.map(String.init) ?? trimmed
            return try checked(ShareItem(kind: .text, name: "shared-text.txt", mimeType: "text/plain",
                                         data: Data(trimmed.utf8), title: String(firstLine.prefix(80)), source: nil))
        }
        throw ShareLoadError.unsupported
    }

    // MARK: - Kinds

    private static func file(_ provider: NSItemProvider, type: String, kind: ShareItem.Kind, ext: String, mime: String) async throws -> ShareItem {
        let item = try await provider.loadShared(type)
        var name = provider.suggestedName.map { $0.hasSuffix(".\(ext)") ? $0 : "\($0).\(ext)" } ?? "booking.\(ext)"
        let data: Data
        if let url = item as? URL {
            data = try read(url)
            name = url.lastPathComponent
        } else if let raw = item as? Data {
            data = raw
        } else {
            throw ShareLoadError.unsupported
        }
        return try checked(ShareItem(kind: kind, name: name, mimeType: mime, data: data,
                                     title: (name as NSString).deletingPathExtension, source: nil))
    }

    private static func image(_ provider: NSItemProvider) async throws -> ShareItem {
        let item = try await provider.loadShared(UTType.image.identifier)
        var picture: UIImage?
        if let url = item as? URL { picture = UIImage(data: try read(url)) }
        if let data = item as? Data { picture = UIImage(data: data) }
        if let shown = item as? UIImage { picture = shown }
        guard let picture, let jpeg = picture.jpegData(compressionQuality: 0.85) else { throw ShareLoadError.unsupported }
        let name = (provider.suggestedName ?? "photo") + ".jpg"
        return try checked(ShareItem(kind: .image, name: name, mimeType: "image/jpeg", data: jpeg,
                                     title: provider.suggestedName ?? name, source: nil))
    }

    private static func pageFromSafari(_ provider: NSItemProvider) async throws -> ShareItem? {
        let item = try await provider.loadShared(UTType.propertyList.identifier)
        guard let dict = item as? NSDictionary,
              let results = dict[NSExtensionJavaScriptPreprocessingResultsKey] as? [String: Any],
              let html = results["html"] as? String, !html.isEmpty else { return nil }
        let url = (results["url"] as? String).flatMap(URL.init(string:))
        let title = (results["title"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? url?.host ?? "Page"
        return try checked(ShareItem(kind: .page, name: "\(slug(title)).html", mimeType: "text/html",
                                     data: Data(html.utf8), title: title, source: url?.host,
                                     url: url.flatMap(webAddress)))
    }

    /// A link shared from an app other than Safari: the page as the server sends it,
    /// or the bare link when the page cannot be read (a sign-in wall, an app-only
    /// page, no network), which the app can still keep among the trip's links.
    private static func page(at url: URL) async throws -> ShareItem {
        guard let address = webAddress(url) else { throw ShareLoadError.unsupported }
        var request = URLRequest(url: url, timeoutInterval: 10)
        request.setValue("text/html", forHTTPHeaderField: "Accept")
        if let fetched = try? await URLSession.shared.data(for: request),
           let http = fetched.1 as? HTTPURLResponse, (200..<300).contains(http.statusCode),
           (http.mimeType ?? "").contains("html"), !fetched.0.isEmpty, fetched.0.count <= maxBytes {
            let data = fetched.0
            let html = String(decoding: data, as: UTF8.self)
            let title = pageTitle(html) ?? url.host ?? "Page"
            return ShareItem(kind: .page, name: "\(slug(title)).html", mimeType: "text/html",
                             data: data, title: title, source: url.host, url: address)
        }
        return link(url, address)
    }

    /// The link alone, as a text/uri-list the app recognises as nothing to read a booking from.
    private static func link(_ url: URL, _ address: String) -> ShareItem {
        ShareItem(kind: .page, name: "link.url", mimeType: "text/uri-list", data: Data(address.utf8),
                  title: url.host ?? address, source: url.host, url: address)
    }

    /// An http(s) address, the only kind a trip's links take.
    private static func webAddress(_ url: URL) -> String? {
        guard url.scheme == "https" || url.scheme == "http", url.host != nil else { return nil }
        return url.absoluteString
    }

    private static func fromFile(_ url: URL) throws -> ShareItem {
        let data = try read(url)
        let ext = url.pathExtension.lowercased()
        let (kind, mime): (ShareItem.Kind, String) = {
            switch ext {
            case "pkpass": return (.pass, "application/vnd.apple.pkpass")
            case "pdf": return (.pdf, "application/pdf")
            case "eml": return (.mail, "message/rfc822")
            case "html", "htm": return (.page, "text/html")
            case "txt": return (.text, "text/plain")
            default: return (.file, "application/octet-stream")
            }
        }()
        return try checked(ShareItem(kind: kind, name: url.lastPathComponent, mimeType: mime, data: data,
                                     title: url.deletingPathExtension().lastPathComponent, source: nil))
    }

    // MARK: - Helpers

    private static func read(_ url: URL) throws -> Data {
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        if let size = try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize, size > maxBytes {
            throw ShareLoadError.tooLarge
        }
        return try Data(contentsOf: url)
    }

    private static func checked(_ item: ShareItem) throws -> ShareItem {
        guard !item.data.isEmpty else { throw ShareLoadError.unsupported }
        guard item.data.count <= maxBytes else { throw ShareLoadError.tooLarge }
        return item
    }

    private static func pageTitle(_ html: String) -> String? {
        guard let open = html.range(of: "<title", options: .caseInsensitive),
              let start = html.range(of: ">", range: open.upperBound..<html.endIndex),
              let end = html.range(of: "</title>", options: .caseInsensitive, range: start.upperBound..<html.endIndex)
        else { return nil }
        let title = html[start.upperBound..<end.lowerBound].trimmingCharacters(in: .whitespacesAndNewlines)
        return title.isEmpty ? nil : String(title.prefix(120))
    }

    private static func slug(_ title: String) -> String {
        let cleaned = title.lowercased().components(separatedBy: CharacterSet.alphanumerics.inverted).filter { !$0.isEmpty }
        let joined = cleaned.prefix(8).joined(separator: "-")
        return joined.isEmpty ? "page" : joined
    }
}

private extension NSItemProvider {
    func loadShared(_ type: String) async throws -> NSSecureCoding? {
        try await withCheckedThrowingContinuation { continuation in
            loadItem(forTypeIdentifier: type, options: nil) { item, error in
                if let error { continuation.resume(throwing: error) } else { continuation.resume(returning: item) }
            }
        }
    }
}
