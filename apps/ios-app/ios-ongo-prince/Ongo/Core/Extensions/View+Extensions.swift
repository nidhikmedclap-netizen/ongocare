import SwiftUI

extension View {
    // MARK: - Conditional modifier
    @ViewBuilder
    func `if`<T: View>(_ condition: Bool, transform: (Self) -> T) -> some View {
        if condition { transform(self) } else { self }
    }

    // MARK: - Keyboard dismiss on tap
    func dismissKeyboardOnTap() -> some View {
        self.onTapGesture {
            UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder),
                                             to: nil, from: nil, for: nil)
        }
    }

    // MARK: - Standard page background
    func ongoBackground() -> some View {
        self.background(Color.ongoBackground.ignoresSafeArea())
    }

    // MARK: - Full-width padding
    func ongoHorizontalPadding() -> some View {
        self.padding(.horizontal, OngoSpacing.md)
    }

    // MARK: - Error banner modifier
    func errorBanner(message: Binding<String?>) -> some View {
        self.overlay(alignment: .top) {
            if let msg = message.wrappedValue {
                Text(msg)
                    .font(OngoFont.caption())
                    .foregroundStyle(.white)
                    .padding(.horizontal, OngoSpacing.md)
                    .padding(.vertical, OngoSpacing.xs)
                    .background(Color.ongoError)
                    .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
                    .padding(.top, OngoSpacing.sm)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                            withAnimation { message.wrappedValue = nil }
                        }
                    }
            }
        }
        .animation(.spring(response: 0.35), value: message.wrappedValue)
    }
}
