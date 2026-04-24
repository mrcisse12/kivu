//
//  ProfileView.swift
//  Profil utilisateur, abonnement, réglages
//

import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authService: AuthService
    @State private var showSettings = false

    var body: some View {
        ZStack {
            KivuColors.background.ignoresSafeArea()
            ScrollView {
                VStack(spacing: KivuSpacing.lg) {
                    ProfileHeaderCard()
                        .padding(.horizontal, KivuSpacing.lg)
                    ProfileStatsGrid()
                        .padding(.horizontal, KivuSpacing.lg)
                    SubscriptionCard()
                        .padding(.horizontal, KivuSpacing.lg)
                    MyLanguagesCard()
                        .padding(.horizontal, KivuSpacing.lg)
                    SettingsMenu()
                        .padding(.horizontal, KivuSpacing.lg)
                    Color.clear.frame(height: 100)
                }
                .padding(.top, KivuSpacing.lg)
            }
        }
    }
}

struct ProfileHeaderCard: View {
    var body: some View {
        VStack(spacing: KivuSpacing.md) {
            ZStack {
                Circle()
                    .fill(KivuColors.heroGradient)
                    .frame(width: 108, height: 108)
                Text("🧑🏾")
                    .font(.system(size: 60))
                    .frame(width: 96, height: 96)
                    .background(KivuColors.surface)
                    .clipShape(Circle())
                Image(systemName: "checkmark.seal.fill")
                    .foregroundColor(KivuColors.primary)
                    .background(Circle().fill(KivuColors.surface).frame(width: 24, height: 24))
                    .offset(x: 36, y: 36)
            }

            VStack(spacing: 4) {
                Text("Amadou Diallo")
                    .font(KivuTypography.displaySmall)
                    .foregroundColor(KivuColors.primaryText)
                Text("🇨🇮 Abidjan · Polyglotte KIVU")
                    .font(KivuTypography.bodySmall)
                    .foregroundColor(KivuColors.secondaryText)
            }

            HStack(spacing: KivuSpacing.md) {
                Button {} label: {
                    Label("Modifier", systemImage: "pencil")
                        .font(KivuTypography.labelLarge)
                        .foregroundColor(KivuColors.primary)
                        .padding(.horizontal, KivuSpacing.md)
                        .padding(.vertical, KivuSpacing.xs)
                        .background(KivuColors.primary.opacity(0.12))
                        .cornerRadius(KivuRadius.round)
                }
                Button {} label: {
                    Label("Partager", systemImage: "square.and.arrow.up")
                        .font(KivuTypography.labelLarge)
                        .foregroundColor(KivuColors.secondaryText)
                        .padding(.horizontal, KivuSpacing.md)
                        .padding(.vertical, KivuSpacing.xs)
                        .background(KivuColors.surface)
                        .cornerRadius(KivuRadius.round)
                }
            }
        }
        .padding(KivuSpacing.lg)
        .frame(maxWidth: .infinity)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.xl)
        .kivuSoftShadow()
    }
}

struct ProfileStatsGrid: View {
    var body: some View {
        LazyVGrid(columns: [
            GridItem(.flexible(), spacing: KivuSpacing.sm),
            GridItem(.flexible(), spacing: KivuSpacing.sm),
            GridItem(.flexible(), spacing: KivuSpacing.sm)
        ], spacing: KivuSpacing.sm) {
            StatCard(value: "12", label: "Jours", icon: "flame.fill", color: KivuColors.error)
            StatCard(value: "8", label: "Langues", icon: "globe", color: KivuColors.primary)
            StatCard(value: "2 340", label: "XP", icon: "star.fill", color: KivuColors.accent)
            StatCard(value: "47", label: "Badges", icon: "medal.fill", color: KivuColors.secondary)
            StatCard(value: "127", label: "Contribs", icon: "heart.fill", color: KivuColors.tertiary)
            StatCard(value: "#42", label: "Rang", icon: "chart.bar.fill", color: KivuColors.info)
        }
    }
}

struct StatCard: View {
    let value: String
    let label: String
    let icon: String
    let color: Color
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon).foregroundColor(color).font(.system(size: 18))
            Text(value).font(KivuTypography.headlineMedium).foregroundColor(KivuColors.primaryText)
            Text(label).font(KivuTypography.labelSmall).foregroundColor(KivuColors.secondaryText)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, KivuSpacing.sm)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.md)
        .kivuSoftShadow()
    }
}

struct SubscriptionCard: View {
    var body: some View {
        ZStack {
            KivuColors.sunsetGradient.cornerRadius(KivuRadius.xl)
            VStack(alignment: .leading, spacing: KivuSpacing.sm) {
                HStack {
                    Label("KIVU PRO", systemImage: "crown.fill")
                        .font(KivuTypography.labelLarge)
                        .foregroundColor(.white)
                        .padding(.horizontal, KivuSpacing.sm)
                        .padding(.vertical, 4)
                        .background(.ultraThinMaterial)
                        .cornerRadius(KivuRadius.round)
                    Spacer()
                    Text("30 jours restants")
                        .font(KivuTypography.labelSmall)
                        .foregroundColor(.white.opacity(0.9))
                }

                Text("Accès illimité, offline, 8 fonctionnalités")
                    .font(KivuTypography.headlineMedium)
                    .foregroundColor(.white)

                HStack {
                    Text("5 000 FCFA / mois")
                        .font(KivuTypography.bodySmall)
                        .foregroundColor(.white.opacity(0.9))
                    Spacer()
                    Button("Gérer") {}
                        .font(KivuTypography.labelMedium)
                        .foregroundColor(KivuColors.accent)
                        .padding(.horizontal, KivuSpacing.md)
                        .padding(.vertical, KivuSpacing.xs)
                        .background(Color.white)
                        .cornerRadius(KivuRadius.round)
                }
            }
            .padding(KivuSpacing.lg)
        }
        .kivuSoftShadow()
    }
}

struct MyLanguagesCard: View {
    let languages: [Language] = [.french, .dioula, .bambara, .swahili, .wolof]

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            HStack {
                Label("Mes langues", systemImage: "globe.europe.africa.fill")
                    .font(KivuTypography.headlineLarge)
                    .foregroundColor(KivuColors.primaryText)
                Spacer()
                Button {} label: {
                    Image(systemName: "plus.circle.fill")
                        .foregroundColor(KivuColors.primary)
                        .font(.system(size: 24))
                }
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: KivuSpacing.xs) {
                    ForEach(languages) { lang in
                        VStack(spacing: 4) {
                            Text(lang.flag).font(.system(size: 32))
                            Text(lang.name)
                                .font(KivuTypography.labelMedium)
                                .foregroundColor(KivuColors.primaryText)
                        }
                        .padding(.horizontal, KivuSpacing.md)
                        .padding(.vertical, KivuSpacing.sm)
                        .background(KivuColors.background)
                        .cornerRadius(KivuRadius.md)
                    }
                }
            }
        }
        .padding(KivuSpacing.lg)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.xl)
        .kivuSoftShadow()
    }
}

struct SettingsMenu: View {
    let items: [(String, String, Color)] = [
        ("Notifications", "bell.fill", KivuColors.primary),
        ("Confidentialité & sécurité", "lock.shield.fill", KivuColors.success),
        ("Accessibilité", "figure.wave", KivuColors.accessibilityColor),
        ("Langue de l'app", "globe", KivuColors.accent),
        ("Stockage & hors-ligne", "externaldrive.fill", KivuColors.tertiary),
        ("Aide & support", "questionmark.circle.fill", KivuColors.info),
        ("À propos de KIVU", "info.circle.fill", KivuColors.secondary)
    ]
    var body: some View {
        VStack(spacing: KivuSpacing.xs) {
            ForEach(items, id: \.0) { item in
                Button {} label: {
                    HStack {
                        Image(systemName: item.1)
                            .foregroundColor(item.2)
                            .frame(width: 44, height: 44)
                            .background(item.2.opacity(0.12))
                            .clipShape(Circle())
                        Text(item.0)
                            .font(KivuTypography.bodyMedium)
                            .foregroundColor(KivuColors.primaryText)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundColor(KivuColors.tertiaryText)
                    }
                    .padding(KivuSpacing.md)
                    .background(KivuColors.surface)
                    .cornerRadius(KivuRadius.md)
                }
                .buttonStyle(.plain)
            }
        }
    }
}
