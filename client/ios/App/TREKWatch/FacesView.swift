import SwiftUI

/// Screenshot mode only (-TrekDemo faces): every complication in every family
/// it ships in, at the sizes a watch face gives them on this watch, to review
/// them without setting up a face. Circular and corner ones three to a row,
/// rectangular and inline ones across the screen's width.
struct FacesView: View {
    let snapshot: WatchSnapshot?
    let now: Date
    /// A circular complication's diameter, from the screen: 42 pt on 40 mm, 50 on 49 mm.
    @State private var dial: CGFloat = 44

    var body: some View {
        let state = ComplicationState(snapshot, now: now)
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                caption("circular")
                HStack(spacing: 8) {
                    round { NextStopComplication(state: state, family: .circular, now: now) }
                    round { CountdownComplication(state: state, family: .circular, now: now) }
                    round { TripDayComplication(state: state, family: .circular) }
                }
                caption("corner")
                HStack(spacing: 8) {
                    round { NextStopComplication(state: state, family: .corner, now: now) }
                    round { CountdownComplication(state: state, family: .corner, now: now) }
                    round { TripDayComplication(state: state, family: .corner) }
                }
                caption("rectangular")
                wide(56) { NextStopComplication(state: state, family: .rectangular, now: now) }
                wide(56) { CountdownComplication(state: state, family: .rectangular, now: now) }
                wide(56) { TripDayComplication(state: state, family: .rectangular) }
                caption("inline")
                wide(18) { NextStopComplication(state: state, family: .inline, now: now) }
                wide(18) { CountdownComplication(state: state, family: .inline, now: now) }
                wide(18) { TripDayComplication(state: state, family: .inline) }
            }
            .foregroundStyle(.white)
            .tint(Color(hex: 0xFF9F0A))
            .frame(maxWidth: .infinity, alignment: .leading)
            .onGeometryChange(for: CGFloat.self, of: { $0.size.width }) { width in
                dial = min(50, max(38, (width - 16) / 3))
            }
        }
    }

    private func caption(_ text: String) -> some View {
        Text(text).watchEyebrow(WatchLook.faint)
    }

    private func round<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        content()
            .frame(width: dial, height: dial)
            .clipShape(Circle())
    }

    private func wide<Content: View>(_ height: CGFloat, @ViewBuilder _ content: () -> Content) -> some View {
        content()
            .frame(maxWidth: .infinity, minHeight: height, maxHeight: height, alignment: .leading)
            .padding(.horizontal, 6)
            .background(RoundedRectangle(cornerRadius: 8).fill(Color.white.opacity(0.06)))
            .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
