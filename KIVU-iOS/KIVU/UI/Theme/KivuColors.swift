//
//  KivuColors.swift
//  Palette officielle KIVU - Inspirée des terres africaines, du Lac Kivu et du soleil tropical
//

import SwiftUI

enum KivuColors {
    // Primary — Inspirée du Lac Kivu (bleu profond) + Savane (orange chaleureux)
    static let primary = Color(red: 0.09, green: 0.40, blue: 0.65)      // Bleu Kivu profond
    static let primaryLight = Color(red: 0.20, green: 0.58, blue: 0.85)
    static let primaryDark = Color(red: 0.04, green: 0.25, blue: 0.45)

    // Accent — Soleil africain + Terre cuite
    static let accent = Color(red: 0.95, green: 0.58, blue: 0.18)       // Orange soleil
    static let accentLight = Color(red: 1.00, green: 0.72, blue: 0.35)
    static let accentDark = Color(red: 0.78, green: 0.42, blue: 0.08)

    // Secondary — Vert savane / Forêt tropicale
    static let secondary = Color(red: 0.18, green: 0.62, blue: 0.45)
    static let secondaryLight = Color(red: 0.35, green: 0.78, blue: 0.58)

    // Tertiary — Pourpre royal (héritage des rois africains)
    static let tertiary = Color(red: 0.55, green: 0.25, blue: 0.68)
    static let tertiaryLight = Color(red: 0.72, green: 0.42, blue: 0.85)

    // Neutrals
    static let background = Color(red: 0.98, green: 0.97, blue: 0.95)    // Ivoire doux
    static let surface = Color.white
    static let surfaceElevated = Color(red: 1.00, green: 0.99, blue: 0.97)
    static let primaryText = Color(red: 0.08, green: 0.12, blue: 0.20)
    static let secondaryText = Color(red: 0.40, green: 0.44, blue: 0.52)
    static let tertiaryText = Color(red: 0.60, green: 0.63, blue: 0.70)
    static let divider = Color(red: 0.88, green: 0.88, blue: 0.90)

    // States
    static let success = Color(red: 0.20, green: 0.70, blue: 0.40)
    static let warning = Color(red: 0.98, green: 0.70, blue: 0.20)
    static let error = Color(red: 0.92, green: 0.30, blue: 0.30)
    static let info = Color(red: 0.25, green: 0.55, blue: 0.90)

    // Gradients — Les signatures visuelles de KIVU
    static let heroGradient = LinearGradient(
        colors: [primary, primaryLight, accentLight.opacity(0.7)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let sunsetGradient = LinearGradient(
        colors: [accent, accentLight, Color(red: 0.98, green: 0.80, blue: 0.50)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let savannaGradient = LinearGradient(
        colors: [secondary, secondaryLight, accent.opacity(0.6)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let royalGradient = LinearGradient(
        colors: [tertiary, tertiaryLight, primary],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let kivuLakeGradient = LinearGradient(
        colors: [primaryDark, primary, Color(red: 0.30, green: 0.70, blue: 0.85)],
        startPoint: .top,
        endPoint: .bottom
    )

    static let cardGradient = LinearGradient(
        colors: [surface, surfaceElevated],
        startPoint: .top,
        endPoint: .bottom
    )

    // Category colors for the 8 features
    static let translationColor = primary
    static let learningColor = accent
    static let preservationColor = tertiary
    static let businessColor = secondary
    static let multiPartyColor = Color(red: 0.35, green: 0.50, blue: 0.92)
    static let assistantColor = Color(red: 0.90, green: 0.35, blue: 0.55)
    static let diasporaColor = Color(red: 0.25, green: 0.70, blue: 0.75)
    static let accessibilityColor = Color(red: 0.60, green: 0.45, blue: 0.30)
}

// MARK: - Typography
enum KivuTypography {
    static let displayLarge = Font.system(size: 40, weight: .bold, design: .rounded)
    static let displayMedium = Font.system(size: 32, weight: .bold, design: .rounded)
    static let displaySmall = Font.system(size: 26, weight: .bold, design: .rounded)

    static let headlineLarge = Font.system(size: 22, weight: .bold, design: .default)
    static let headlineMedium = Font.system(size: 18, weight: .semibold, design: .default)
    static let headlineSmall = Font.system(size: 16, weight: .semibold, design: .default)

    static let bodyLarge = Font.system(size: 17, weight: .regular, design: .default)
    static let bodyMedium = Font.system(size: 15, weight: .regular, design: .default)
    static let bodySmall = Font.system(size: 13, weight: .regular, design: .default)

    static let labelLarge = Font.system(size: 14, weight: .medium, design: .default)
    static let labelMedium = Font.system(size: 12, weight: .medium, design: .default)
    static let labelSmall = Font.system(size: 11, weight: .medium, design: .default)

    static let caption = Font.system(size: 11, weight: .regular, design: .default)
}

// MARK: - Spacing
enum KivuSpacing {
    static let xxs: CGFloat = 4
    static let xs: CGFloat = 8
    static let sm: CGFloat = 12
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
    static let xxl: CGFloat = 48
    static let xxxl: CGFloat = 64
}

// MARK: - Radius
enum KivuRadius {
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
    static let xxl: CGFloat = 32
    static let round: CGFloat = 999
}

// MARK: - Shadows
enum KivuShadow {
    static func soft() -> some View {
        Color.black.opacity(0.04)
    }
}

extension View {
    func kivuSoftShadow() -> some View {
        self.shadow(color: Color.black.opacity(0.06), radius: 10, x: 0, y: 4)
    }

    func kivuMediumShadow() -> some View {
        self.shadow(color: Color.black.opacity(0.10), radius: 16, x: 0, y: 8)
    }

    func kivuStrongShadow() -> some View {
        self.shadow(color: Color.black.opacity(0.15), radius: 24, x: 0, y: 12)
    }

    func kivuCardStyle() -> some View {
        self
            .background(KivuColors.surface)
            .cornerRadius(KivuRadius.lg)
            .kivuSoftShadow()
    }
}

final class ThemeManager: ObservableObject {
    @Published var colorScheme: ColorScheme? = nil
    @Published var useHighContrast: Bool = false
    @Published var textSizeMultiplier: Double = 1.0

    func toggleDarkMode() {
        switch colorScheme {
        case .none: colorScheme = .dark
        case .dark: colorScheme = .light
        case .light: colorScheme = nil
        case .some(_): colorScheme = nil
        }
    }
}
