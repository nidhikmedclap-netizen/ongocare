//
//  BusinessesView.swift
//  TwilioCallApp
//
//  Master directory of all Twilio numbers / businesses. Tap any row
//  to drill into per-business config (greeting, hours, color, ringtone).
//

import SwiftUI

struct BusinessesView: View {
    @Environment(AppState.self) private var appState
    @State private var query: String = ""

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottomTrailing) {
                Theme.background.ignoresSafeArea()

                List {
                    ForEach(filtered) { biz in
                        NavigationLink(value: biz) {
                            BusinessRow(business: biz)
                        }
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
                .searchable(text: $query, prompt: "Search businesses or numbers")

                Button {
                    // Add a new business / number
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 56, height: 56)
                        .background(Theme.primaryGradient)
                        .clipShape(Circle())
                        .shadow(color: Color(red: 0.49, green: 0.23, blue: 0.93).opacity(0.6),
                                radius: 18, y: 12)
                }
                .padding(.trailing, 20)
                .padding(.bottom, 20)
            }
            .navigationTitle("Businesses")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    NavigationLink(value: SettingsRoute()) {
                        Image(systemName: "gearshape.fill")
                            .foregroundStyle(Theme.accentLavender)
                    }
                }
                ToolbarItem(placement: .topBarLeading) {
                    Text("\(appState.businesses.count) lines")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Theme.accentLavender)
                }
            }
            .navigationDestination(for: Business.self) { biz in
                BusinessDetailView(business: biz)
            }
            .navigationDestination(for: SettingsRoute.self) { _ in
                SettingsView()
            }
            .refreshable {
                await appState.syncTwilioPhoneNumbersFromAPI()
                await appState.refreshConversationsFromServer()
            }
        }
    }

    private var filtered: [Business] {
        guard !query.isEmpty else { return appState.businesses }
        return appState.businesses.filter {
            $0.name.localizedCaseInsensitiveContains(query) ||
            $0.twilioNumber.localizedCaseInsensitiveContains(query)
        }
    }
}

/// Marker route so SettingsView can be reached via a NavigationLink value.
struct SettingsRoute: Hashable {}

private struct BusinessRow: View {
    let business: Business

    var body: some View {
        HStack(spacing: 12) {
            Text(business.initials)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 44, height: 44)
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(LinearGradient(
                            colors: [business.tint.color, business.tint.color.opacity(0.7)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(business.name)
                    .font(.system(size: 14, weight: .semibold))
                Text(business.twilioNumber)
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.textFade)
                HStack(spacing: 10) {
                    HStack(spacing: 4) {
                        Image(systemName: "phone.fill").font(.system(size: 9))
                        Text("\(business.todayCallCount)").font(.system(size: 10, weight: .semibold))
                    }
                    HStack(spacing: 4) {
                        Image(systemName: "message.fill").font(.system(size: 9))
                        Text("\(business.todayMessageCount)").font(.system(size: 10, weight: .semibold))
                    }
                    HStack(spacing: 4) {
                        Circle()
                            .fill(business.isActive ? Color(red: 0.13, green: 0.77, blue: 0.37) : Color(red: 0.96, green: 0.62, blue: 0.04))
                            .frame(width: 6, height: 6)
                        Text(business.isActive ? "Active" : "After hours")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(business.isActive ? Color(red: 0.13, green: 0.77, blue: 0.37) : Color(red: 0.96, green: 0.62, blue: 0.04))
                    }
                }
                .foregroundStyle(Color.white.opacity(0.55))
                .padding(.top, 2)
            }
            Spacer()
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    BusinessesView()
        .environment(AppState.previewMock())
        .preferredColorScheme(.dark)
}
