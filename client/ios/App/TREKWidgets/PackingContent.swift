import SwiftUI

/// The packing list: how much is in the bags, each bag against its weight
/// limit, and what is still missing, with a nudge when departure is close.
struct PackingContent: View {
    let snapshot: WidgetSnapshot?
    let family: TrekFamily
    let now: Date
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let packing = snapshot?.packing
        let labels = snapshot?.labels
        if family.isAccessory {
            accessory(packing, labels)
        } else if let packing, let labels, packing.total > 0 {
            let missing = packing.total - packing.packed
            switch family {
            case .small:
                VStack(alignment: .leading, spacing: 0) {
                    header(labels)
                    Spacer(minLength: 0)
                    HStack {
                        Spacer(minLength: 0)
                        ring(packing, size: 88)
                        Spacer(minLength: 0)
                    }
                    Spacer(minLength: 0)
                    Text("\(missing) \(labels.missing ?? "")")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Trek.muted(scheme))
                        .lineLimit(1)
                }
            case .medium:
                HStack(spacing: 14) {
                    ring(packing, size: 104)
                    VStack(alignment: .leading, spacing: 6) {
                        header(labels)
                        missingList(Array((packing.missing ?? []).prefix(4)))
                        Spacer(minLength: 0)
                    }
                }
            default:
                VStack(alignment: .leading, spacing: 10) {
                    HStack(alignment: .center, spacing: 14) {
                        ring(packing, size: 86)
                        VStack(alignment: .leading, spacing: 3) {
                            header(labels)
                            if let trip = snapshot?.trip {
                                Text(trip.title).font(.system(size: 15, weight: .heavy)).foregroundStyle(Trek.ink(scheme)).lineLimit(1)
                            }
                            Text("\(missing) \(labels.missing ?? "")")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(Trek.muted(scheme))
                        }
                        Spacer(minLength: 0)
                    }
                    VStack(spacing: 7) {
                        ForEach(Array((packing.bags ?? []).prefix(3).enumerated()), id: \.offset) { _, bag in
                            BagCard(bag: bag, scheme: scheme)
                        }
                    }
                    missingGrid(Array((packing.missing ?? []).prefix(8)))
                    Spacer(minLength: 0)
                }
            }
        } else {
            VStack(alignment: .leading, spacing: 6) {
                header(labels)
                Spacer(minLength: 0)
                Image(systemName: "suitcase.rolling.fill").font(.system(size: 32)).foregroundStyle(Trek.muted(scheme).opacity(0.5))
                Text(labels?.noTodos ?? "").font(.system(size: 13, weight: .semibold)).foregroundStyle(Trek.muted(scheme))
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
    }

    /// The days to departure while it is two or fewer away.
    private var departureSoon: Int? {
        guard snapshot?.today == nil, let days = snapshot?.daysUntilStart(from: now), (0...2).contains(days) else { return nil }
        return days
    }

    private func header(_ labels: WidgetSnapshot.Labels?) -> some View {
        HStack(spacing: 6) {
            Text(labels?.packing ?? "").trekEyebrow(scheme)
            Spacer(minLength: 0)
            if let days = departureSoon, let labels {
                Text(days == 0 ? (labels.todayShort ?? labels.today) : days == 1 ? labels.tomorrow : labels.inDays.replacingOccurrences(of: "{n}", with: "\(days)"))
                    .font(.system(size: 10, weight: .heavy))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 2)
                    .background(Capsule().fill(Trek.pending))
            }
        }
    }

    private func ring(_ packing: WidgetSnapshot.Packing, size: CGFloat) -> some View {
        let share = Double(packing.packed) / Double(max(packing.total, 1))
        return ProgressRing(value: share, lineWidth: size * 0.1, colors: [Color(hex: 0x2FA37A), Color(hex: 0x7BC96F)], trackColor: Trek.track(scheme)) {
            VStack(spacing: -1) {
                Image(systemName: "suitcase.rolling.fill").font(.system(size: size * 0.16, weight: .semibold)).foregroundStyle(Trek.confirmed)
                Text("\(Int((share * 100).rounded()))%").font(Trek.number(size * 0.22, .heavy)).foregroundStyle(Trek.ink(scheme))
            }
        }
        .frame(width: size, height: size)
    }

    private func missingList(_ items: [WidgetSnapshot.Packing.Item]) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                HStack(spacing: 8) {
                    RoundedRectangle(cornerRadius: 4, style: .continuous)
                        .stroke(Color(css: item.color) ?? Trek.faint(scheme), lineWidth: 1.7)
                        .frame(width: 13, height: 13)
                    Text(item.name).font(.system(size: 13, weight: .semibold)).foregroundStyle(Trek.ink(scheme)).lineLimit(1)
                }
            }
        }
    }

    private func missingGrid(_ items: [WidgetSnapshot.Packing.Item]) -> some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], alignment: .leading, spacing: 7) {
            ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                HStack(spacing: 7) {
                    RoundedRectangle(cornerRadius: 4, style: .continuous)
                        .stroke(Color(css: item.color) ?? Trek.faint(scheme), lineWidth: 1.6)
                        .frame(width: 12, height: 12)
                    Text(item.name).font(.system(size: 12, weight: .semibold)).foregroundStyle(Trek.ink(scheme)).lineLimit(1)
                }
            }
        }
    }

    @ViewBuilder
    private func accessory(_ packing: WidgetSnapshot.Packing?, _ labels: WidgetSnapshot.Labels?) -> some View {
        let total = packing?.total ?? 0
        let packed = packing?.packed ?? 0
        switch family {
        case .circular:
            ZStack {
                Circle().stroke(Color.white.opacity(0.25), lineWidth: 5)
                Circle().trim(from: 0, to: total > 0 ? Double(packed) / Double(total) : 0)
                    .stroke(Color.white, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                VStack(spacing: -2) {
                    Image(systemName: "suitcase.rolling.fill").font(.system(size: 9, weight: .bold))
                    Text("\(total - packed)").font(Trek.number(18, .heavy))
                }
            }
            .padding(3)
        default:
            VStack(alignment: .leading, spacing: 1) {
                HStack(spacing: 4) {
                    Image(systemName: "suitcase.rolling.fill").font(.system(size: 11, weight: .bold))
                    Text("\(labels?.packing ?? "") \(packed)/\(total)").font(.system(size: 12, weight: .bold))
                }
                ForEach(Array((packing?.missing ?? []).prefix(2).enumerated()), id: \.offset) { _, item in
                    Text("\(Image(systemName: "square")) \(item.name)").font(.system(size: 12, weight: .medium)).lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

/// A bag in its colour: how full, and its weight against the limit.
struct BagCard: View {
    let bag: WidgetSnapshot.Packing.Bag
    let scheme: ColorScheme

    var body: some View {
        let color = Color(css: bag.color) ?? Trek.info
        let share = bag.limit.map { Double(bag.grams) / Double(max($0, 1)) }
        HStack(spacing: 10) {
            RoundedRectangle(cornerRadius: 9, style: .continuous)
                .fill(LinearGradient(colors: [color, color.opacity(0.75)], startPoint: .top, endPoint: .bottom))
                .frame(width: 30, height: 30)
                .overlay(Image(systemName: "bag.fill").font(.system(size: 13, weight: .semibold)).foregroundStyle(.white))
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(bag.name).font(.system(size: 12.5, weight: .bold)).foregroundStyle(Trek.ink(scheme)).lineLimit(1)
                    Spacer(minLength: 4)
                    Text(weight(bag)).font(Trek.number(11.5, .heavy)).foregroundStyle((share ?? 0) > 1 ? Trek.danger : Trek.muted(scheme))
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Trek.track(scheme))
                        Capsule()
                            .fill((share ?? 0) > 1 ? Trek.danger : color)
                            .frame(width: max(5, geo.size.width * CGFloat(min(share ?? Double(bag.packed) / Double(max(bag.total, 1)), 1))))
                    }
                }
                .frame(height: 5)
            }
        }
        .padding(8)
        .background(RoundedRectangle(cornerRadius: 13, style: .continuous).fill(Trek.card(scheme)))
        .overlay(RoundedRectangle(cornerRadius: 13, style: .continuous).stroke(Trek.cardBorder(scheme), lineWidth: 0.7))
    }

    /// "14.2 / 23 kg", or the packed count when the bag has no limit.
    private func weight(_ bag: WidgetSnapshot.Packing.Bag) -> String {
        let kg = { (grams: Int) in String(format: "%.1f", Double(grams) / 1000) }
        if let limit = bag.limit { return "\(kg(bag.grams)) / \(kg(limit)) kg" }
        return "\(bag.packed)/\(bag.total)"
    }
}
