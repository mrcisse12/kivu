//
//  HomeView.swift
//  Écran d'accueil premium — Hub central des 8 fonctionnalités
//

import SwiftUI

struct HomeView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var authService: AuthService
    @State private var greeting: String = "Bonjour"
    @State private var showNotifications = false

    var body: some View {
        ScrollView {
            VStack(spacing: KivuSpacing.lg) {
                HomeHeaderView(greeting: greeting, showNotifications: $showNotifications)
                    .padding(.horizontal, KivuSpacing.lg)

                HeroStatsCard()
                    .padding(.horizontal, KivuSpacing.lg)

                FeaturedActionCard()
                    .padding(.horizontal, KivuSpacing.lg)

                FeaturesGridSection()
                    .padding(.horizontal, KivuSpacing.lg)

                ImpactCounterSection()
                    .padding(.horizontal, KivuSpacing.lg)

                DailyChallengeCard()
                    .padding(.horizontal, KivuSpacing.lg)

                EndangeredLanguagesSection()

                CommunityHighlightsSection()
                    .padding(.horizontal, KivuSpacing.lg)

                Color.clear.frame(height: 100) // Espace pour tabbar
            }
            .padding(.top, KivuSpacing.md)
        }
        .background(KivuColors.background.ignoresSafeArea())
        .onAppear { computeGreeting() }
    }

    private func computeGreeting() {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12: greeting = "Bonjour"
        case 12..<18: greeting = "Bon après-midi"
        default: greeting = "Bonsoir"
        }
    }
}

// MARK: - Header
struct HomeHeaderView: View {
    let greeting: String
    @Binding var showNotifications: Bool

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(greeting + " ✨")
                    .font(KivuTypography.bodyMedium)
                    .foregroundColor(KivuColors.secondaryText)
                Text("Amadou")
                    .font(KivuTypography.displaySmall)
                    .foregroundColor(KivuColors.primaryText)
            }
            Spacer()
            Button(action: { showNotifications.toggle() }) {
                ZStack {
                    Circle()
                        .fill(KivuColors.surface)
                        .frame(width: 48, height: 48)
                        .kivuSoftShadow()
                    Image(systemName: "bell.fill")
                        .font(.system(size: 18))
                        .foregroundColor(KivuColors.primary)
                    Circle()
                        .fill(KivuColors.error)
                        .frame(width: 10, height: 10)
                        .offset(x: 10, y: -10)
                }
            }
        }
    }
}

// MARK: - Hero Stats Card
struct HeroStatsCard: View {
    var body: some View {
        ZStack {
            KivuColors.heroGradient
                .cornerRadius(KivuRadius.xl)

            // Motif décoratif
            GeometryReader { _ in
                ForEach(0..<6) { i in
                    Circle()
                        .stroke(Color.white.opacity(0.15), lineWidth: 1)
                        .frame(width: CGFloat(40 + i * 35))
                        .offset(x: 140, y: -20)
                }
            }
            .clipped()
            .cornerRadius(KivuRadius.xl)

            VStack(alignment: .leading, spacing: KivuSpacing.md) {
                HStack {
                    Image(systemName: "flame.fill")
                        .foregroundColor(KivuColors.accentLight)
                    Text("Série de 12 jours")
                        .font(KivuTypography.labelLarge)
                        .foregroundColor(.white.opacity(0.9))
                    Spacer()
                }

                HStack(spacing: KivuSpacing.lg) {
                    StatBlock(value: "2 340", label: "XP", icon: "star.fill")
                    StatBlock(value: "8", label: "Niveaux", icon: "chart.bar.fill")
                    StatBlock(value: "47", label: "Mots", icon: "text.word.spacing")
                }

                ProgressView(value: 0.65)
                    .tint(.white)
                    .scaleEffect(x: 1, y: 2, anchor: .center)

                HStack {
                    Text("Niveau 8 — Maître Conversationnel")
                        .font(KivuTypography.labelMedium)
                        .foregroundColor(.white)
                    Spacer()
                    Text("65%")
                        .font(KivuTypography.labelMedium)
                        .foregroundColor(.white)
                }
            }
            .padding(KivuSpacing.lg)
        }
        .frame(height: 200)
        .kivuMediumShadow()
    }
}

struct StatBlock: View {
    let value: String
    let label: String
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 12))
                Text(value)
                    .font(KivuTypography.headlineMedium)
            }
            .foregroundColor(.white)
            Text(label)
                .font(KivuTypography.labelSmall)
                .foregroundColor(.white.opacity(0.8))
        }
    }
}

// MARK: - Featured Action Card
struct FeaturedActionCard: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        Button(action: { appState.currentTab = .translate }) {
            HStack(spacing: KivuSpacing.md) {
                ZStack {
                    Circle()
                        .fill(KivuColors.sunsetGradient)
                        .frame(width: 60, height: 60)
                    Image(systemName: "waveform.and.mic")
                        .foregroundColor(.white)
                        .font(.system(size: 24, weight: .semibold))
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text("Traduction Vocale")
                        .font(KivuTypography.headlineMedium)
                        .foregroundColor(KivuColors.primaryText)
                    Text("Parlez, écoutez, comprenez — instantané")
                        .font(KivuTypography.bodySmall)
                        .foregroundColor(KivuColors.secondaryText)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundColor(KivuColors.secondaryText)
            }
            .padding(KivuSpacing.md)
            .background(KivuColors.surface)
            .cornerRadius(KivuRadius.lg)
            .kivuSoftShadow()
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Features Grid
struct FeaturesGridSection: View {
    let features: [KivuFeature] = KivuFeature.all

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            HStack {
                Text("Nos 8 Révolutions")
                    .font(KivuTypography.headlineLarge)
                    .foregroundColor(KivuColors.primaryText)
                Spacer()
                Text("Découvrir")
                    .font(KivuTypography.labelMedium)
                    .foregroundColor(KivuColors.primary)
            }

            LazyVGrid(columns: [
                GridItem(.flexible(), spacing: KivuSpacing.sm),
                GridItem(.flexible(), spacing: KivuSpacing.sm)
            ], spacing: KivuSpacing.sm) {
                ForEach(features) { feature in
                    FeatureGridTile(feature: feature)
                }
            }
        }
    }
}

struct FeatureGridTile: View {
    let feature: KivuFeature

    var body: some View {
        NavigationLink(destination: feature.destination()) {
            VStack(alignment: .leading, spacing: KivuSpacing.sm) {
                ZStack {
                    Circle()
                        .fill(feature.color.opacity(0.15))
                        .frame(width: 44, height: 44)
                    Image(systemName: feature.icon)
                        .foregroundColor(feature.color)
                        .font(.system(size: 18, weight: .semibold))
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(feature.title)
                        .font(KivuTypography.headlineSmall)
                        .foregroundColor(KivuColors.primaryText)
                        .multilineTextAlignment(.leading)
                    Text(feature.subtitle)
                        .font(KivuTypography.bodySmall)
                        .foregroundColor(KivuColors.secondaryText)
                        .multilineTextAlignment(.leading)
                        .lineLimit(2)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(KivuSpacing.md)
            .background(KivuColors.surface)
            .cornerRadius(KivuRadius.lg)
            .kivuSoftShadow()
        }
        .buttonStyle(.plain)
    }
}

struct KivuFeature: Identifiable {
    let id = UUID()
    let title: String
    let subtitle: String
    let icon: String
    let color: Color
    let destination: () -> AnyView

    static let all: [KivuFeature] = [
        KivuFeature(
            title: "Traduction",
            subtitle: "Voix temps réel offline",
            icon: "waveform.and.mic",
            color: KivuColors.translationColor,
            destination: { AnyView(TranslationView()) }
        ),
        KivuFeature(
            title: "Apprentissage",
            subtitle: "Quêtes gamifiées",
            icon: "graduationcap.fill",
            color: KivuColors.learningColor,
            destination: { AnyView(LearningView()) }
        ),
        KivuFeature(
            title: "Préservation",
            subtitle: "Archive éternelle",
            icon: "archivebox.fill",
            color: KivuColors.preservationColor,
            destination: { AnyView(PreservationView()) }
        ),
        KivuFeature(
            title: "Business",
            subtitle: "Commerce multilingue",
            icon: "briefcase.fill",
            color: KivuColors.businessColor,
            destination: { AnyView(BusinessView()) }
        ),
        KivuFeature(
            title: "Multi-Party",
            subtitle: "Réunions multilangues",
            icon: "person.3.fill",
            color: KivuColors.multiPartyColor,
            destination: { AnyView(MultiPartyView()) }
        ),
        KivuFeature(
            title: "AI Tutor",
            subtitle: "Assistant personnel",
            icon: "sparkles",
            color: KivuColors.assistantColor,
            destination: { AnyView(AssistantView()) }
        ),
        KivuFeature(
            title: "Diaspora",
            subtitle: "Familles connectées",
            icon: "heart.circle.fill",
            color: KivuColors.diasporaColor,
            destination: { AnyView(DiasporaView()) }
        ),
        KivuFeature(
            title: "Accessibilité",
            subtitle: "Pour tous, partout",
            icon: "figure.wave",
            color: KivuColors.accessibilityColor,
            destination: { AnyView(AccessibilityView()) }
        )
    ]
}

// MARK: - Impact Counter
struct ImpactCounterSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            Text("Impact KIVU en Temps Réel")
                .font(KivuTypography.headlineLarge)
                .foregroundColor(KivuColors.primaryText)

            HStack(spacing: KivuSpacing.sm) {
                ImpactTile(value: "2 047", label: "Langues\nactives", color: KivuColors.primary, icon: "globe.europe.africa.fill")
                ImpactTile(value: "127M", label: "Personnes\nconnectées", color: KivuColors.accent, icon: "person.3.fill")
                ImpactTile(value: "483", label: "Langues\nsauvegardées", color: KivuColors.tertiary, icon: "shield.checkerboard")
            }
        }
    }
}

struct ImpactTile: View {
    let value: String
    let label: String
    let color: Color
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.xs) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.system(size: 20))
            Text(value)
                .font(KivuTypography.headlineLarge)
                .foregroundColor(KivuColors.primaryText)
            Text(label)
                .font(KivuTypography.labelSmall)
                .foregroundColor(KivuColors.secondaryText)
                .multilineTextAlignment(.leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(KivuSpacing.md)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.lg)
        .kivuSoftShadow()
    }
}

// MARK: - Daily Challenge
struct DailyChallengeCard: View {
    var body: some View {
        ZStack {
            KivuColors.sunsetGradient
                .cornerRadius(KivuRadius.xl)

            VStack(alignment: .leading, spacing: KivuSpacing.md) {
                HStack {
                    Label("Défi du jour", systemImage: "bolt.fill")
                        .font(KivuTypography.labelLarge)
                        .foregroundColor(.white)
                    Spacer()
                    Text("+150 XP")
                        .font(KivuTypography.labelMedium)
                        .foregroundColor(.white)
                        .padding(.horizontal, KivuSpacing.sm)
                        .padding(.vertical, 4)
                        .background(.ultraThinMaterial)
                        .cornerRadius(KivuRadius.round)
                }

                Text("Apprenez 5 salutations en Swahili")
                    .font(KivuTypography.headlineMedium)
                    .foregroundColor(.white)

                HStack {
                    Text("3 / 5 complétées")
                        .font(KivuTypography.bodySmall)
                        .foregroundColor(.white.opacity(0.9))
                    Spacer()
                    Button("Continuer") {}
                        .font(KivuTypography.labelLarge)
                        .foregroundColor(KivuColors.accent)
                        .padding(.horizontal, KivuSpacing.md)
                        .padding(.vertical, KivuSpacing.xs)
                        .background(Color.white)
                        .cornerRadius(KivuRadius.round)
                }
            }
            .padding(KivuSpacing.lg)
        }
        .frame(height: 160)
        .kivuSoftShadow()
    }
}

// MARK: - Endangered Languages Section
struct EndangeredLanguagesSection: View {
    let endangered = Language.endangeredLanguages

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            HStack {
                VStack(alignment: .leading) {
                    Text("Langues à Sauver")
                        .font(KivuTypography.headlineLarge)
                        .foregroundColor(KivuColors.primaryText)
                    Text("Chaque voix compte, chaque culture mérite d'exister")
                        .font(KivuTypography.bodySmall)
                        .foregroundColor(KivuColors.secondaryText)
                }
                Spacer()
            }
            .padding(.horizontal, KivuSpacing.lg)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: KivuSpacing.sm) {
                    ForEach(endangered) { language in
                        EndangeredLanguageCard(language: language)
                    }
                }
                .padding(.horizontal, KivuSpacing.lg)
            }
        }
    }
}

struct EndangeredLanguageCard: View {
    let language: Language

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.sm) {
            HStack {
                Text(language.flag)
                    .font(.system(size: 36))
                Spacer()
                Image(systemName: language.status.icon)
                    .foregroundColor(KivuColors.error)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(language.name)
                    .font(KivuTypography.headlineMedium)
                    .foregroundColor(KivuColors.primaryText)
                Text(language.nativeName)
                    .font(KivuTypography.bodySmall)
                    .foregroundColor(KivuColors.secondaryText)
            }

            HStack {
                Image(systemName: "person.fill")
                    .font(.system(size: 10))
                Text(formatSpeakers(language.speakers))
                    .font(KivuTypography.labelSmall)
            }
            .foregroundColor(KivuColors.secondaryText)

            Spacer(minLength: 0)

            Button("Contribuer") {}
                .font(KivuTypography.labelMedium)
                .foregroundColor(.white)
                .padding(.horizontal, KivuSpacing.md)
                .padding(.vertical, KivuSpacing.xs)
                .background(KivuColors.tertiary)
                .cornerRadius(KivuRadius.round)
        }
        .padding(KivuSpacing.md)
        .frame(width: 170, height: 210)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.lg)
        .kivuSoftShadow()
    }

    private func formatSpeakers(_ count: Int) -> String {
        if count >= 1_000_000 { return "\(count / 1_000_000)M locuteurs" }
        if count >= 1_000 { return "\(count / 1_000)K locuteurs" }
        return "\(count) locuteurs"
    }
}

// MARK: - Community
struct CommunityHighlightsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            Text("Communauté KIVU")
                .font(KivuTypography.headlineLarge)
                .foregroundColor(KivuColors.primaryText)

            VStack(spacing: KivuSpacing.sm) {
                CommunityPostRow(
                    avatar: "👵🏾",
                    name: "Mamie Awa",
                    action: "a enregistré 12 proverbes Wolof",
                    time: "il y a 3h"
                )
                CommunityPostRow(
                    avatar: "👨🏾‍🎓",
                    name: "Koffi",
                    action: "a terminé le niveau 15 en Dioula",
                    time: "il y a 5h"
                )
                CommunityPostRow(
                    avatar: "👩🏾‍⚕️",
                    name: "Dr. Amina",
                    action: "a aidé 47 patients via KIVU",
                    time: "hier"
                )
            }
        }
    }
}

struct CommunityPostRow: View {
    let avatar: String
    let name: String
    let action: String
    let time: String

    var body: some View {
        HStack(spacing: KivuSpacing.sm) {
            ZStack {
                Circle()
                    .fill(KivuColors.background)
                    .frame(width: 44, height: 44)
                Text(avatar).font(.system(size: 24))
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .font(KivuTypography.headlineSmall)
                    .foregroundColor(KivuColors.primaryText)
                Text(action)
                    .font(KivuTypography.bodySmall)
                    .foregroundColor(KivuColors.secondaryText)
            }
            Spacer()
            Text(time)
                .font(KivuTypography.labelSmall)
                .foregroundColor(KivuColors.tertiaryText)
        }
        .padding(KivuSpacing.md)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.md)
        .kivuSoftShadow()
    }
}
