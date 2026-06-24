import SwiftUI

// Matches prototype #aboutPage — static about / legal / contact page
struct AboutView: View {
    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: OngoSpacing.md) {
                // Hero
                OngoCard(cornerRadius: OngoRadius.lg) {
                    VStack(spacing: OngoSpacing.md) {
                        Text("O")
                            .font(.system(size: 64, weight: .black))
                            .foregroundStyle(Color.ongoPrimary)
                        Text("Sustainable weight loss, made simple.")
                            .font(OngoFont.headline(20))
                            .multilineTextAlignment(.center)
                        Text("GLP-1 medications backed by real human doctors. No gimmicks, no hidden fees, no judgment.")
                            .font(OngoFont.body())
                            .foregroundStyle(Color.ongoTextSecondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, OngoSpacing.md)
                }

                // Stats row
                HStack(spacing: OngoSpacing.sm) {
                    statCard(value: "50K+", label: "Members")
                    statCard(value: "4.8★", label: "Avg Rating")
                    statCard(value: "12.4 lb", label: "Avg Loss/3mo")
                }

                // Mission
                OngoCard {
                    VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                        Text("Our mission")
                            .font(OngoFont.subheadline())
                        Text("We believe effective weight care should be accessible to everyone. Ongo connects patients with board-certified physicians who specialize in GLP-1 therapy — through a fully digital, stigma-free platform.")
                            .font(OngoFont.body())
                            .foregroundStyle(Color.ongoTextSecondary)
                    }
                }

                // Legal & resources
                OngoCard {
                    VStack(spacing: 0) {
                        linkRow(icon: "doc.text", title: "Terms of Service")
                        Divider()
                        linkRow(icon: "hand.raised", title: "Privacy Policy")
                        Divider()
                        linkRow(icon: "cross.circle", title: "HIPAA Notice")
                        Divider()
                        linkRow(icon: "building.columns", title: "Medical Licenses")
                        Divider()
                        linkRow(icon: "newspaper", title: "Press & Media")
                    }
                }

                // Contact
                OngoCard {
                    VStack(spacing: 0) {
                        linkRow(icon: "envelope.fill", title: "support@ongo.health")
                        Divider()
                        linkRow(icon: "camera.fill", title: "@ongo.health")
                    }
                }

                // Footer
                VStack(spacing: 4) {
                    Text("Ongo Health, Inc. · v1.0.0")
                        .font(OngoFont.caption(11))
                        .foregroundStyle(Color.ongoTextTertiary)
                    Text("© 2026 All rights reserved")
                        .font(OngoFont.caption(11))
                        .foregroundStyle(Color.ongoTextTertiary)
                }
                .frame(maxWidth: .infinity)
            }
            .padding(.horizontal, OngoSpacing.md)
            .padding(.vertical, OngoSpacing.md)
            .padding(.bottom, 100)
        }
        .background(Color.ongoBackground)
        .navigationTitle("About Ongo")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func statCard(value: String, label: String) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(size: 20, weight: .bold)).foregroundStyle(Color.ongoPrimary)
            Text(label).font(OngoFont.caption(11)).foregroundStyle(Color.ongoTextSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(OngoSpacing.sm)
        .background(Color.ongoCard)
        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
        .ongoCardShadow()
    }

    private func linkRow(icon: String, title: String) -> some View {
        Button {} label: {
            HStack(spacing: OngoSpacing.sm) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundStyle(Color.ongoPrimary)
                    .frame(width: 24)
                Text(title)
                    .font(OngoFont.body())
                    .foregroundStyle(Color.ongoTextPrimary)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.ongoTextTertiary)
            }
            .padding(.vertical, OngoSpacing.sm)
        }
    }
}
