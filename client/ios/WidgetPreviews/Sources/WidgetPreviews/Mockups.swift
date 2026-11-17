import AppKit
import SwiftUI

/// Home and lock screens of an iPhone filled with the widgets, at the size of
/// an iPhone 16 Pro (402 by 874 points), for showing what the widgets look like
/// where they live. The app icon comes from the asset catalogue.
enum Mockups {
    @MainActor
    static func render(to out: URL, iconPath: String?, now: Date) throws {
        let icon = iconPath.flatMap { NSImage(contentsOfFile: $0) }.map { Image(nsImage: $0) }
        var upcoming = WidgetSnapshot.sample(running: false, now: now)
        upcoming.trip?.cover = Render.sampleCover()
        var running = WidgetSnapshot.sample(running: true, now: now)
        running.trip?.cover = upcoming.trip?.cover

        let pages: [(String, ColorScheme, AnyView)] = [
            ("1-travelling", .dark, AnyView(PhonePage(wallpaper: .night, icon: icon, page: 0) {
                WidgetFrame(kind: .trip, family: .large, snapshot: running, now: now)
                WidgetFrame(kind: .today, family: .medium, snapshot: running, now: now)
                AppRow(icon: icon, apps: [.maps, .photos, .camera, .weather])
            })),
            ("2-countdown", .light, AnyView(PhonePage(wallpaper: .dawn, icon: icon, page: 1) {
                WidgetFrame(kind: .trip, family: .medium, snapshot: upcoming, now: now)
                HStack(spacing: 24) {
                    WidgetFrame(kind: .bookings, family: .small, snapshot: upcoming, now: now)
                    WidgetFrame(kind: .packing, family: .small, snapshot: upcoming, now: now)
                }
                WidgetFrame(kind: .todos, family: .medium, snapshot: upcoming, now: now)
                AppRow(icon: icon, apps: [.calendar, .trek, .mail, .notes])
            })),
            ("3-explorer", .dark, AnyView(PhonePage(wallpaper: .ocean, icon: icon, page: 2) {
                WidgetFrame(kind: .atlas, family: .large, snapshot: upcoming, now: now)
                WidgetFrame(kind: .collab, family: .medium, snapshot: running, now: now)
                AppRow(icon: icon, apps: [.photos, .trek, .music, .settings])
            })),
            ("4-getting-ready", .light, AnyView(PhonePage(wallpaper: .sand, icon: icon, page: 3) {
                WidgetFrame(kind: .packing, family: .large, snapshot: upcoming, now: now)
                HStack(spacing: 24) {
                    WidgetFrame(kind: .todos, family: .small, snapshot: upcoming, now: now)
                    WidgetFrame(kind: .atlas, family: .small, snapshot: upcoming, now: now)
                }
                AppRow(icon: icon, apps: [.wallet, .trek, .maps, .clock])
            })),
            ("5-on-the-road", .dark, AnyView(PhonePage(wallpaper: .night, icon: icon, page: 4) {
                HStack(spacing: 24) {
                    WidgetFrame(kind: .trip, family: .small, snapshot: running, now: now)
                    WidgetFrame(kind: .collab, family: .small, snapshot: running, now: now)
                }
                WidgetFrame(kind: .bookings, family: .medium, snapshot: running, now: now)
                HStack(spacing: 24) {
                    WidgetFrame(kind: .bookings, family: .small, snapshot: running, now: now)
                    WidgetFrame(kind: .atlas, family: .small, snapshot: running, now: now)
                }
                AppRow(icon: icon, apps: [.maps, .trek, .camera, .weather])
            })),
            ("6-lock-screen", .dark, AnyView(LockPage(snapshot: running, now: now))),
        ]
        for (name, scheme, view) in pages {
            try Render.write(
                view.environment(\.colorScheme, scheme).environment(\.trekStaticPreview, true),
                to: out.appendingPathComponent("mockup-\(name).png")
            )
        }
    }
}

// MARK: - The phone

enum Wallpaper {
    case night, dawn, ocean, sand

    @ViewBuilder var view: some View {
        switch self {
        case .night:
            ZStack {
                LinearGradient(colors: [Color(hex: 0x0E1230), Color(hex: 0x1B1340), Color(hex: 0x05060C)], startPoint: .top, endPoint: .bottom)
                RadialGradient(colors: [Color(hex: 0x6A3FD8).opacity(0.75), .clear], center: UnitPoint(x: 0.15, y: 0.25), startRadius: 0, endRadius: 360)
                RadialGradient(colors: [Color(hex: 0x1E8FD8).opacity(0.6), .clear], center: UnitPoint(x: 0.9, y: 0.7), startRadius: 0, endRadius: 380)
            }
        case .dawn:
            ZStack {
                LinearGradient(colors: [Color(hex: 0xF6D5C3), Color(hex: 0xE9B8C9), Color(hex: 0xB9C6EE)], startPoint: .top, endPoint: .bottom)
                RadialGradient(colors: [Color(hex: 0xFFE2A8).opacity(0.9), .clear], center: UnitPoint(x: 0.8, y: 0.15), startRadius: 0, endRadius: 320)
                RadialGradient(colors: [Color(hex: 0x8FA8F0).opacity(0.7), .clear], center: UnitPoint(x: 0.1, y: 0.85), startRadius: 0, endRadius: 360)
            }
        case .ocean:
            ZStack {
                LinearGradient(colors: [Color(hex: 0x03263A), Color(hex: 0x064D5C), Color(hex: 0x021018)], startPoint: .topLeading, endPoint: .bottomTrailing)
                RadialGradient(colors: [Color(hex: 0x22C7A9).opacity(0.55), .clear], center: UnitPoint(x: 0.85, y: 0.2), startRadius: 0, endRadius: 340)
                RadialGradient(colors: [Color(hex: 0x2E5BD8).opacity(0.55), .clear], center: UnitPoint(x: 0.1, y: 0.75), startRadius: 0, endRadius: 360)
            }
        case .sand:
            ZStack {
                LinearGradient(colors: [Color(hex: 0xEFE6D8), Color(hex: 0xE3D2BC), Color(hex: 0xCFD9D4)], startPoint: .top, endPoint: .bottom)
                RadialGradient(colors: [Color(hex: 0xF4B183).opacity(0.65), .clear], center: UnitPoint(x: 0.2, y: 0.2), startRadius: 0, endRadius: 330)
                RadialGradient(colors: [Color(hex: 0x9CC5B8).opacity(0.7), .clear], center: UnitPoint(x: 0.9, y: 0.8), startRadius: 0, endRadius: 360)
            }
        }
    }
}

/// One page of the home screen: status bar, the widgets and apps, the page
/// dots and the dock, on the wallpaper, with the screen's rounded corners.
struct PhonePage<Content: View>: View {
    let wallpaper: Wallpaper
    let icon: Image?
    let page: Int
    @ViewBuilder var content: () -> Content

    var body: some View {
        ZStack(alignment: .top) {
            wallpaper.view
            VStack(spacing: 0) {
                StatusBar(dark: wallpaper == .night || wallpaper == .ocean)
                VStack(spacing: 22) { content() }
                    .padding(.top, 14)
                Spacer(minLength: 0)
                PageDots(count: 5, current: page)
                    .padding(.bottom, 12)
                Dock(icon: icon)
                    .padding(.horizontal, 12)
                    .padding(.bottom, 14)
            }
        }
        .frame(width: 402, height: 874)
        .clipShape(RoundedRectangle(cornerRadius: 56, style: .continuous))
        .padding(30)
        .background(Color(hex: 0x111214))
    }
}

struct StatusBar: View {
    let dark: Bool

    var body: some View {
        HStack {
            Text("9:41").font(.system(size: 17, weight: .semibold))
                .frame(width: 120)
            Spacer()
            Capsule().fill(.black).frame(width: 124, height: 36)
            Spacer()
            HStack(spacing: 6) {
                Image(systemName: "cellularbars")
                Image(systemName: "wifi")
                Image(systemName: "battery.100percent")
            }
            .font(.system(size: 15, weight: .semibold))
            .frame(width: 120)
        }
        .foregroundStyle(dark ? .white : .black)
        .padding(.top, 12)
        .frame(height: 58)
    }
}

struct PageDots: View {
    let count: Int
    let current: Int

    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<count, id: \.self) { index in
                Circle().fill(Color.white.opacity(index == current ? 0.95 : 0.4)).frame(width: 7, height: 7)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .background(Capsule().fill(Color.black.opacity(0.18)))
    }
}

/// A generic app, drawn as a symbol on a gradient, never a real app's icon.
enum MockApp {
    case trek, maps, photos, camera, weather, calendar, mail, notes, music, settings, wallet, clock, phone, messages, browser

    var name: String {
        switch self {
        case .trek: return "TREK"
        case .maps: return "Maps"
        case .photos: return "Photos"
        case .camera: return "Camera"
        case .weather: return "Weather"
        case .calendar: return "Calendar"
        case .mail: return "Mail"
        case .notes: return "Notes"
        case .music: return "Music"
        case .settings: return "Settings"
        case .wallet: return "Wallet"
        case .clock: return "Clock"
        case .phone: return "Phone"
        case .messages: return "Messages"
        case .browser: return "Browser"
        }
    }

    var look: (String, [Color], Color) {
        switch self {
        case .trek: return ("map.fill", [Color(hex: 0x202024), Color(hex: 0x0C0C0F)], .white)
        case .maps: return ("map", [Color(hex: 0x6FD08C), Color(hex: 0x2FA37A)], .white)
        case .photos: return ("camera.macro", [Color(hex: 0xFFFFFF), Color(hex: 0xF2F2F2)], Color(hex: 0xE8A13A))
        case .camera: return ("camera.fill", [Color(hex: 0xC8C8CC), Color(hex: 0x8E8E93)], Color(hex: 0x2B2B2E))
        case .weather: return ("cloud.sun.fill", [Color(hex: 0x5AB3F5), Color(hex: 0x2E6FD8)], .white)
        case .calendar: return ("calendar", [Color(hex: 0xFFFFFF), Color(hex: 0xF4F4F4)], Color(hex: 0xE5484D))
        case .mail: return ("envelope.fill", [Color(hex: 0x56B4FF), Color(hex: 0x1D7AF2)], .white)
        case .notes: return ("note.text", [Color(hex: 0xFFE27A), Color(hex: 0xF5C542)], Color(hex: 0x5A4A12))
        case .music: return ("music.note", [Color(hex: 0xFF6B81), Color(hex: 0xF0304F)], .white)
        case .settings: return ("gearshape.fill", [Color(hex: 0xA6A6AB), Color(hex: 0x6E6E73)], .white)
        case .wallet: return ("wallet.pass.fill", [Color(hex: 0x2B2B2E), Color(hex: 0x111113)], Color(hex: 0x7BC96F))
        case .clock: return ("clock.fill", [Color(hex: 0x2B2B2E), Color(hex: 0x111113)], .white)
        case .phone: return ("phone.fill", [Color(hex: 0x6FE38A), Color(hex: 0x34C759)], .white)
        case .messages: return ("message.fill", [Color(hex: 0x6FE38A), Color(hex: 0x34C759)], .white)
        case .browser: return ("safari.fill", [Color(hex: 0x56B4FF), Color(hex: 0x1D7AF2)], .white)
        }
    }
}

struct AppIcon: View {
    let app: MockApp
    let icon: Image?
    var label = true

    var body: some View {
        VStack(spacing: 5) {
            Group {
                if app == .trek, let icon {
                    icon.resizable().scaledToFill()
                } else {
                    let (symbol, colors, ink) = app.look
                    LinearGradient(colors: colors, startPoint: .top, endPoint: .bottom)
                        .overlay(Image(systemName: symbol).font(.system(size: 28, weight: .medium)).foregroundStyle(ink))
                }
            }
            .frame(width: 64, height: 64)
            .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
            .shadow(color: .black.opacity(0.18), radius: 3, y: 1)
            if label {
                Text(app.name).font(.system(size: 12, weight: .medium)).foregroundStyle(.white).shadow(color: .black.opacity(0.35), radius: 2)
            }
        }
        .frame(width: 80)
    }
}

struct AppRow: View {
    let icon: Image?
    let apps: [MockApp]

    var body: some View {
        HStack(spacing: 13) {
            ForEach(Array(apps.enumerated()), id: \.offset) { _, app in AppIcon(app: app, icon: icon) }
        }
    }
}

struct Dock: View {
    let icon: Image?

    var body: some View {
        HStack(spacing: 13) {
            ForEach([MockApp.phone, .browser, .messages, .trek], id: \.name) { app in
                AppIcon(app: app, icon: icon, label: false)
            }
        }
        .padding(.vertical, 14)
        .frame(maxWidth: .infinity)
        .background(RoundedRectangle(cornerRadius: 38, style: .continuous).fill(Color.white.opacity(0.22)))
        .overlay(RoundedRectangle(cornerRadius: 38, style: .continuous).stroke(Color.white.opacity(0.25), lineWidth: 0.6))
    }
}

// MARK: - The lock screen

struct LockPage: View {
    let snapshot: WidgetSnapshot
    let now: Date

    var body: some View {
        VStack(spacing: 0) {
                StatusBar(dark: true)
                Image(systemName: "lock.fill").font(.system(size: 18, weight: .semibold)).foregroundStyle(.white).padding(.top, 6)
                LockAccessory(kind: .trip, family: .inline, snapshot: snapshot, now: now)
                    .padding(.top, 10)
                Text("9:41")
                    .font(.system(size: 104, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.92))
                    .padding(.top, -6)
                HStack(spacing: 14) {
                    LockAccessory(kind: .trip, family: .circular, snapshot: snapshot, now: now)
                    LockAccessory(kind: .packing, family: .circular, snapshot: snapshot, now: now)
                    LockAccessory(kind: .bookings, family: .rectangular, snapshot: snapshot, now: now)
                }
                .padding(.top, 4)
                Spacer(minLength: 0)
                LiveActivityMock(snapshot: snapshot, now: now)
                    .padding(.horizontal, 12)
                HStack {
                    LockButton(symbol: "flashlight.off.fill")
                    Spacer()
                    LockButton(symbol: "camera.fill")
                }
                .padding(.horizontal, 46)
                .padding(.top, 22)
                Capsule().fill(.white).frame(width: 140, height: 5).padding(.top, 20).padding(.bottom, 10)
        }
        .frame(width: 402, height: 874)
        // Behind, not inside: a photo filled into a stack would widen it past the screen.
        .background(TripBackdrop(trip: snapshot.trip, shade: 0.35).frame(width: 402, height: 874).clipped())
        .clipShape(RoundedRectangle(cornerRadius: 56, style: .continuous))
        .padding(30)
        .background(Color(hex: 0x111214))
    }
}

private struct LockButton: View {
    let symbol: String

    var body: some View {
        Circle().fill(Color.black.opacity(0.35)).frame(width: 50, height: 50)
            .overlay(Image(systemName: symbol).font(.system(size: 19)).foregroundStyle(.white))
    }
}

/// The travel day's Live Activity as the lock screen shows it (the real one is
/// TripDayLiveActivity, which needs ActivityKit).
struct LiveActivityMock: View {
    let snapshot: WidgetSnapshot
    let now: Date

    var body: some View {
        let today = snapshot.today
        let minutes = Calendar.current.component(.hour, from: now) * 60 + Calendar.current.component(.minute, from: now)
        let stops = today?.stops ?? []
        let next = stops.first { ($0.minutes ?? -1) >= minutes } ?? stops.last
        let done = stops.filter { ($0.minutes ?? Int.max) < minutes }.count
        HStack(spacing: 14) {
            ZStack {
                Circle().stroke(Color.white.opacity(0.18), lineWidth: 5)
                Circle().trim(from: 0, to: stops.isEmpty ? 0 : Double(done) / Double(stops.count))
                    .stroke(Trek.confirmed, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Image(systemName: "mappin.and.ellipse").font(.system(size: 17, weight: .bold)).foregroundStyle(.white)
            }
            .frame(width: 52, height: 52)
            VStack(alignment: .leading, spacing: 3) {
                HStack {
                    Text(snapshot.trip?.title ?? "").font(.system(size: 11, weight: .bold)).tracking(0.5).textCase(.uppercase).foregroundStyle(.white.opacity(0.65)).lineLimit(1)
                    Spacer(minLength: 4)
                    Text(today?.dayLabel ?? "").font(.system(size: 11, weight: .bold)).foregroundStyle(.white.opacity(0.65))
                }
                HStack(alignment: .firstTextBaseline) {
                    Text(next?.name ?? "").font(.system(size: 18, weight: .heavy)).foregroundStyle(.white).lineLimit(1)
                    Spacer(minLength: 4)
                    Text(next?.time ?? "").font(Trek.number(18, .heavy)).foregroundStyle(.white)
                }
                DaySegments(index: done + 1, total: max(stops.count, 1), color: Trek.confirmed, track: Color.white.opacity(0.2))
                    .padding(.top, 3)
            }
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 26, style: .continuous).fill(Color(hex: 0x0C0C0F).opacity(0.78)))
    }
}

/// A lock-screen accessory as the system draws it: white on the wallpaper,
/// the circular ones on a soft disc, no box of their own.
struct LockAccessory: View {
    let kind: WidgetKind
    let family: TrekFamily
    let snapshot: WidgetSnapshot
    let now: Date

    var body: some View {
        let size = family.previewSize
        Group {
            switch kind {
            case .trip: TripContent(snapshot: snapshot, family: family, now: now)
            case .bookings: BookingsContent(snapshot: snapshot, family: family, now: now)
            case .flight: FlightContent(snapshot: snapshot, family: family, now: now)
            case .todos: TodosContent(snapshot: snapshot, family: family, now: now)
            case .packing: PackingContent(snapshot: snapshot, family: family, now: now)
            case .atlas: AtlasContent(snapshot: snapshot, family: family)
            default: EmptyView()
            }
        }
        .foregroundStyle(.white)
        .frame(width: size.width, height: size.height)
        .background(Circle().fill(Color.white.opacity(family == .circular ? 0.16 : 0)))
    }
}
