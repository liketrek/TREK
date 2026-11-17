import SwiftUI

/// The trip's open to-dos and the packing list: how far along both are, as
/// rings and a bar, and the to-dos that matter most, by due date and priority.
struct TodosContent: View {
    let snapshot: WidgetSnapshot?
    let family: TrekFamily
    let now: Date
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let todos = snapshot?.todos
        let labels = snapshot?.labels
        if family.isAccessory {
            accessory(todos, labels)
        } else if let labels, let todos, todos.total > 0 {
            switch family {
            case .small: small(todos, labels)
            case .medium:
                HStack(spacing: 14) {
                    rings(todos, labels, size: 104)
                    VStack(alignment: .leading, spacing: 0) {
                        header(labels, todos)
                        items(Array(todos.items.prefix(3)), labels).padding(.top, 6)
                        Spacer(minLength: 0)
                    }
                }
            default:
                VStack(alignment: .leading, spacing: 0) {
                    HStack(alignment: .center, spacing: 14) {
                        rings(todos, labels, size: 96)
                        VStack(alignment: .leading, spacing: 8) {
                            header(labels, todos)
                        }
                    }
                    Divider().overlay(Trek.track(scheme)).padding(.vertical, 10)
                    items(Array(todos.items.prefix(7)), labels)
                    Spacer(minLength: 8)
                    legend(todos, labels)
                }
            }
        } else {
            VStack(alignment: .leading, spacing: 6) {
                Text(labels?.todos ?? "").trekEyebrow(scheme)
                Spacer(minLength: 0)
                Image(systemName: "checkmark.seal.fill")
                    .font(.system(size: 34))
                    .foregroundStyle(Trek.confirmed.opacity(0.85))
                Text(labels?.noTodos ?? "").font(.system(size: 14, weight: .bold)).foregroundStyle(Trek.ink(scheme))
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
    }

    private func small(_ todos: WidgetSnapshot.Todos, _ labels: WidgetSnapshot.Labels) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top) {
                Text(labels.todos ?? "").trekEyebrow(scheme)
                Spacer(minLength: 0)
            }
            Spacer(minLength: 0)
            HStack {
                Spacer(minLength: 0)
                rings(todos, labels, size: 92)
                Spacer(minLength: 0)
            }
            Spacer(minLength: 0)
            if let first = todos.items.first {
                HStack(spacing: 5) {
                    Circle().stroke(Trek.priority(first.priority) ?? Trek.faint(scheme), lineWidth: 1.6).frame(width: 10, height: 10)
                    Text(first.name).font(.system(size: 12, weight: .semibold)).foregroundStyle(Trek.ink(scheme)).lineLimit(1)
                }
            }
        }
    }

    /// The share of the to-dos done as a ring, the open ones in the middle.
    private func rings(_ todos: WidgetSnapshot.Todos, _ labels: WidgetSnapshot.Labels, size: CGFloat) -> some View {
        let done = todos.total > 0 ? Double(todos.total - todos.open) / Double(todos.total) : 1
        let width = size * 0.1
        return ZStack {
            ProgressRing(value: done, lineWidth: width, colors: [Color(hex: 0x4A7DDB), Color(hex: 0x6A5BE0)], trackColor: Trek.track(scheme)) { EmptyView() }
            VStack(spacing: -2) {
                Text("\(todos.open)").font(Trek.number(size * 0.3, .heavy)).foregroundStyle(Trek.ink(scheme))
                Image(systemName: "checklist").font(.system(size: size * 0.11, weight: .bold)).foregroundStyle(Trek.muted(scheme))
            }
        }
        .frame(width: size, height: size)
    }

    /// What the two rings stand for, with their counts.
    private func legend(_ todos: WidgetSnapshot.Todos, _ labels: WidgetSnapshot.Labels) -> some View {
        HStack(spacing: 8) {
            LegendPill(color: Color(hex: 0x5A6CDE), symbol: "checklist", text: labels.todos ?? "", count: "\(todos.total - todos.open)/\(todos.total)")
            Spacer(minLength: 0)
        }
    }

    private func header(_ labels: WidgetSnapshot.Labels, _ todos: WidgetSnapshot.Todos) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(labels.todos ?? "").trekEyebrow(scheme)
            if let trip = snapshot?.trip {
                Text(trip.title).font(.system(size: 15, weight: .heavy)).foregroundStyle(Trek.ink(scheme)).lineLimit(1)
            }
        }
    }

    private func items(_ items: [WidgetSnapshot.Todo], _ labels: WidgetSnapshot.Labels) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                HStack(spacing: 8) {
                    Circle()
                        .stroke(Trek.priority(item.priority) ?? Trek.faint(scheme), lineWidth: 1.7)
                        .frame(width: 14, height: 14)
                    Text(item.name)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Trek.ink(scheme))
                        .lineLimit(1)
                    Spacer(minLength: 4)
                    if let due = RelativeDay.label(item.due, now: now, labels: labels) {
                        Text(due)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(overdue(item.due) ? Trek.danger : Trek.muted(scheme))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Capsule().fill(overdue(item.due) ? Trek.danger.opacity(0.12) : Trek.card(scheme)))
                    }
                }
            }
        }
    }

    private func overdue(_ due: String?) -> Bool {
        guard let due, let date = WidgetSnapshot.day(due), let days = WidgetSnapshot.daysBetween(now, date) else { return false }
        return days <= 0
    }

    @ViewBuilder
    private func accessory(_ todos: WidgetSnapshot.Todos?, _ labels: WidgetSnapshot.Labels?) -> some View {
        let open = todos?.open ?? 0
        let total = todos?.total ?? 0
        switch family {
        case .circular:
            ZStack {
                Circle().stroke(Color.white.opacity(0.25), lineWidth: 5)
                Circle().trim(from: 0, to: total > 0 ? Double(total - open) / Double(total) : 1)
                    .stroke(Color.white, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                VStack(spacing: -2) {
                    Image(systemName: "checklist").font(.system(size: 9, weight: .bold))
                    Text("\(open)").font(Trek.number(18, .heavy))
                }
            }
            .padding(3)
        case .rectangular:
            VStack(alignment: .leading, spacing: 1) {
                HStack(spacing: 4) {
                    Image(systemName: "checklist").font(.system(size: 11, weight: .bold))
                    Text("\(labels?.todos ?? "") \(open)/\(total)").font(.system(size: 12, weight: .bold))
                }
                ForEach(Array((todos?.items ?? []).prefix(2).enumerated()), id: \.offset) { _, item in
                    Text("\(Image(systemName: "circle")) \(item.name)").font(.system(size: 12, weight: .medium)).lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        default:
            Text("\(Image(systemName: "checklist")) \(open) \(labels?.todos ?? "")")
        }
    }
}

/// A ring's colour, what it counts, and how far it is.
struct LegendPill: View {
    let color: Color
    let symbol: String
    let text: String
    let count: String
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        HStack(spacing: 5) {
            Circle().fill(color).frame(width: 7, height: 7)
            Image(systemName: symbol).font(.system(size: 10, weight: .bold)).foregroundStyle(color)
            Text(text).font(.system(size: 11, weight: .bold)).foregroundStyle(Trek.ink(scheme)).lineLimit(1)
            Text(count).font(Trek.number(11, .heavy)).foregroundStyle(Trek.muted(scheme))
        }
        .padding(.horizontal, 9)
        .padding(.vertical, 5)
        .background(Capsule().fill(Trek.card(scheme)))
        .overlay(Capsule().stroke(Trek.cardBorder(scheme), lineWidth: 0.6))
    }
}

/// The packing list as a bar with the suitcase and the count.
struct PackingBar: View {
    let packing: WidgetSnapshot.Packing
    let labels: WidgetSnapshot.Labels
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let share = packing.total > 0 ? Double(packing.packed) / Double(packing.total) : 1
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 5) {
                Image(systemName: "suitcase.rolling.fill").font(.system(size: 11, weight: .bold)).foregroundStyle(Trek.confirmed)
                Text(labels.packing ?? "").font(.system(size: 11.5, weight: .bold)).foregroundStyle(Trek.ink(scheme))
                Spacer(minLength: 0)
                Text("\(packing.packed)/\(packing.total)").font(Trek.number(11.5, .heavy)).foregroundStyle(Trek.muted(scheme))
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Trek.track(scheme))
                    Capsule()
                        .fill(LinearGradient(colors: [Color(hex: 0x2FA37A), Color(hex: 0x7BC96F)], startPoint: .leading, endPoint: .trailing))
                        .frame(width: max(6, geo.size.width * CGFloat(share)))
                }
            }
            .frame(height: 6)
        }
    }
}
