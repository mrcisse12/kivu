//
//  KivuComponents.swift
//  Composants réutilisables — boutons, cards, chips, inputs
//

import SwiftUI

// MARK: - Primary Button
struct KivuPrimaryButton: View {
    let title: String
    let icon: String?
    let action: () -> Void
    var isLoading: Bool = false
    var fullWidth: Bool = true
    var gradient: LinearGradient = KivuColors.heroGradient

    var body: some View {
        Button(action: action) {
            HStack(spacing: KivuSpacing.xs) {
                if isLoading {
                    ProgressView().tint(.white)
                } else {
                    if let icon { Image(systemName: icon) }
                    Text(title).font(KivuTypography.headlineMedium)
                }
            }
            .foregroundColor(.white)
            .padding(.vertical, KivuSpacing.md)
            .frame(maxWidth: fullWidth ? .infinity : nil)
            .padding(.horizontal, KivuSpacing.lg)
            .background(gradient)
            .cornerRadius(KivuRadius.round)
            .kivuSoftShadow()
        }
    }
}

// MARK: - Secondary Button
struct KivuSecondaryButton: View {
    let title: String
    let icon: String?
    let action: () -> Void
    var color: Color = KivuColors.primary

    var body: some View {
        Button(action: action) {
            HStack(spacing: KivuSpacing.xs) {
                if let icon { Image(systemName: icon) }
                Text(title).font(KivuTypography.headlineSmall)
            }
            .foregroundColor(color)
            .padding(.vertical, KivuSpacing.sm)
            .padding(.horizontal, KivuSpacing.lg)
            .frame(maxWidth: .infinity)
            .background(color.opacity(0.12))
            .cornerRadius(KivuRadius.round)
        }
    }
}

// MARK: - Icon Button
struct KivuIconButton: View {
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(color)
                .frame(width: 44, height: 44)
                .background(color.opacity(0.12))
                .clipShape(Circle())
        }
    }
}

// MARK: - Card
struct KivuCard<Content: View>: View {
    let content: () -> Content
    var padding: CGFloat = KivuSpacing.lg

    init(padding: CGFloat = KivuSpacing.lg, @ViewBuilder content: @escaping () -> Content) {
        self.padding = padding
        self.content = content
    }

    var body: some View {
        content()
            .padding(padding)
            .background(KivuColors.surface)
            .cornerRadius(KivuRadius.lg)
            .kivuSoftShadow()
    }
}

// MARK: - Section Header
struct KivuSectionHeader: View {
    let title: String
    var action: (() -> Void)? = nil
    var actionLabel: String = "Voir tout"

    var body: some View {
        HStack {
            Text(title)
                .font(KivuTypography.headlineLarge)
                .foregroundColor(KivuColors.primaryText)
            Spacer()
            if let action {
                Button(actionLabel, action: action)
                    .font(KivuTypography.labelMedium)
                    .foregroundColor(KivuColors.primary)
            }
        }
    }
}

// MARK: - Text Field
struct KivuTextField: View {
    let placeholder: String
    let icon: String
    @Binding var text: String
    var isSecure: Bool = false

    var body: some View {
        HStack(spacing: KivuSpacing.sm) {
            Image(systemName: icon)
                .foregroundColor(KivuColors.secondaryText)
                .frame(width: 20)
            if isSecure {
                SecureField(placeholder, text: $text)
            } else {
                TextField(placeholder, text: $text)
            }
        }
        .padding(KivuSpacing.md)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.md)
        .overlay(
            RoundedRectangle(cornerRadius: KivuRadius.md)
                .stroke(KivuColors.divider, lineWidth: 1)
        )
    }
}

// MARK: - Empty State
struct KivuEmptyState: View {
    let icon: String
    let title: String
    let message: String
    var action: (() -> Void)? = nil
    var actionTitle: String = "Essayer"

    var body: some View {
        VStack(spacing: KivuSpacing.md) {
            Image(systemName: icon)
                .font(.system(size: 44))
                .foregroundColor(KivuColors.tertiaryText)
            Text(title)
                .font(KivuTypography.headlineMedium)
                .foregroundColor(KivuColors.primaryText)
            Text(message)
                .font(KivuTypography.bodyMedium)
                .foregroundColor(KivuColors.secondaryText)
                .multilineTextAlignment(.center)
            if let action {
                KivuPrimaryButton(title: actionTitle, icon: nil, action: action, fullWidth: false)
            }
        }
        .padding(KivuSpacing.xl)
    }
}

// MARK: - Loading View
struct KivuLoadingView: View {
    var body: some View {
        VStack(spacing: KivuSpacing.md) {
            ProgressView().scaleEffect(1.3)
            Text("Chargement...")
                .font(KivuTypography.bodySmall)
                .foregroundColor(KivuColors.secondaryText)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(KivuColors.background)
    }
}

// MARK: - Tag / Chip
struct KivuTag: View {
    let text: String
    let color: Color
    var icon: String? = nil

    var body: some View {
        HStack(spacing: 4) {
            if let icon { Image(systemName: icon).font(.system(size: 10)) }
            Text(text).font(KivuTypography.labelSmall)
        }
        .foregroundColor(color)
        .padding(.horizontal, KivuSpacing.sm)
        .padding(.vertical, 4)
        .background(color.opacity(0.12))
        .cornerRadius(KivuRadius.round)
    }
}

// MARK: - Progress Ring
struct KivuProgressRing: View {
    let progress: Double
    let lineWidth: CGFloat
    let color: Color
    var size: CGFloat = 80

    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.15), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 0.8), value: progress)
        }
        .frame(width: size, height: size)
    }
}
