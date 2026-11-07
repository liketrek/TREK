import SwiftUI

/// What is booked next: flights, trains, the hotel, the table for tonight,
/// each with its kind as a coloured tile and when it is due.
struct BookingsContent: View {
    let snapshot: WidgetSnapshot?
    let family: TrekFamily
    let now: Date
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let bookings = snapshot?.bookings ?? []
        let labels = snapshot?.labels
        if family == .rectangular {
            accessory(bookings.first, labels)
        } else if family == .circular {
            ZStack {
                Circle().fill(Color.white.opacity(0.18))
                Image(systemName: bookings.first.map { Trek.booking($0.kind).symbol } ?? "bookmark.fill")
                    .font(.system(size: 22, weight: .semibold))
            }
        } else if family == .inline {
            if let first = bookings.first {
                Text("\(Image(systemName: Trek.booking(first.kind).symbol)) \(first.time ?? "") \(first.title)")
            } else {
                Text(labels?.noBookings ?? "")
            }
        } else if let labels, let first = bookings.first {
            switch family {
            case .small: hero(first, labels)
            case .medium: list(Array(bookings.prefix(2)), labels, featureFirst: true)
            case .extraLarge: wide(bookings, labels)
            default: list(Array(bookings.prefix(5)), labels, featureFirst: true)
            }
        } else {
            empty(labels)
        }
    }

    // MARK: Small: the next one, large

    private func hero(_ booking: WidgetSnapshot.Booking, _ labels: WidgetSnapshot.Labels) -> some View {
        let look = Trek.booking(booking.kind)
        return VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top) {
                KindBadge(kind: booking.kind, size: 34)
                Spacer(minLength: 0)
                StatusDot(confirmed: booking.confirmed)
            }
            Spacer(minLength: 0)
            if let day = RelativeDay.label(booking.date, now: now, labels: labels) {
                Text(day)
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(0.5)
                    .textCase(.uppercase)
                    .foregroundStyle(look.color)
            }
            if let time = booking.time {
                Text(time).font(Trek.number(30, .heavy)).foregroundStyle(Trek.ink(scheme))
            }
            Text(booking.title).font(.system(size: 14, weight: .bold)).foregroundStyle(Trek.ink(scheme)).lineLimit(1)
            if let detail = booking.detail {
                Text(detail).font(.system(size: 11.5, weight: .semibold)).foregroundStyle(Trek.muted(scheme)).lineLimit(1)
            }
        }
        .background(alignment: .topTrailing) {
            Image(systemName: look.symbol)
                .font(.system(size: 92, weight: .bold))
                .foregroundStyle(look.color.opacity(scheme == .dark ? 0.1 : 0.08))
                .rotationEffect(.degrees(booking.kind == "flight" ? -20 : 0))
                .offset(x: 28, y: 12)
        }
    }

    // MARK: Medium and large: a list, the first one featured

    private func list(_ bookings: [WidgetSnapshot.Booking], _ labels: WidgetSnapshot.Labels, featureFirst: Bool) -> some View {
        // The extra large's list stands beside a card as tall as the widget: its rows space out to match.
        VStack(alignment: .leading, spacing: family == .extraLarge ? 14 : family.isTall ? 8 : 7) {
            HStack {
                Text(labels.bookings ?? "").trekEyebrow(scheme)
                Spacer(minLength: 0)
                if let trip = snapshot?.trip { Text(trip.title).font(.system(size: 11, weight: .semibold)).foregroundStyle(Trek.faint(scheme)).lineLimit(1) }
            }
            ForEach(Array(bookings.enumerated()), id: \.offset) { index, booking in
                RowLink(path: booking.path) {
                    if index == 0 && featureFirst {
                        featured(booking, labels)
                    } else {
                        row(booking, labels)
                    }
                }
            }
            if family.isTall { Spacer(minLength: 0) }
        }
    }

    // MARK: Extra large (iPad): the next one as a card, the rest beside it

    private func wide(_ bookings: [WidgetSnapshot.Booking], _ labels: WidgetSnapshot.Labels) -> some View {
        let first = bookings[0]
        let look = Trek.booking(first.kind)
        let rest = Array(bookings.dropFirst().prefix(5))
        return HStack(alignment: .top, spacing: 18) {
            RowLink(path: first.path) {
                hero(first, labels)
                    .padding(14)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                    .background(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .fill(LinearGradient(colors: [look.color.opacity(scheme == .dark ? 0.24 : 0.14), look.color.opacity(scheme == .dark ? 0.08 : 0.04)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(look.color.opacity(0.25), lineWidth: 0.8))
            }
            .frame(maxWidth: rest.isEmpty ? CGFloat.infinity : 240)
            if !rest.isEmpty {
                list(rest, labels, featureFirst: false)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            }
        }
    }

    private func featured(_ booking: WidgetSnapshot.Booking, _ labels: WidgetSnapshot.Labels) -> some View {
        let look = Trek.booking(booking.kind)
        return HStack(spacing: 10) {
            KindBadge(kind: booking.kind, size: 38)
            VStack(alignment: .leading, spacing: 1) {
                Text(booking.title).font(.system(size: 15, weight: .heavy)).foregroundStyle(Trek.ink(scheme)).lineLimit(1)
                if let detail = booking.detail {
                    Text(detail).font(.system(size: 12, weight: .semibold)).foregroundStyle(Trek.muted(scheme)).lineLimit(1)
                }
            }
            Spacer(minLength: 4)
            VStack(alignment: .trailing, spacing: 0) {
                if let day = RelativeDay.label(booking.date, now: now, labels: labels) {
                    Text(day).font(.system(size: 10.5, weight: .heavy)).textCase(.uppercase).foregroundStyle(look.color)
                }
                if let time = booking.time { Text(time).font(Trek.number(20, .heavy)).foregroundStyle(Trek.ink(scheme)) }
            }
        }
        .padding(10)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(LinearGradient(colors: [look.color.opacity(scheme == .dark ? 0.24 : 0.14), look.color.opacity(scheme == .dark ? 0.08 : 0.04)], startPoint: .leading, endPoint: .trailing))
        )
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(look.color.opacity(0.25), lineWidth: 0.8))
    }

    private func row(_ booking: WidgetSnapshot.Booking, _ labels: WidgetSnapshot.Labels) -> some View {
        HStack(spacing: 10) {
            KindBadge(kind: booking.kind, size: 28)
                .padding(.leading, 5)
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 5) {
                    Text(booking.title).font(.system(size: 13, weight: .bold)).foregroundStyle(Trek.ink(scheme)).lineLimit(1)
                    if !booking.confirmed { StatusDot(confirmed: false, size: 6) }
                }
                if let detail = booking.detail {
                    Text(detail).font(.system(size: 11, weight: .medium)).foregroundStyle(Trek.muted(scheme)).lineLimit(1)
                }
            }
            Spacer(minLength: 4)
            VStack(alignment: .trailing, spacing: 0) {
                if let day = RelativeDay.label(booking.date, now: now, labels: labels) {
                    Text(day).font(.system(size: 10.5, weight: .bold)).foregroundStyle(Trek.muted(scheme))
                }
                if let time = booking.time { Text(time).font(Trek.number(13, .heavy)).foregroundStyle(Trek.ink(scheme)) }
            }
            .padding(.trailing, 5)
        }
    }

    private func empty(_ labels: WidgetSnapshot.Labels?) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(labels?.bookings ?? "").trekEyebrow(scheme)
            Spacer(minLength: 0)
            HStack(spacing: -8) {
                ForEach(["flight", "train", "hotel"], id: \.self) { kind in
                    KindBadge(kind: kind, size: 30).opacity(0.35)
                }
            }
            Text(labels?.noBookings ?? "")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(Trek.muted(scheme))
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private func accessory(_ booking: WidgetSnapshot.Booking?, _ labels: WidgetSnapshot.Labels?) -> some View {
        if let booking, let labels {
            VStack(alignment: .leading, spacing: 1) {
                HStack(spacing: 4) {
                    Image(systemName: Trek.booking(booking.kind).symbol).font(.system(size: 11, weight: .bold))
                    Text([RelativeDay.label(booking.date, now: now, labels: labels), booking.time].compactMap { $0 }.joined(separator: " "))
                        .font(.system(size: 12, weight: .bold))
                        .lineLimit(1)
                }
                Text(booking.title).font(.system(size: 14, weight: .heavy)).lineLimit(1)
                if let detail = booking.detail { Text(detail).font(.system(size: 11, weight: .medium)).opacity(0.75).lineLimit(1) }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        } else {
            Text(labels?.noBookings ?? "").font(.system(size: 12, weight: .medium)).frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

/// Confirmed in green, pending in amber, with a soft halo.
struct StatusDot: View {
    let confirmed: Bool
    var size: CGFloat = 9

    var body: some View {
        let color = confirmed ? Trek.confirmed : Trek.pending
        Circle()
            .fill(color)
            .frame(width: size, height: size)
            .overlay(Circle().stroke(color.opacity(0.3), lineWidth: size * 0.45).frame(width: size * 1.7, height: size * 1.7))
            .frame(width: size * 1.8, height: size * 1.8)
    }
}
