import UIKit
import SwiftUI
import ComposeApp

/// Hosts the shared Compose UI. A frosted `UIVisualEffectView` sits behind the
/// Compose canvas so the chrome reads as genuine Liquid Glass on device; the
/// shared `GlassSurface` actual paints the tints/stroke on top.
struct ComposeView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> UIViewController {
        MainViewControllerKt.MainViewController()
    }
    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}

struct GlassBackdrop: UIViewRepresentable {
    func makeUIView(context: Context) -> UIView {
        let effect: UIBlurEffect
        if #available(iOS 13.0, *) {
            effect = UIBlurEffect(style: .systemUltraThinMaterialDark)
        } else {
            effect = UIBlurEffect(style: .dark)
        }
        return UIVisualEffectView(effect: effect)
    }
    func updateUIView(_ uiView: UIView, context: Context) {}
}

struct ContentView: View {
    var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.03, blue: 0.08).ignoresSafeArea()
            ComposeView().ignoresSafeArea()
        }
    }
}
