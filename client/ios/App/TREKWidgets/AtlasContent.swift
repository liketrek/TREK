import SwiftUI

/// The Atlas on the home screen: the world as dots, the visited countries
/// glowing, the latest one ringed, and how many there are.
struct AtlasContent: View {
    let snapshot: WidgetSnapshot?
    let family: TrekFamily
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let atlas = snapshot?.atlas
        let labels = snapshot?.labels
        let visited = Set(atlas?.codes ?? [])
        let latest = atlas?.recent.first?.code
        switch family {
        case .circular:
            ZStack {
                Circle().stroke(Color.white.opacity(0.25), lineWidth: 5)
                Circle().trim(from: 0, to: min(1, Double(atlas?.count ?? 0) / 195))
                    .stroke(Color.white, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                VStack(spacing: -2) {
                    Image(systemName: "globe.europe.africa.fill").font(.system(size: 9, weight: .bold))
                    Text("\(atlas?.count ?? 0)").font(Trek.number(19, .heavy))
                }
            }
            .padding(3)
        case .rectangular:
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 4) {
                    Image(systemName: "globe.europe.africa.fill").font(.system(size: 11, weight: .bold))
                    Text("\(atlas?.count ?? 0) \(labels?.countries ?? "")").font(.system(size: 14, weight: .heavy))
                }
                DotWorld(visited: visited, latest: latest, accent: [.white], rest: Color.white.opacity(0.3), dot: 1.3)
                    .frame(height: 34)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        case .inline:
            Text("\(Image(systemName: "globe.europe.africa.fill")) \(atlas?.count ?? 0) \(labels?.countries ?? "")")
        case .small:
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("\(atlas?.count ?? 0)").font(Trek.number(38, .heavy)).foregroundStyle(ink)
                    Text(labels?.countries ?? "").font(.system(size: 13, weight: .bold)).foregroundStyle(muted)
                }
                Text(share(atlas?.count ?? 0, labels)).font(.system(size: 11, weight: .semibold)).foregroundStyle(muted)
                Spacer(minLength: 6)
                DotWorld(visited: visited, latest: latest, accent: glow, rest: rest, dot: 1.35)
                    .frame(height: 64)
            }
        case .medium:
            VStack(alignment: .leading, spacing: 8) {
                DotWorld(visited: visited, latest: latest, accent: glow, rest: rest, dot: 2.2)
                    .frame(maxHeight: .infinity)
                HStack(alignment: .lastTextBaseline, spacing: 6) {
                    Text("\(atlas?.count ?? 0)").font(Trek.number(30, .heavy)).foregroundStyle(ink)
                    VStack(alignment: .leading, spacing: 0) {
                        Text(labels?.countries ?? "").font(.system(size: 12, weight: .bold)).foregroundStyle(ink)
                        Text(share(atlas?.count ?? 0, labels)).font(.system(size: 10.5, weight: .semibold)).foregroundStyle(muted)
                    }
                    Spacer(minLength: 4)
                    if let recent = atlas?.recent.first {
                        CountryPill(country: recent, highlight: true)
                    }
                }
            }
        default:
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .lastTextBaseline, spacing: 6) {
                    Text("\(atlas?.count ?? 0)").font(Trek.number(40, .heavy)).foregroundStyle(ink)
                    VStack(alignment: .leading, spacing: 0) {
                        Text(labels?.countries ?? "").font(.system(size: 14, weight: .heavy)).foregroundStyle(ink)
                        Text(share(atlas?.count ?? 0, labels)).font(.system(size: 11, weight: .semibold)).foregroundStyle(muted)
                    }
                    Spacer(minLength: 4)
                    if let trips = atlas?.trips { Stat(value: "\(trips)", symbol: "airplane", scheme: scheme) }
                    if let days = atlas?.days { Stat(value: "\(days)", symbol: "calendar", scheme: scheme) }
                }
                DotWorld(visited: visited, latest: latest, accent: glow, rest: rest, dot: 2.2)
                    .frame(height: 150)
                ContinentBars(continents: atlas?.continents ?? [], scheme: scheme)
                HStack(spacing: 6) {
                    ForEach(Array((atlas?.recent ?? []).prefix(3).enumerated()), id: \.offset) { index, country in
                        CountryPill(country: country, highlight: index == 0)
                    }
                    Spacer(minLength: 0)
                }
            }
        }
    }

    private var ink: Color { Trek.ink(scheme) }
    private var muted: Color { Trek.muted(scheme) }
    private var glow: [Color] { [Color(hex: 0x3DDC97), Color(hex: 0x4A7DDB)] }
    private var rest: Color { scheme == .dark ? Color.white.opacity(0.13) : Color(hex: 0x101013).opacity(0.11) }

    /// "12 % of the world", of the 195 countries there are.
    private func share(_ count: Int, _ labels: WidgetSnapshot.Labels?) -> String {
        let percent = Int((Double(count) / 195 * 100).rounded())
        return "\(percent) % \(labels?.world ?? "")"
    }
}

/// The world map as a grid of dots (WorldGrid): visited countries in the
/// accent from west to east, the rest faint, the latest one ringed.
struct DotWorld: View {
    let visited: Set<String>
    let latest: String?
    let accent: [Color]
    let rest: Color
    /// The dot radius at a 364 pt wide map; scaled with the width.
    var dot: CGFloat = 2

    var body: some View {
        Canvas { context, size in
            let columns = CGFloat(WorldGrid.columns)
            let rows = CGFloat(WorldGrid.rows.count)
            let step = min(size.width / columns, size.height / rows)
            let originX = (size.width - step * columns) / 2
            let originY = (size.height - step * rows) / 2
            let radius = max(0.6, step * 0.36 * dot / 2)
            var ringed: CGPoint?
            var ringCount = 0
            var ringSum = CGPoint.zero
            for row in 0..<WorldGrid.rows.count {
                for column in 0..<WorldGrid.columns {
                    guard let code = WorldGrid.code(row: row, column: column) else { continue }
                    let center = CGPoint(x: originX + (CGFloat(column) + 0.5) * step, y: originY + (CGFloat(row) + 0.5) * step)
                    let rect = CGRect(x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2)
                    if visited.contains(code) {
                        let t = CGFloat(column) / columns
                        context.fill(Path(ellipseIn: rect.insetBy(dx: -radius * 0.25, dy: -radius * 0.25)), with: .color(blend(t)))
                        if code == latest {
                            ringSum.x += center.x
                            ringSum.y += center.y
                            ringCount += 1
                        }
                    } else {
                        context.fill(Path(ellipseIn: rect), with: .color(rest))
                    }
                }
            }
            if ringCount > 0 { ringed = CGPoint(x: ringSum.x / CGFloat(ringCount), y: ringSum.y / CGFloat(ringCount)) }
            if let ringed {
                let color = accent.last ?? .white
                for (scale, alpha) in [(5.5, 0.18), (3.6, 0.35)] as [(CGFloat, Double)] {
                    let r = step * scale / 2
                    context.stroke(
                        Path(ellipseIn: CGRect(x: ringed.x - r, y: ringed.y - r, width: r * 2, height: r * 2)),
                        with: .color(color.opacity(alpha)), lineWidth: max(1, step * 0.22)
                    )
                }
                let core = step * 0.55
                context.fill(Path(ellipseIn: CGRect(x: ringed.x - core, y: ringed.y - core, width: core * 2, height: core * 2)), with: .color(.white))
            }
        }
    }

    /// The accent at a point from west (0) to east (1).
    private func blend(_ t: CGFloat) -> Color {
        guard accent.count > 1 else { return accent.first ?? .white }
        return t < 0.5 ? accent[0] : accent[accent.count - 1]
    }
}

/// A country with its flag, the latest one tinted.
struct CountryPill: View {
    let country: WidgetSnapshot.Atlas.Country
    var highlight = false
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        HStack(spacing: 5) {
            Text(flag(country.code)).font(.system(size: 13))
            Text(country.name).font(.system(size: 11.5, weight: .bold)).foregroundStyle(Trek.ink(scheme)).lineLimit(1)
        }
        .padding(.horizontal, 9)
        .padding(.vertical, 4)
        .background(Capsule().fill(highlight ? Color(hex: 0x3DDC97).opacity(scheme == .dark ? 0.2 : 0.16) : Trek.card(scheme)))
        .overlay(Capsule().stroke(highlight ? Color(hex: 0x3DDC97).opacity(0.45) : Trek.cardBorder(scheme), lineWidth: 0.7))
    }

    private func flag(_ code: String) -> String {
        code.uppercased().unicodeScalars.compactMap { UnicodeScalar(127_397 + $0.value) }.map { String($0) }.joined()
    }
}

/// The continents as bars, longest first.
struct ContinentBars: View {
    let continents: [WidgetSnapshot.Atlas.Continent]
    let scheme: ColorScheme

    var body: some View {
        let top = continents.prefix(4)
        let most = max(top.map(\.count).max() ?? 1, 1)
        VStack(spacing: 6) {
            ForEach(Array(top.enumerated()), id: \.offset) { index, continent in
                HStack(spacing: 8) {
                    Text(continent.name).font(.system(size: 11, weight: .bold)).foregroundStyle(Trek.ink(scheme))
                        .frame(width: 92, alignment: .leading).lineLimit(1)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Trek.track(scheme))
                            Capsule()
                                .fill(LinearGradient(colors: [Color(hex: 0x3DDC97), Color(hex: 0x4A7DDB)], startPoint: .leading, endPoint: .trailing))
                                .frame(width: max(6, geo.size.width * CGFloat(continent.count) / CGFloat(most)))
                                .opacity(1 - Double(index) * 0.15)
                        }
                    }
                    .frame(height: 6)
                    Text("\(continent.count)").font(Trek.number(11, .heavy)).foregroundStyle(Trek.muted(scheme)).frame(width: 20, alignment: .trailing)
                }
            }
        }
    }
}

/// A figure with its symbol, for the large atlas header.
private struct Stat: View {
    let value: String
    let symbol: String
    let scheme: ColorScheme

    var body: some View {
        HStack(spacing: 3) {
            Image(systemName: symbol).font(.system(size: 10, weight: .bold))
            Text(value).font(Trek.number(12, .heavy))
        }
        .foregroundStyle(Trek.muted(scheme))
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Capsule().fill(Trek.card(scheme)))
    }
}
