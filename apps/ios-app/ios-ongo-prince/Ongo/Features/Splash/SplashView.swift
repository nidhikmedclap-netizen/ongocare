import SwiftUI

struct SplashView: View {
    @State private var scale: CGFloat = 0.7
    @State private var opacity: Double = 0

    var body: some View {
        ZStack {
            Color.ongoPrimary.ignoresSafeArea()

            VStack(spacing: OngoSpacing.sm) {
                // Logo mark
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.15))
                        .frame(width: 88, height: 88)
                    Image(systemName: "leaf.fill")
                        .font(.system(size: 40))
                        .foregroundStyle(.white)
                }

                Text("ongo")
                    .font(.system(size: 38, weight: .heavy, design: .default))
                    .tracking(-1.5)
                    .foregroundStyle(.white)

                Text("your weight, your way")
                    .font(OngoFont.caption())
                    .tracking(1.5)
                    .textCase(.uppercase)
                    .foregroundStyle(.white.opacity(0.7))
            }
            .scaleEffect(scale)
            .opacity(opacity)
        }
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.75)) {
                scale = 1.0
                opacity = 1.0
            }
        }
    }
}
