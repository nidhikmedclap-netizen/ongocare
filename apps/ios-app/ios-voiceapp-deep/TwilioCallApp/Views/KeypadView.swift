//
//  KeypadView.swift
//  TwilioCallApp
//
//  Dialer with a "Calling from" business selector pinned above the pad
//  so caller-ID identity is never ambiguous on outbound calls.
//

import SwiftUI

struct KeypadView: View {
    @Environment(AppState.self) private var appState
    @State private var showingBusinessPicker = false

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            VStack(spacing: 14) {
                display
                    .padding(.top, 12)

                HStack(spacing: 10) {
                    Button {
                        appState.prependUSCountryCode()
                    } label: {
                        Text("+1")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(
                                Capsule()
                                    .fill(Color.white.opacity(0.12))
                                    .overlay(Capsule().strokeBorder(Color.white.opacity(0.18), lineWidth: 1))
                            )
                    }
                    .buttonStyle(.plain)
                    Button {
                        if !appState.dialedNumber.hasPrefix("+") {
                            appState.appendDigit("+")
                        }
                    } label: {
                        Text("+ intl")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Theme.textFade)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(
                                Capsule()
                                    .fill(Color.white.opacity(0.08))
                                    .overlay(Capsule().strokeBorder(Color.white.opacity(0.12), lineWidth: 1))
                            )
                    }
                    .buttonStyle(.plain)
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 20)

                businessSelector
                    .padding(.horizontal, 20)

                keypad
                    .padding(.horizontal, 28)

                actionRow
                    .padding(.bottom, 18)
            }
        }
        .sheet(isPresented: $showingBusinessPicker) {
            BusinessPicker(selectedId: Binding(
                get: { appState.outboundBusinessId },
                set: { appState.outboundBusinessId = $0 }
            ))
                .presentationDetents([.medium, .large])
        }
    }

    private var display: some View {
        VStack(spacing: 4) {
            Text(appState.dialedNumber.isEmpty ? " " : appState.dialedNumber)
                .font(.system(size: 30, weight: .light))
                .lineLimit(1)
                .minimumScaleFactor(0.6)
                .foregroundStyle(.white)
            Text(detectCountry())
                .font(.system(size: 12))
                .foregroundStyle(Theme.textFade)
        }
        .frame(height: 56)
        .padding(.top, 4)
    }

    private var businessSelector: some View {
        Button {
            showingBusinessPicker = true
        } label: {
            HStack(spacing: 10) {
                Circle()
                    .fill(appState.outboundBusiness?.tint.color ?? Theme.accentLavender)
                    .frame(width: 8, height: 8)
                    .shadow(color: appState.outboundBusiness?.tint.color ?? .clear,
                            radius: 6)
                VStack(alignment: .leading, spacing: 1) {
                    Text("CALLING FROM")
                        .font(.system(size: 9, weight: .semibold))
                        .tracking(0.8)
                        .foregroundStyle(Theme.textFade)
                    Text(appState.outboundBusiness?.name ?? "—")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white)
                }
                Spacer()
                Text(appState.outboundBusiness?.twilioNumber ?? "")
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.textDim)
                Image(systemName: "chevron.down")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(Theme.textFade)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .glassCard(corner: 14)
        }
        .buttonStyle(.plain)
    }

    private var keypad: some View {
        let rows: [[KeyDef]] = [
            [.init("1", ""), .init("2", "ABC"), .init("3", "DEF")],
            [.init("4", "GHI"), .init("5", "JKL"), .init("6", "MNO")],
            [.init("7", "PQRS"), .init("8", "TUV"), .init("9", "WXYZ")],
            [.init("✱", ""), .init("0", "+"), .init("#", "")]
        ]
        return VStack(spacing: 14) {
            ForEach(0..<rows.count, id: \.self) { i in
                HStack(spacing: 18) {
                    ForEach(0..<rows[i].count, id: \.self) { j in
                        let key = rows[i][j]
                        KeypadButton(key: key) {
                            appState.appendDigit(key.digit == "✱" ? "*" : key.digit)
                        }
                    }
                }
            }
        }
    }

    private var actionRow: some View {
        HStack(spacing: 30) {
            Color.clear.frame(width: 40, height: 40)

            Button {
                if !appState.dialedNumber.isEmpty {
                    appState.startOutboundCall()
                }
            } label: {
                Image(systemName: "phone.fill")
                    .font(.system(size: 26))
                    .foregroundStyle(.white)
                    .frame(width: 64, height: 64)
                    .background(Theme.answerGradient)
                    .clipShape(Circle())
                    .shadow(color: Color(red: 0.13, green: 0.77, blue: 0.37).opacity(0.5),
                            radius: 16, y: 10)
            }
            .buttonStyle(.plain)

            Button {
                appState.deleteLastDigit()
            } label: {
                Image(systemName: "delete.left")
                    .font(.system(size: 22))
                    .foregroundStyle(Theme.textFade)
                    .frame(width: 40, height: 40)
            }
            .buttonStyle(.plain)
            .opacity(appState.dialedNumber.isEmpty ? 0 : 1)
        }
    }

    private func detectCountry() -> String {
        let trimmed = appState.dialedNumber.trimmingCharacters(in: .whitespaces)
        if trimmed.hasPrefix("+1") {
            return "United States · E.164"
        }
        let digits = trimmed.filter { $0.isNumber }
        if digits.count == 10, !trimmed.hasPrefix("+") {
            return "United States · will dial as +1…"
        }
        if trimmed.hasPrefix("+") {
            return "International"
        }
        return ""
    }
}

private struct KeyDef: Hashable {
    let digit: String
    let letters: String
    init(_ d: String, _ l: String) { digit = d; letters = l }
}

private struct KeypadButton: View {
    let key: KeyDef
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 2) {
                Text(key.digit)
                    .font(.system(size: 26, weight: .regular))
                Text(key.letters)
                    .font(.system(size: 9, weight: .semibold))
                    .tracking(2)
                    .foregroundStyle(Theme.textDim)
                    .opacity(key.letters.isEmpty ? 0 : 1)
            }
            .foregroundStyle(.white)
            .frame(width: 64, height: 60)
            .glassCircle()
        }
        .buttonStyle(.plain)
    }
}

private struct BusinessPicker: View {
    @Binding var selectedId: UUID?
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                ForEach(appState.businesses) { biz in
                    Button {
                        selectedId = biz.id
                        dismiss()
                    } label: {
                        HStack(spacing: 12) {
                            Circle().fill(biz.tint.color).frame(width: 12, height: 12)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(biz.name).font(.system(size: 15, weight: .semibold))
                                Text(biz.twilioNumber).font(.system(size: 12)).foregroundStyle(.secondary)
                            }
                            Spacer()
                            if biz.id == selectedId {
                                Image(systemName: "checkmark")
                                    .foregroundStyle(Theme.accentLavender)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Calling From")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview {
    KeypadView()
        .environment(AppState.previewMock())
        .preferredColorScheme(.dark)
}
