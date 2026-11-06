// swift-tools-version:5.9
import PackageDescription

// Renders the widget views (client/ios/App/TREKWidgets/*Content.swift and the
// files they use) to PNGs on a Mac, so a change to a widget can be looked at
// without a phone: .github/workflows/native.yml copies them into Sources/ and
// uploads what this writes. Not part of the app.
let package = Package(
    name: "WidgetPreviews",
    platforms: [.macOS(.v14)],
    targets: [
        .executableTarget(name: "WidgetPreviews", path: "Sources/WidgetPreviews"),
    ]
)
