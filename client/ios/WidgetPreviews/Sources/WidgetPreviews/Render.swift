import AppKit
import SwiftUI

/// Draws every widget in every size, light and dark, for a trip ahead, a trip
/// under way and no trip, plus a home screen of them on a wallpaper per scheme.
/// Usage: WidgetPreviews <output directory>
@main
struct Render {
    @MainActor
    static func main() throws {
        let out = URL(fileURLWithPath: CommandLine.arguments.dropFirst().first ?? "out", isDirectory: true)
        try FileManager.default.createDirectory(at: out, withIntermediateDirectories: true)
        // A fixed afternoon, so the now line sits between the stops.
        var components = Calendar.current.dateComponents([.year, .month, .day], from: Date())
        components.hour = 12
        components.minute = 10
        let now = Calendar.current.date(from: components) ?? Date()

        let states: [(String, WidgetSnapshot)] = [
            ("upcoming", .sample(running: false, now: now)),
            ("running", .sample(running: true, now: now)),
            ("empty", .sampleEmpty),
        ]
        for scheme in [ColorScheme.light, .dark] {
            let schemeName = scheme == .dark ? "dark" : "light"
            for (stateName, snapshot) in states {
                for kind in WidgetKind.allCases {
                    for family in kind.families {
                        let view = WidgetFrame(kind: kind, family: family, snapshot: snapshot, now: now)
                            .environment(\.colorScheme, scheme)
                        try write(view, to: out.appendingPathComponent("\(kind.rawValue)-\(family.rawValue)-\(stateName)-\(schemeName).png"))
                    }
                }
            }
            for (stateName, snapshot) in states.prefix(2) {
                let sheet = HomeScreen(snapshot: snapshot, now: now).environment(\.colorScheme, scheme)
                try write(sheet, to: out.appendingPathComponent("home-\(stateName)-\(schemeName).png"))
            }
            let lock = LockScreen(snapshots: states.map(\.1), now: now).environment(\.colorScheme, scheme)
            try write(lock, to: out.appendingPathComponent("lock-\(schemeName).png"))
        }
        print("wrote \(try FileManager.default.contentsOfDirectory(atPath: out.path).count) images to \(out.path)")
    }

    @MainActor
    static func write<V: View>(_ view: V, to url: URL) throws {
        let renderer = ImageRenderer(content: view)
        renderer.scale = 3
        guard let image = renderer.nsImage,
              let tiff = image.tiffRepresentation,
              let bitmap = NSBitmapImageRep(data: tiff),
              let png = bitmap.representation(using: .png, properties: [:]) else {
            throw NSError(domain: "WidgetPreviews", code: 1, userInfo: [NSLocalizedDescriptionKey: "could not render \(url.lastPathComponent)"])
        }
        try png.write(to: url)
    }
}

enum WidgetKind: String, CaseIterable {
    case trip, today, bookings, todos

    var families: [TrekFamily] {
        switch self {
        case .trip: return [.small, .medium, .large, .circular, .rectangular, .inline]
        case .today: return [.medium, .large]
        case .bookings: return [.small, .medium, .large, .rectangular, .inline]
        case .todos: return [.small, .medium, .large, .circular, .rectangular]
        }
    }
}

/// One widget as the home screen draws it: its background, the 16 pt content
/// margin, the rounded corners; accessories white on a lock-screen tint.
struct WidgetFrame: View {
    let kind: WidgetKind
    let family: TrekFamily
    let snapshot: WidgetSnapshot
    let now: Date

    var body: some View {
        let size = family.previewSize
        if family.isAccessory {
            content
                .foregroundStyle(.white)
                .frame(width: size.width, height: size.height)
                .background(
                    RoundedRectangle(cornerRadius: family == .circular ? size.width / 2 : 12, style: .continuous)
                        .fill(Color.white.opacity(family == .inline ? 0 : 0.14))
                )
                .padding(6)
                .background(Color(hex: 0x1E2A3A))
        } else {
            content
                .padding(16)
                .frame(width: size.width, height: size.height)
                .background(background)
                .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        }
    }

    @ViewBuilder
    private var content: some View {
        switch kind {
        case .trip: TripContent(snapshot: snapshot, family: family, now: now)
        case .today: TodayContent(snapshot: snapshot, family: family, now: now)
        case .bookings: BookingsContent(snapshot: snapshot, family: family, now: now)
        case .todos: TodosContent(snapshot: snapshot, family: family, now: now)
        }
    }

    @ViewBuilder
    private var background: some View {
        if kind == .trip && snapshot.trip != nil {
            TripBackdrop(trip: snapshot.trip)
        } else {
            TrekPaper()
        }
    }
}

/// A home screen of the widgets on an iPhone-sized wallpaper.
struct HomeScreen: View {
    let snapshot: WidgetSnapshot
    let now: Date
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        VStack(spacing: 22) {
            HStack(spacing: 22) {
                WidgetFrame(kind: .trip, family: .small, snapshot: snapshot, now: now)
                WidgetFrame(kind: .todos, family: .small, snapshot: snapshot, now: now)
            }
            WidgetFrame(kind: snapshot.today == nil ? .trip : .today, family: .medium, snapshot: snapshot, now: now)
            WidgetFrame(kind: .bookings, family: .medium, snapshot: snapshot, now: now)
            WidgetFrame(kind: .trip, family: .large, snapshot: snapshot, now: now)
            HStack(spacing: 22) {
                WidgetFrame(kind: .bookings, family: .small, snapshot: snapshot, now: now)
                WidgetFrame(kind: .todos, family: .small, snapshot: snapshot, now: now)
            }
        }
        .padding(.vertical, 60)
        .padding(.horizontal, 24)
        .background(
            LinearGradient(
                colors: scheme == .dark ? [Color(hex: 0x1D2440), Color(hex: 0x0B0F1E)] : [Color(hex: 0xC9D8F0), Color(hex: 0xF3E3D3)],
                startPoint: .top, endPoint: .bottom
            )
        )
    }
}

/// The lock-screen accessories in a row per state.
struct LockScreen: View {
    let snapshots: [WidgetSnapshot]
    let now: Date

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            ForEach(Array(snapshots.enumerated()), id: \.offset) { _, snapshot in
                VStack(alignment: .leading, spacing: 8) {
                    WidgetFrame(kind: .trip, family: .inline, snapshot: snapshot, now: now)
                    HStack(spacing: 10) {
                        WidgetFrame(kind: .trip, family: .circular, snapshot: snapshot, now: now)
                        WidgetFrame(kind: .todos, family: .circular, snapshot: snapshot, now: now)
                        WidgetFrame(kind: .trip, family: .rectangular, snapshot: snapshot, now: now)
                    }
                    HStack(spacing: 10) {
                        WidgetFrame(kind: .bookings, family: .rectangular, snapshot: snapshot, now: now)
                        WidgetFrame(kind: .todos, family: .rectangular, snapshot: snapshot, now: now)
                    }
                }
            }
        }
        .padding(24)
        .background(Color(hex: 0x1E2A3A))
    }
}
