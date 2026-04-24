//
//  AccessibilityView.swift
//  Accessibilité & Inclusion — Feature #8
//

import SwiftUI

struct AccessibilityView: View {
    @EnvironmentObject var themeManager: ThemeManager
    @State private var textSize: Double = 1.0
    @State private var highContrast: Bool = false
    @State private var voiceControl: Bool = true
    @State private var signLanguage: Bool = false
    @State private var audioDescription: Bool = false

    var body: some View {
        ZStack {
            KivuColors.background.ignoresSafeArea()
            ScrollView {
                VStack(spacing: KivuSpacing.lg) {
                    FeaturePageHeader(
                        title: "Accessibilité",
                        subtitle: "KIVU pour tous, sans exception",
                        icon: "figure.wave",
                        color: KivuColors.accessibilityColor
                    )

                    InclusionStatsCard().padding(.horizontal, KivuSpacing.lg)

                    AccessibilityGroupCard(title: "Vision", icon: "eye.fill") {
                        AccessibilityToggleRow(label: "Contraste élevé", icon: "circle.lefthalf.filled", isOn: $highContrast)
                        AccessibilityToggleRow(label: "Description audio", icon: "speaker.wave.3.fill", isOn: $audioDescription)
                        AccessibilitySliderRow(label: "Taille du texte", icon: "textformat.size", value: $textSize)
                    }
                    .padding(.horizontal, KivuSpacing.lg)

                    AccessibilityGroupCard(title: "Audition", icon: "ear.fill") {
                        AccessibilityToggleRow(label: "Sous-titres automatiques", icon: "captions.bubble.fill", isOn: .constant(true))
                        AccessibilityToggleRow(label: "Langue des signes", icon: "hand.raised.fill", isOn: $signLanguage)
                        AccessibilityToggleRow(label: "Transcription directe", icon: "text.bubble.fill", isOn: .constant(true))
                    }
                    .padding(.horizontal, KivuSpacing.lg)

                    AccessibilityGroupCard(title: "Mobilité", icon: "figure.roll") {
                        AccessibilityToggleRow(label: "Contrôle vocal", icon: "mic.fill", isOn: $voiceControl)
                        AccessibilityToggleRow(label: "Actions simplifiées", icon: "hand.tap.fill", isOn: .constant(false))
                        AccessibilityToggleRow(label: "Navigation 1 main", icon: "hand.point.up.left.fill", isOn: .constant(false))
                    }
                    .padding(.horizontal, KivuSpacing.lg)

                    AccessibilityGroupCard(title: "Connectivité", icon: "antenna.radiowaves.left.and.right") {
                        AccessibilityToggleRow(label: "Mode 2G/3G", icon: "network", isOn: .constant(true))
                        AccessibilityToggleRow(label: "Mode hors-ligne", icon: "wifi.slash", isOn: .constant(true))
                        AccessibilityToggleRow(label: "Économie données", icon: "speedometer", isOn: .constant(true))
                    }
                    .padding(.horizontal, KivuSpacing.lg)

                    Color.clear.frame(height: 100)
                }
                .padding(.top, KivuSpacing.md)
            }
        }
    }
}

struct InclusionStatsCard: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [KivuColors.accessibilityColor, Color(red: 0.75, green: 0.55, blue: 0.35)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            ).cornerRadius(KivuRadius.xl)

            VStack(alignment: .leading, spacing: KivuSpacing.md) {
                Label("Inclusion universelle", systemImage: "globe.badge.chevron.backward")
                    .font(KivuTypography.labelLarge)
                    .foregroundColor(.white)

                Text("KIVU = 100% accessible")
                    .font(KivuTypography.headlineLarge)
                    .foregroundColor(.white)

                HStack(spacing: KivuSpacing.md) {
                    HeroStat(value: "1.3B", label: "Handicaps")
                    HeroStat(value: "540M", label: "Malvoyants")
                    HeroStat(value: "430M", label: "Sourds")
                }
            }
            .padding(KivuSpacing.lg)
        }
        .kivuSoftShadow()
    }
}

struct AccessibilityGroupCard<Content: View>: View {
    let title: String
    let icon: String
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            HStack(spacing: KivuSpacing.sm) {
                Image(systemName: icon)
                    .foregroundColor(KivuColors.accessibilityColor)
                    .font(.system(size: 20))
                Text(title)
                    .font(KivuTypography.headlineLarge)
                    .foregroundColor(KivuColors.primaryText)
            }
            VStack(spacing: KivuSpacing.xs) {
                content()
            }
        }
        .padding(KivuSpacing.lg)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.xl)
        .kivuSoftShadow()
    }
}

struct AccessibilityToggleRow: View {
    let label: String
    let icon: String
    @Binding var isOn: Bool
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(KivuColors.accessibilityColor)
                .frame(width: 28)
            Text(label)
                .font(KivuTypography.bodyMedium)
                .foregroundColor(KivuColors.primaryText)
            Spacer()
            Toggle("", isOn: $isOn)
                .tint(KivuColors.accessibilityColor)
                .labelsHidden()
        }
        .padding(.vertical, KivuSpacing.xs)
    }
}

struct AccessibilitySliderRow: View {
    let label: String
    let icon: String
    @Binding var value: Double
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(KivuColors.accessibilityColor)
                    .frame(width: 28)
                Text(label)
                    .font(KivuTypography.bodyMedium)
                    .foregroundColor(KivuColors.primaryText)
                Spacer()
                Text(String(format: "%.1fx", value))
                    .font(KivuTypography.labelMedium)
                    .foregroundColor(KivuColors.secondaryText)
            }
            Slider(value: $value, in: 0.75...2.0, step: 0.25)
                .tint(KivuColors.accessibilityColor)
        }
        .padding(.vertical, KivuSpacing.xs)
    }
}
