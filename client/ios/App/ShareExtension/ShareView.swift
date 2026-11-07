import SwiftUI

/// The sheet: what was shared, the trip it goes to, and one button. It rises over
/// the app that shared, in the system material, and answers the tap with a
/// checkmark before TREK comes forward.
struct ShareView: View {
    @ObservedObject var model: ShareModel
    @Environment(\.colorScheme) private var scheme
    @State private var shown = false

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.black.opacity(shown ? 0.28 : 0)
                .ignoresSafeArea()
                .onTapGesture { dismiss() }

            card
                .offset(y: shown ? 0 : 520)
        }
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.86)) { shown = true }
        }
    }

    private func dismiss() {
        withAnimation(.easeIn(duration: 0.2)) { shown = false }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { model.onCancel() }
    }

    // MARK: - Card

    private var card: some View {
        VStack(spacing: 0) {
            Capsule()
                .fill(ShareStyle.faint(scheme).opacity(0.5))
                .frame(width: 38, height: 5)
                .padding(.top, 8)

            header
                .padding(.horizontal, 20)
                .padding(.top, 14)

            Group {
                switch model.phase {
                case .failed(let message):
                    failure(message)
                default:
                    content
                }
            }
            .padding(.top, 16)
        }
        .padding(.bottom, 12)
        .frame(maxWidth: 560)
        .background(
            RoundedRectangle(cornerRadius: 32, style: .continuous)
                .fill(.regularMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 32, style: .continuous)
                        .strokeBorder(ShareStyle.edge(scheme), lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.25), radius: 30, y: 10)
                .ignoresSafeArea(edges: .bottom)
        )
        .padding(.horizontal, 6)
    }

    private var header: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 11, style: .continuous)
                    .fill(ShareStyle.ink(scheme))
                Text("T")
                    .font(.system(size: 20, weight: .heavy, design: .rounded))
                    .foregroundColor(ShareStyle.paper(scheme))
            }
            .frame(width: 38, height: 38)

            VStack(alignment: .leading, spacing: 1) {
                Text("TREK")
                    .font(.system(size: 12, weight: .bold))
                    .tracking(2.4)
                    .foregroundColor(ShareStyle.muted(scheme))
                Text(L("share.title"))
                    .font(.system(size: 19, weight: .bold))
                    .foregroundColor(ShareStyle.ink(scheme))
            }
            Spacer()
            Button(action: dismiss) {
                Image(systemName: "xmark")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(ShareStyle.muted(scheme))
                    .frame(width: 32, height: 32)
                    .background(Circle().fill(ShareStyle.track(scheme)))
            }
            .accessibilityLabel(L("share.cancel"))
        }
    }

    @ViewBuilder
    private var content: some View {
        VStack(alignment: .leading, spacing: 18) {
            itemCard
                .padding(.horizontal, 20)

            VStack(alignment: .leading, spacing: 10) {
                Text(L("share.trip").uppercased())
                    .font(.system(size: 12, weight: .bold))
                    .tracking(1.2)
                    .foregroundColor(ShareStyle.faint(scheme))
                    .padding(.horizontal, 22)
                if model.trips.isEmpty {
                    Text(L("share.noTrips"))
                        .font(.system(size: 14))
                        .foregroundColor(ShareStyle.muted(scheme))
                        .padding(.horizontal, 22)
                } else {
                    tripRail
                }
            }

            Text(L("share.hint"))
                .font(.system(size: 13))
                .foregroundColor(ShareStyle.faint(scheme))
                .frame(maxWidth: .infinity)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)

            addButton
                .padding(.horizontal, 20)
        }
    }

    // MARK: - The shared item

    private var itemCard: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(LinearGradient(colors: ShareStyle.kindColors(model.item?.kind ?? .file),
                                         startPoint: .topLeading, endPoint: .bottomTrailing))
                Image(systemName: (model.item?.kind ?? .file).symbol)
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundColor(.white)
            }
            .frame(width: 54, height: 54)

            VStack(alignment: .leading, spacing: 6) {
                Text(model.item?.title ?? L("share.reading"))
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(ShareStyle.ink(scheme))
                    .lineLimit(2)
                HStack(spacing: 6) {
                    if let item = model.item {
                        badge(L("share.kind.\(item.kind.rawValue)"))
                        if let source = item.source { badge(source) }
                        badge(item.sizeLabel)
                    } else {
                        ProgressView().scaleEffect(0.8)
                    }
                }
            }
            Spacer(minLength: 0)
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(ShareStyle.raised(scheme))
        )
        .redacted(reason: model.item == nil ? .placeholder : [])
    }

    private func badge(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 11, weight: .semibold))
            .foregroundColor(ShareStyle.muted(scheme))
            .lineLimit(1)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Capsule().fill(ShareStyle.track(scheme)))
    }

    // MARK: - Trips

    private var tripRail: some View {
        ScrollViewReader { proxy in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(model.trips) { trip in
                        tripCard(trip)
                            .id(trip.id)
                    }
                    laterCard
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 4)
            }
            .onAppear {
                if let id = model.selectedTrip { proxy.scrollTo(id, anchor: .leading) }
            }
        }
    }

    private func tripCard(_ trip: ShareHandoff.Trip) -> some View {
        let selected = model.selectedTrip == trip.id
        return Button {
            UISelectionFeedbackGenerator().selectionChanged()
            withAnimation(.spring(response: 0.32, dampingFraction: 0.7)) { model.selectedTrip = trip.id }
        } label: {
            ZStack(alignment: .bottomLeading) {
                cover(trip)
                LinearGradient(colors: [.clear, .black.opacity(0.7)], startPoint: .center, endPoint: .bottom)
                VStack(alignment: .leading, spacing: 2) {
                    Text(trip.title)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    if let place = trip.place {
                        Text(place)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                            .lineLimit(1)
                    }
                }
                .padding(11)
            }
            .frame(width: 156, height: 118)
            .overlay(alignment: .topLeading) {
                if let when = relative(trip) {
                    Text(when)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(Capsule().fill(.black.opacity(0.35)))
                        .padding(9)
                }
            }
            .overlay(alignment: .topTrailing) {
                if selected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 22, weight: .semibold))
                        .symbolRenderingMode(.palette)
                        .foregroundStyle(ShareStyle.ink(.light), .white)
                        .padding(7)
                        .transition(.scale.combined(with: .opacity))
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(selected ? ShareStyle.ink(scheme) : .clear, lineWidth: 2.5)
            )
            .scaleEffect(selected ? 1 : 0.96)
            .opacity(selected || model.selectedTrip == nil ? 1 : 0.78)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    @ViewBuilder
    private func cover(_ trip: ShareHandoff.Trip) -> some View {
        if let data = trip.cover, let image = UIImage(data: data) {
            Image(uiImage: image).resizable().scaledToFill()
        } else {
            ZStack {
                LinearGradient(colors: ShareStyle.tripColors(trip.id), startPoint: .topLeading, endPoint: .bottomTrailing)
                Image(systemName: "airplane")
                    .font(.system(size: 34, weight: .semibold))
                    .foregroundColor(.white.opacity(0.22))
                    .rotationEffect(.degrees(-20))
                    .offset(x: 40, y: -18)
            }
        }
    }

    private var laterCard: some View {
        let selected = model.selectedTrip == nil
        return Button {
            UISelectionFeedbackGenerator().selectionChanged()
            withAnimation(.spring(response: 0.32, dampingFraction: 0.7)) { model.selectedTrip = nil }
        } label: {
            VStack(spacing: 8) {
                Image(systemName: "rectangle.stack.badge.plus")
                    .font(.system(size: 22, weight: .semibold))
                Text(L("share.later"))
                    .font(.system(size: 13, weight: .semibold))
                    .multilineTextAlignment(.center)
            }
            .foregroundColor(ShareStyle.muted(scheme))
            .frame(width: 118, height: 118)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(selected ? ShareStyle.ink(scheme) : ShareStyle.faint(scheme).opacity(0.5),
                                  style: StrokeStyle(lineWidth: selected ? 2.5 : 1.5, dash: selected ? [] : [5, 4]))
            )
            .scaleEffect(selected ? 1 : 0.96)
        }
        .buttonStyle(.plain)
    }

    private func relative(_ trip: ShareHandoff.Trip) -> String? {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        guard let start = trip.start else { return nil }
        let end = trip.end ?? start
        if today >= calendar.startOfDay(for: start), today <= calendar.startOfDay(for: end) { return L("share.now") }
        if today > calendar.startOfDay(for: end) { return L("share.past") }
        let days = calendar.dateComponents([.day], from: today, to: calendar.startOfDay(for: start)).day ?? 0
        if days == 1 { return L("share.tomorrow") }
        return String(format: L("share.inDays"), days)
    }

    // MARK: - Button and failure

    private var addButton: some View {
        Button(action: model.add) {
            ZStack {
                switch model.phase {
                case .saving:
                    ProgressView().tint(ShareStyle.paper(scheme))
                case .done:
                    Label(L("share.added"), systemImage: "checkmark")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(.white)
                        .transition(.scale(scale: 0.6).combined(with: .opacity))
                default:
                    Text(buttonTitle)
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(ShareStyle.paper(scheme))
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                        .padding(.horizontal, 12)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .background(
                RoundedRectangle(cornerRadius: 17, style: .continuous)
                    .fill(model.phase == .done ? ShareStyle.success : ShareStyle.ink(scheme))
            )
            .scaleEffect(model.phase == .done ? 1.02 : 1)
        }
        .buttonStyle(PressStyle())
        .disabled(model.phase != .ready)
        .opacity(model.phase == .loading ? 0.5 : 1)
    }

    private var buttonTitle: String {
        if let title = model.selectedTitle { return String(format: L("share.addTo"), title) }
        return L("share.add")
    }

    private func failure(_ message: String) -> some View {
        VStack(spacing: 14) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 30, weight: .semibold))
                .foregroundColor(ShareStyle.warning)
            Text(message)
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(ShareStyle.ink(scheme))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 28)
            Button(action: dismiss) {
                Text(L("share.close"))
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(ShareStyle.ink(scheme))
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(ShareStyle.track(scheme)))
            }
            .buttonStyle(PressStyle())
            .padding(.horizontal, 20)
        }
        .padding(.vertical, 10)
    }
}

/// A press that gives a little under the thumb.
private struct PressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

/// The app's neutral palette (the same values as TREKWidgets/TrekStyle.swift).
enum ShareStyle {
    static func ink(_ scheme: ColorScheme) -> Color { scheme == .dark ? Color(hex: 0xF5F5F7) : Color(hex: 0x101013) }
    static func paper(_ scheme: ColorScheme) -> Color { scheme == .dark ? Color(hex: 0x101013) : Color(hex: 0xFFFFFF) }
    static func muted(_ scheme: ColorScheme) -> Color { scheme == .dark ? Color(hex: 0x9C9CA3) : Color(hex: 0x68686F) }
    static func faint(_ scheme: ColorScheme) -> Color { scheme == .dark ? Color(hex: 0x6E6E76) : Color(hex: 0x9A9AA1) }
    static func track(_ scheme: ColorScheme) -> Color { scheme == .dark ? Color.white.opacity(0.1) : Color(hex: 0x101013).opacity(0.06) }
    static func raised(_ scheme: ColorScheme) -> Color { scheme == .dark ? Color.white.opacity(0.06) : Color.white.opacity(0.7) }
    static func edge(_ scheme: ColorScheme) -> Color { scheme == .dark ? Color.white.opacity(0.08) : Color.black.opacity(0.05) }
    static let success = Color(hex: 0x2FA37A)
    static let warning = Color(hex: 0xE8A13A)

    static func kindColors(_ kind: ShareItem.Kind) -> [Color] {
        switch kind {
        case .pass: return [Color(hex: 0x1F1F24), Color(hex: 0x3A3A44)]
        case .pdf: return [Color(hex: 0xE5484D), Color(hex: 0xB4232A)]
        case .mail: return [Color(hex: 0x4A9DFF), Color(hex: 0x1F6FEB)]
        case .page: return [Color(hex: 0x38B2F5), Color(hex: 0x1A7FD6)]
        case .text: return [Color(hex: 0x8E8E96), Color(hex: 0x5D5D66)]
        case .image: return [Color(hex: 0xF2A93B), Color(hex: 0xE0662E)]
        case .file: return [Color(hex: 0x7C7C86), Color(hex: 0x4D4D57)]
        }
    }

    /// A trip without a cover gets a gradient of its own, steady across opens.
    static func tripColors(_ id: Int) -> [Color] {
        let base = Double((id &* 47) % 360) / 360
        return [
            Color(hue: base, saturation: 0.6, brightness: 0.78),
            Color(hue: (base + 0.11).truncatingRemainder(dividingBy: 1), saturation: 0.7, brightness: 0.42),
        ]
    }
}

private extension Color {
    init(hex: UInt32) {
        self.init(red: Double((hex >> 16) & 0xFF) / 255, green: Double((hex >> 8) & 0xFF) / 255, blue: Double(hex & 0xFF) / 255)
    }
}
