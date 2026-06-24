import SwiftUI

// MARK: - Primary CTA Button (.sv-cta / .booking-cta pattern)
struct OngoPrimaryButton: View {
    let title: String
    var isLoading: Bool = false
    var isDisabled: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: OngoSpacing.xs) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(.white)
                        .scaleEffect(0.85)
                } else {
                    Text(title)
                        .font(OngoFont.subheadline(17))
                    Image(systemName: "arrow.right")
                        .font(.system(size: 15, weight: .bold))
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(isDisabled ? Color.ongoGreenMuted : Color.ongoPrimary)
            .foregroundStyle(isDisabled ? Color.ongoPrimary.opacity(0.4) : Color.white)
            .clipShape(RoundedRectangle(cornerRadius: OngoRadius.xl))
        }
        .disabled(isDisabled || isLoading)
        .animation(.easeInOut(duration: 0.15), value: isDisabled)
    }
}

// MARK: - Secondary / Ghost Button
struct OngoSecondaryButton: View {
    let title: String
    var isLoading: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(OngoFont.subheadline(16))
                .frame(maxWidth: .infinity)
                .frame(height: 52)
                .overlay(
                    RoundedRectangle(cornerRadius: OngoRadius.xl)
                        .stroke(Color.ongoBorder, lineWidth: 1.5)
                )
                .foregroundStyle(Color.ongoTextPrimary)
        }
        .disabled(isLoading)
    }
}

// MARK: - Tag / Pill Button (survey option)
struct OngoOptionPill: View {
    let title: String
    var subtitle: String? = nil
    var isSelected: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: OngoSpacing.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(OngoFont.subheadline(15))
                        .foregroundStyle(isSelected ? Color.ongoPrimary : Color.ongoTextPrimary)
                    if let subtitle {
                        Text(subtitle)
                            .font(OngoFont.caption())
                            .foregroundStyle(Color.ongoTextSecondary)
                    }
                }
                Spacer()
                ZStack {
                    Circle()
                        .stroke(isSelected ? Color.ongoPrimary : Color.ongoBorder, lineWidth: 2)
                        .frame(width: 22, height: 22)
                    if isSelected {
                        Circle()
                            .fill(Color.ongoPrimary)
                            .frame(width: 12, height: 12)
                    }
                }
            }
            .padding(.horizontal, OngoSpacing.md)
            .padding(.vertical, OngoSpacing.sm)
            .background(isSelected ? Color.ongoGreenMuted : Color.ongoCard)
            .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
            .overlay(
                RoundedRectangle(cornerRadius: OngoRadius.md)
                    .stroke(isSelected ? Color.ongoPrimary : Color.ongoBorder, lineWidth: 1.5)
            )
        }
        .animation(.easeInOut(duration: 0.12), value: isSelected)
    }
}

// MARK: - Checkbox Pill (multi-select survey option)
struct OngoCheckboxPill: View {
    let title: String
    var isSelected: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: OngoSpacing.sm) {
                ZStack {
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(isSelected ? Color.ongoPrimary : Color.ongoBorder, lineWidth: 2)
                        .frame(width: 22, height: 22)
                    if isSelected {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.ongoPrimary)
                            .frame(width: 22, height: 22)
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
                Text(title)
                    .font(OngoFont.subheadline(15))
                    .foregroundStyle(isSelected ? Color.ongoPrimary : Color.ongoTextPrimary)
                Spacer()
            }
            .padding(.horizontal, OngoSpacing.md)
            .padding(.vertical, OngoSpacing.sm)
            .background(isSelected ? Color.ongoGreenMuted : Color.ongoCard)
            .clipShape(RoundedRectangle(cornerRadius: OngoRadius.md))
            .overlay(
                RoundedRectangle(cornerRadius: OngoRadius.md)
                    .stroke(isSelected ? Color.ongoPrimary : Color.ongoBorder, lineWidth: 1.5)
            )
        }
        .animation(.easeInOut(duration: 0.12), value: isSelected)
    }
}
