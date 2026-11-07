import SwiftUI

/// Screenshot mode only (-TrekDemo faces): every complication in every
/// family, on a dark dial, to review them without setting up a watch face.
struct FacesView: View {
    let snapshot: WatchSnapshot?
    let now: Date

    var body: some View {
        let state = ComplicationState(snapshot, now: now)
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    dial(.circular) { NextStopComplication(state: state, family: .circular, now: now) }
                    dial(.circular) { CountdownComplication(state: state, family: .circular, now: now) }
                    dial(.circular) { TripDayComplication(state: state, family: .circular) }
                }
                dial(.rectangular) { NextStopComplication(state: state, family: .rectangular, now: now) }
                dial(.rectangular) { CountdownComplication(state: state, family: .rectangular, now: now) }
                dial(.rectangular) { TripDayComplication(state: state, family: .rectangular) }
                dial(.inline) { NextStopComplication(state: state, family: .inline, now: now) }
                dial(.inline) { CountdownComplication(state: state, family: .inline, now: now) }
                dial(.inline) { TripDayComplication(state: state, family: .inline) }
            }
            .foregroundStyle(.white)
            .tint(Color(hex: 0xFF9F0A))
        }
    }

    private func dial<Content: View>(_ family: ComplicationFamily, @ViewBuilder _ content: () -> Content) -> some View {
        let size: CGSize = switch family {
        case .circular: CGSize(width: 50, height: 50)
        case .rectangular: CGSize(width: 170, height: 64)
        case .corner: CGSize(width: 40, height: 40)
        case .inline: CGSize(width: 170, height: 18)
        }
        return content()
            .frame(width: size.width, height: size.height)
            .clipped()
            .overlay(RoundedRectangle(cornerRadius: family == .circular ? 25 : 6).stroke(Color.white.opacity(0.08)))
    }
}
