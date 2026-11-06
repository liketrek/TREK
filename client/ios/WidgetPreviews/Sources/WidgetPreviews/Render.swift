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

        var withCover = WidgetSnapshot.sample(running: false, now: now)
        withCover.trip?.cover = sampleCover()
        var runningCover = WidgetSnapshot.sample(running: true, now: now)
        runningCover.trip?.cover = withCover.trip?.cover
        let states: [(String, WidgetSnapshot)] = [
            ("upcoming", .sample(running: false, now: now)),
            ("running", .sample(running: true, now: now)),
            ("empty", .sampleEmpty),
            ("cover", withCover),
            ("coverrunning", runningCover),
        ]
        for scheme in [ColorScheme.light, .dark] {
            let schemeName = scheme == .dark ? "dark" : "light"
            for (stateName, snapshot) in states {
                for kind in WidgetKind.allCases {
                    for family in kind.families {
                        let view = WidgetFrame(kind: kind, family: family, snapshot: snapshot, now: now)
                            .environment(\.colorScheme, scheme)
                            .environment(\.trekStaticPreview, true)
                        try write(view, to: out.appendingPathComponent("\(kind.rawValue)-\(family.rawValue)-\(stateName)-\(schemeName).png"))
                    }
                }
            }
            let showcase = NewWidgets(snapshot: states[0].1, now: now)
                .environment(\.colorScheme, scheme)
                .environment(\.trekStaticPreview, true)
            try write(showcase, to: out.appendingPathComponent("new-widgets-\(schemeName).png"))
            for (stateName, snapshot) in states where stateName != "empty" {
                let sheet = HomeScreen(snapshot: snapshot, now: now)
                    .environment(\.colorScheme, scheme)
                    .environment(\.trekStaticPreview, true)
                try write(sheet, to: out.appendingPathComponent("home-\(stateName)-\(schemeName).png"))
            }
            let lock = LockScreen(snapshots: states.prefix(3).map(\.1), now: now).environment(\.colorScheme, scheme)
            try write(lock, to: out.appendingPathComponent("lock-\(schemeName).png"))
        }
        let args = Array(CommandLine.arguments.dropFirst())
        try Mockups.render(to: out, iconPath: args.count > 1 ? args[1] : nil, now: now)
        print("wrote \(try FileManager.default.contentsOfDirectory(atPath: out.path).count) images to \(out.path)")
    }

    /// A stand-in for a trip's cover photo: dusk over layered mountains, as the
    /// small JPEG the app would send.
    @MainActor
    static func sampleCover() -> String? {
        let scene = ZStack(alignment: .bottom) {
            LinearGradient(colors: [Color(hex: 0x2B3A67), Color(hex: 0xC0617A), Color(hex: 0xF3A65A)], startPoint: .top, endPoint: .bottom)
            Circle().fill(Color(hex: 0xFFE2A8)).frame(width: 120, height: 120).offset(x: 140, y: -170).blur(radius: 2)
            Ridge(height: 0.55, seed: 3).fill(Color(hex: 0x6B4A6E))
            Ridge(height: 0.42, seed: 7).fill(Color(hex: 0x3E2E4F))
            Ridge(height: 0.26, seed: 11).fill(Color(hex: 0x1C1726))
        }
        .frame(width: 720, height: 480)
        let renderer = ImageRenderer(content: scene)
        renderer.scale = 1
        guard let image = renderer.nsImage, let tiff = image.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiff),
              let jpeg = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.74]) else { return nil }
        return jpeg.base64EncodedString()
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
    case trip, today, bookings, todos, packing, atlas, collab

    var families: [TrekFamily] {
        switch self {
        case .trip: return [.small, .medium, .large, .circular, .rectangular, .inline]
        case .today: return [.medium, .large]
        case .bookings: return [.small, .medium, .large, .rectangular, .inline]
        case .todos: return [.small, .medium, .large, .circular, .rectangular]
        case .packing: return [.small, .medium, .large, .circular, .rectangular]
        case .atlas: return [.small, .medium, .large, .circular, .rectangular, .inline]
        case .collab: return [.small, .medium, .large, .rectangular]
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
            // As the lock screen draws them: white on the wallpaper, no box of their own
            // (the circular one gets the system's soft disc).
            content
                .foregroundStyle(.white)
                .frame(width: size.width, height: size.height)
                .background(Circle().fill(Color.white.opacity(family == .circular ? 0.14 : 0)))
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
        case .packing: PackingContent(snapshot: snapshot, family: family, now: now)
        case .atlas: AtlasContent(snapshot: snapshot, family: family)
        case .collab: CollabContent(snapshot: snapshot, family: family)
        }
    }

    @ViewBuilder
    private var background: some View {
        if kind == .trip && snapshot.trip != nil {
            TripBackdrop(trip: snapshot.trip)
        } else {
            TrekPaper(contours: kind != .atlas)
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

/// A mountain ridge across the bottom of its frame.
struct Ridge: Shape {
    let height: CGFloat
    let seed: Int

    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX, y: rect.maxY))
        let steps = 48
        for step in 0...steps {
            let x: CGFloat = rect.minX + rect.width * CGFloat(step) / CGFloat(steps)
            let phase: CGFloat = CGFloat(step) * 0.35 + CGFloat(seed)
            let wave: CGFloat = sin(phase) * 0.06 + sin(phase * 2.7) * 0.035
            let y: CGFloat = rect.maxY - rect.height * (height + wave)
            path.addLine(to: CGPoint(x: x, y: y))
        }
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        path.closeSubpath()
        return path
    }
}

/// The packing, atlas and group widgets side by side, the sheet to judge them by.
struct NewWidgets: View {
    let snapshot: WidgetSnapshot
    let now: Date
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        VStack(spacing: 22) {
            HStack(spacing: 22) {
                WidgetFrame(kind: .packing, family: .small, snapshot: snapshot, now: now)
                WidgetFrame(kind: .atlas, family: .small, snapshot: snapshot, now: now)
            }
            WidgetFrame(kind: .atlas, family: .medium, snapshot: snapshot, now: now)
            WidgetFrame(kind: .packing, family: .medium, snapshot: snapshot, now: now)
            WidgetFrame(kind: .collab, family: .medium, snapshot: snapshot, now: now)
            HStack(spacing: 22) {
                WidgetFrame(kind: .collab, family: .small, snapshot: snapshot, now: now)
                WidgetFrame(kind: .todos, family: .small, snapshot: snapshot, now: now)
            }
            WidgetFrame(kind: .atlas, family: .large, snapshot: snapshot, now: now)
            WidgetFrame(kind: .packing, family: .large, snapshot: snapshot, now: now)
            WidgetFrame(kind: .collab, family: .large, snapshot: snapshot, now: now)
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
