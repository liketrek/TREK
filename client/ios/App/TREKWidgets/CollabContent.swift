import SwiftUI

/// The travel group: who comes along, the latest messages in the trip chat
/// as bubbles, and the open poll with its votes as bars.
struct CollabContent: View {
    let snapshot: WidgetSnapshot?
    let family: TrekFamily
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let collab = snapshot?.collab
        let labels = snapshot?.labels
        if let collab, let labels {
            switch family {
            case .small:
                VStack(alignment: .leading, spacing: 0) {
                    Text(labels.group ?? "").trekEyebrow(scheme)
                    AvatarStack(members: collab.members, size: 30, scheme: scheme).padding(.top, 8)
                    Spacer(minLength: 0)
                    if let poll = collab.poll {
                        Label(labels.poll ?? "", systemImage: "chart.bar.fill")
                            .font(.system(size: 10.5, weight: .heavy))
                            .foregroundStyle(Trek.info)
                        Text(poll.question).font(.system(size: 13.5, weight: .bold)).foregroundStyle(Trek.ink(scheme)).lineLimit(2)
                    } else if let last = collab.messages.last {
                        Text(last.author).font(.system(size: 10.5, weight: .heavy)).foregroundStyle(Trek.muted(scheme))
                        Text(last.text).font(.system(size: 13, weight: .semibold)).foregroundStyle(Trek.ink(scheme)).lineLimit(3)
                    } else {
                        Text(labels.noMessages ?? "").font(.system(size: 12.5, weight: .semibold)).foregroundStyle(Trek.muted(scheme))
                    }
                }
            case .medium:
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(snapshot?.trip?.title ?? labels.group ?? "").trekEyebrow(scheme)
                        Spacer(minLength: 4)
                        AvatarStack(members: collab.members, size: 22, scheme: scheme)
                    }
                    bubbles(Array(collab.messages.suffix(2)), labels)
                    Spacer(minLength: 0)
                }
            case .large:
                VStack(alignment: .leading, spacing: 10) {
                    HStack(alignment: .center) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(labels.group ?? "").trekEyebrow(scheme)
                            if let trip = snapshot?.trip {
                                Text(trip.title).font(.system(size: 16, weight: .heavy)).foregroundStyle(Trek.ink(scheme)).lineLimit(1)
                            }
                        }
                        Spacer(minLength: 4)
                        AvatarStack(members: collab.members, size: 28, scheme: scheme)
                    }
                    bubbles(Array(collab.messages.suffix(3)), labels)
                    Spacer(minLength: 0)
                    if let poll = collab.poll { PollCard(poll: poll, labels: labels, scheme: scheme) }
                }
            default:
                accessory(collab, labels)
            }
        } else {
            VStack(alignment: .leading, spacing: 6) {
                Text(labels?.group ?? "").trekEyebrow(scheme)
                Spacer(minLength: 0)
                Image(systemName: "person.3.fill").font(.system(size: 28)).foregroundStyle(Trek.muted(scheme).opacity(0.5))
                Text(labels?.noMessages ?? "").font(.system(size: 13, weight: .semibold)).foregroundStyle(Trek.muted(scheme))
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private func bubbles(_ messages: [WidgetSnapshot.Collab.Message], _ labels: WidgetSnapshot.Labels) -> some View {
        if messages.isEmpty {
            Text(labels.noMessages ?? "").font(.system(size: 13, weight: .semibold)).foregroundStyle(Trek.muted(scheme))
        } else {
            VStack(spacing: 6) {
                ForEach(Array(messages.enumerated()), id: \.offset) { _, message in
                    ChatBubble(message: message, scheme: scheme)
                }
            }
        }
    }

    @ViewBuilder
    private func accessory(_ collab: WidgetSnapshot.Collab, _ labels: WidgetSnapshot.Labels) -> some View {
        if let last = collab.messages.last {
            VStack(alignment: .leading, spacing: 1) {
                HStack(spacing: 4) {
                    Image(systemName: "bubble.left.and.bubble.right.fill").font(.system(size: 11, weight: .bold))
                    Text(last.author).font(.system(size: 12, weight: .bold)).lineLimit(1)
                }
                Text(last.text).font(.system(size: 13, weight: .semibold)).lineLimit(2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        } else {
            Text(labels.noMessages ?? "").font(.system(size: 12, weight: .medium)).frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

extension Trek {
    /// A colour of a person's own, from their name.
    static func personColor(_ name: String) -> Color {
        let palette: [UInt32] = [0x4A7DDB, 0x2FA37A, 0xE8A13A, 0x8E6CD9, 0xD6408B, 0x2BA6A6, 0xD6673B, 0x5A6CDE]
        return Color(hex: palette[Int(seed(name) % UInt64(palette.count))])
    }
}

/// Overlapping initials in each person's colour, with a count for the rest.
struct AvatarStack: View {
    let members: [WidgetSnapshot.Collab.Member]
    let size: CGFloat
    let scheme: ColorScheme

    var body: some View {
        HStack(spacing: -size * 0.3) {
            ForEach(Array(members.prefix(4).enumerated()), id: \.offset) { _, member in
                Circle()
                    .fill(LinearGradient(colors: [Trek.personColor(member.name), Trek.personColor(member.name).opacity(0.75)], startPoint: .top, endPoint: .bottom))
                    .frame(width: size, height: size)
                    .overlay(Text(member.initials).font(.system(size: size * 0.38, weight: .heavy)).foregroundStyle(.white))
                    .overlay(Circle().stroke(scheme == .dark ? Color(hex: 0x111115) : Color(hex: 0xF4F2EE), lineWidth: 2))
            }
            if members.count > 4 {
                Circle()
                    .fill(Trek.card(scheme))
                    .frame(width: size, height: size)
                    .overlay(Text("+\(members.count - 4)").font(.system(size: size * 0.34, weight: .heavy)).foregroundStyle(Trek.muted(scheme)))
                    .overlay(Circle().stroke(scheme == .dark ? Color(hex: 0x111115) : Color(hex: 0xF4F2EE), lineWidth: 2))
            }
        }
    }
}

/// A chat message: the others on the left with their initials, mine on the right in ink.
struct ChatBubble: View {
    let message: WidgetSnapshot.Collab.Message
    let scheme: ColorScheme

    var body: some View {
        HStack(alignment: .bottom, spacing: 6) {
            if message.mine { Spacer(minLength: 36) }
            if !message.mine {
                Circle()
                    .fill(Trek.personColor(message.author))
                    .frame(width: 20, height: 20)
                    .overlay(Text(message.initials).font(.system(size: 8, weight: .heavy)).foregroundStyle(.white))
            }
            Text(message.text)
                .font(.system(size: 12.5, weight: .medium))
                .foregroundStyle(message.mine ? (scheme == .dark ? Color(hex: 0x101013) : .white) : Trek.ink(scheme))
                .lineLimit(2)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(message.mine ? Trek.ink(scheme) : Trek.card(scheme))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(message.mine ? Color.clear : Trek.cardBorder(scheme), lineWidth: 0.7)
                )
            if !message.mine { Spacer(minLength: 36) }
        }
    }
}

/// The open poll: the question and each option as a bar of its votes.
struct PollCard: View {
    let poll: WidgetSnapshot.Collab.Poll
    let labels: WidgetSnapshot.Labels
    let scheme: ColorScheme

    var body: some View {
        let most = max(poll.options.map(\.votes).max() ?? 1, 1)
        VStack(alignment: .leading, spacing: 7) {
            HStack(spacing: 5) {
                Image(systemName: "chart.bar.fill").font(.system(size: 10, weight: .bold)).foregroundStyle(Trek.info)
                Text(labels.poll ?? "").font(.system(size: 10.5, weight: .heavy)).textCase(.uppercase).foregroundStyle(Trek.info)
                Spacer(minLength: 0)
                Text("\(poll.voters) \(labels.votes ?? "")").font(.system(size: 10.5, weight: .bold)).foregroundStyle(Trek.muted(scheme))
            }
            Text(poll.question).font(.system(size: 13.5, weight: .bold)).foregroundStyle(Trek.ink(scheme)).lineLimit(1)
            ForEach(Array(poll.options.prefix(3).enumerated()), id: \.offset) { _, option in
                let leading = option.votes == most && option.votes > 0
                ZStack(alignment: .leading) {
                    GeometryReader { geo in
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .fill(leading ? Trek.info.opacity(scheme == .dark ? 0.35 : 0.22) : Trek.track(scheme))
                            .frame(width: max(8, geo.size.width * CGFloat(option.votes) / CGFloat(most)))
                    }
                    HStack {
                        Text(option.label).font(.system(size: 12, weight: leading ? .heavy : .semibold)).foregroundStyle(Trek.ink(scheme)).lineLimit(1)
                        Spacer(minLength: 4)
                        Text("\(option.votes)").font(Trek.number(12, .heavy)).foregroundStyle(Trek.muted(scheme))
                    }
                    .padding(.horizontal, 9)
                }
                .frame(height: 24)
            }
        }
        .padding(10)
        .background(RoundedRectangle(cornerRadius: 15, style: .continuous).fill(Trek.card(scheme)))
        .overlay(RoundedRectangle(cornerRadius: 15, style: .continuous).stroke(Trek.cardBorder(scheme), lineWidth: 0.7))
    }
}
