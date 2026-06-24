import SwiftUI

// Matches prototype #callPage / #videoPage — in-call UI
// Full WebRTC/Agora integration is v2; this is the complete UI skeleton
struct CallView: View {
    let visit: Visit
    let isVideo: Bool
    @Environment(\.dismiss) private var dismiss

    @State private var isMuted: Bool = false
    @State private var isSpeakerOn: Bool = false
    @State private var isCameraOff: Bool = false
    @State private var callDuration: Int = 0  // seconds
    @State private var timer: Timer? = nil

    var body: some View {
        ZStack {
            // Background — dark for video, gradient for audio call
            if isVideo {
                Color.black.ignoresSafeArea()
                    .overlay(
                        // Remote video placeholder
                        VStack {
                            Image(systemName: "video.fill")
                                .font(.system(size: 64))
                                .foregroundStyle(.white.opacity(0.3))
                            Text("Connecting video…")
                                .font(OngoFont.body())
                                .foregroundStyle(.white.opacity(0.5))
                        }
                    )
            } else {
                LinearGradient(
                    colors: [Color.ongoGreenDark, Color(hex: "#0d2d1e")],
                    startPoint: .top, endPoint: .bottom
                )
                .ignoresSafeArea()
            }

            VStack {
                // Top info
                callHeader

                Spacer()

                // Local video preview (video only)
                if isVideo && !isCameraOff {
                    localVideoPreview
                }

                // Controls
                callControls

                // End call button
                endCallButton
                    .padding(.bottom, 48)
            }
        }
        .preferredColorScheme(.dark)
        .onAppear { startTimer() }
        .onDisappear { timer?.invalidate() }
    }

    // MARK: - Top header
    private var callHeader: some View {
        VStack(spacing: OngoSpacing.xs) {
            OngoAvatarView(
                initials: String(visit.doctorName.prefix(2)),
                size: 80,
                backgroundColor: .white.opacity(0.15)
            )
            .padding(.top, 60)

            Text(visit.doctorName)
                .font(OngoFont.headline(22))
                .foregroundStyle(.white)

            Text(callDurationFormatted)
                .font(OngoFont.subheadline().monospacedDigit())
                .foregroundStyle(.white.opacity(0.7))
        }
    }

    // MARK: - Local video pip
    private var localVideoPreview: some View {
        HStack {
            Spacer()
            RoundedRectangle(cornerRadius: OngoRadius.md)
                .fill(Color.white.opacity(0.1))
                .frame(width: 100, height: 140)
                .overlay(
                    Image(systemName: "person.fill")
                        .font(.system(size: 32))
                        .foregroundStyle(.white.opacity(0.5))
                )
                .padding(.trailing, OngoSpacing.md)
                .padding(.bottom, OngoSpacing.md)
        }
    }

    // MARK: - Controls row
    private var callControls: some View {
        HStack(spacing: OngoSpacing.xl) {
            // Mute
            callControlButton(
                icon: isMuted ? "mic.slash.fill" : "mic.fill",
                label: isMuted ? "Unmute" : "Mute",
                active: isMuted
            ) { isMuted.toggle() }

            // Speaker / Camera toggle
            if isVideo {
                callControlButton(
                    icon: isCameraOff ? "video.slash.fill" : "video.fill",
                    label: isCameraOff ? "Camera off" : "Camera on",
                    active: isCameraOff
                ) { isCameraOff.toggle() }
            } else {
                callControlButton(
                    icon: isSpeakerOn ? "speaker.wave.3.fill" : "speaker.fill",
                    label: isSpeakerOn ? "Speaker" : "Earpiece",
                    active: isSpeakerOn
                ) { isSpeakerOn.toggle() }
            }
        }
        .padding(.bottom, OngoSpacing.xl)
    }

    private func callControlButton(icon: String, label: String, active: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: OngoSpacing.xs) {
                ZStack {
                    Circle()
                        .fill(active ? Color.white : Color.white.opacity(0.15))
                        .frame(width: 60, height: 60)
                    Image(systemName: icon)
                        .font(.system(size: 22))
                        .foregroundStyle(active ? Color.ongoTextPrimary : .white)
                }
                Text(label)
                    .font(OngoFont.caption(11))
                    .foregroundStyle(.white.opacity(0.7))
            }
        }
    }

    // MARK: - End call
    private var endCallButton: some View {
        Button {
            timer?.invalidate()
            dismiss()
        } label: {
            ZStack {
                Circle()
                    .fill(Color.ongoError)
                    .frame(width: 72, height: 72)
                Image(systemName: "phone.down.fill")
                    .font(.system(size: 28))
                    .foregroundStyle(.white)
            }
        }
    }

    // MARK: - Timer
    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [self] _ in
            Task { @MainActor in
                callDuration += 1
            }
        }
    }

    private var callDurationFormatted: String {
        let m = callDuration / 60
        let s = callDuration % 60
        return String(format: "%02d:%02d", m, s)
    }
}
