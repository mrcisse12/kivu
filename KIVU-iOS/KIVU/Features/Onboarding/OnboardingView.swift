//
//  OnboardingView.swift
//  Onboarding premium — 5 écrans magnifiques qui racontent la mission KIVU
//

import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var appState: AppState
    @State private var currentPage: Int = 0
    @State private var animateGradient = false

    let pages: [OnboardingPage] = [
        OnboardingPage(
            icon: "globe.europe.africa.fill",
            title: "Bienvenue dans KIVU",
            subtitle: "La plateforme mondiale qui réunit\n2000+ langues africaines",
            gradient: KivuColors.heroGradient,
            accentColor: KivuColors.primary,
            highlight: "2000+ Langues"
        ),
        OnboardingPage(
            icon: "waveform.and.mic",
            title: "Traduction Vocale Instantanée",
            subtitle: "Parlez dans votre langue maternelle.\nKIVU traduit en temps réel, même hors-ligne.",
            gradient: KivuColors.sunsetGradient,
            accentColor: KivuColors.accent,
            highlight: "< 200ms"
        ),
        OnboardingPage(
            icon: "graduationcap.fill",
            title: "Apprendre en Jouant",
            subtitle: "Quêtes interactives, XP, badges.\nApprenez une langue en 30 jours, 85% de rétention.",
            gradient: KivuColors.savannaGradient,
            accentColor: KivuColors.secondary,
            highlight: "85% rétention"
        ),
        OnboardingPage(
            icon: "archivebox.fill",
            title: "Préserver Notre Héritage",
            subtitle: "Immortalisez les langues menacées.\nLa voix de votre grand-mère, pour toujours.",
            gradient: KivuColors.royalGradient,
            accentColor: KivuColors.tertiary,
            highlight: "500+ langues sauvées"
        ),
        OnboardingPage(
            icon: "heart.text.square.fill",
            title: "Unir l'Humanité",
            subtitle: "Parce que chaque langue raconte\nune histoire qui mérite d'être entendue.",
            gradient: KivuColors.kivuLakeGradient,
            accentColor: KivuColors.primaryDark,
            highlight: "7 milliards connectés"
        )
    ]

    var body: some View {
        ZStack {
            pages[currentPage].gradient
                .ignoresSafeArea()
                .animation(.easeInOut(duration: 0.6), value: currentPage)

            // Motifs décoratifs africains en arrière-plan
            DecorativePatternView()
                .opacity(0.08)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Skip Button
                HStack {
                    Spacer()
                    Button("Passer") {
                        appState.completeOnboarding()
                    }
                    .font(KivuTypography.labelLarge)
                    .foregroundColor(.white.opacity(0.9))
                    .padding(.horizontal, KivuSpacing.md)
                    .padding(.vertical, KivuSpacing.xs)
                    .background(.ultraThinMaterial)
                    .cornerRadius(KivuRadius.round)
                }
                .padding(.horizontal, KivuSpacing.lg)
                .padding(.top, KivuSpacing.md)

                Spacer()

                // Page Content
                TabView(selection: $currentPage) {
                    ForEach(0..<pages.count, id: \.self) { index in
                        OnboardingPageView(page: pages[index])
                            .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut, value: currentPage)

                // Page indicators
                HStack(spacing: 8) {
                    ForEach(0..<pages.count, id: \.self) { index in
                        Capsule()
                            .fill(Color.white)
                            .frame(width: index == currentPage ? 28 : 8, height: 8)
                            .opacity(index == currentPage ? 1 : 0.4)
                            .animation(.spring(response: 0.4, dampingFraction: 0.7), value: currentPage)
                    }
                }
                .padding(.vertical, KivuSpacing.lg)

                // Bouton d'action
                Button(action: handleNext) {
                    HStack(spacing: KivuSpacing.sm) {
                        Text(currentPage == pages.count - 1 ? "Commencer l'aventure" : "Continuer")
                            .font(KivuTypography.headlineMedium)
                        Image(systemName: "arrow.right")
                            .font(.system(size: 16, weight: .bold))
                    }
                    .foregroundColor(pages[currentPage].accentColor)
                    .padding(.vertical, KivuSpacing.md)
                    .frame(maxWidth: .infinity)
                    .background(Color.white)
                    .cornerRadius(KivuRadius.round)
                    .kivuMediumShadow()
                }
                .padding(.horizontal, KivuSpacing.lg)
                .padding(.bottom, KivuSpacing.xxl)
            }
        }
    }

    private func handleNext() {
        if currentPage < pages.count - 1 {
            withAnimation { currentPage += 1 }
        } else {
            appState.completeOnboarding()
        }
    }
}

struct OnboardingPage {
    let icon: String
    let title: String
    let subtitle: String
    let gradient: LinearGradient
    let accentColor: Color
    let highlight: String
}

struct OnboardingPageView: View {
    let page: OnboardingPage
    @State private var appear = false

    var body: some View {
        VStack(spacing: KivuSpacing.xl) {
            // Icon Hero
            ZStack {
                Circle()
                    .fill(Color.white.opacity(0.15))
                    .frame(width: 220, height: 220)
                    .blur(radius: 30)

                Circle()
                    .stroke(Color.white.opacity(0.35), lineWidth: 2)
                    .frame(width: 180, height: 180)

                Circle()
                    .fill(.ultraThinMaterial)
                    .frame(width: 140, height: 140)

                Image(systemName: page.icon)
                    .font(.system(size: 60, weight: .semibold))
                    .foregroundColor(.white)
                    .symbolEffect(.pulse)
            }
            .scaleEffect(appear ? 1 : 0.7)
            .opacity(appear ? 1 : 0)

            VStack(spacing: KivuSpacing.md) {
                // Highlight Badge
                Text(page.highlight)
                    .font(KivuTypography.labelLarge)
                    .foregroundColor(.white)
                    .padding(.horizontal, KivuSpacing.md)
                    .padding(.vertical, KivuSpacing.xs)
                    .background(.ultraThinMaterial)
                    .cornerRadius(KivuRadius.round)

                Text(page.title)
                    .font(KivuTypography.displayMedium)
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)

                Text(page.subtitle)
                    .font(KivuTypography.bodyLarge)
                    .foregroundColor(.white.opacity(0.9))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, KivuSpacing.lg)
            }
            .offset(y: appear ? 0 : 30)
            .opacity(appear ? 1 : 0)
        }
        .onAppear {
            withAnimation(.spring(response: 0.7, dampingFraction: 0.7).delay(0.1)) {
                appear = true
            }
        }
        .onDisappear { appear = false }
    }
}

struct DecorativePatternView: View {
    var body: some View {
        GeometryReader { geo in
            ZStack {
                ForEach(0..<25) { i in
                    Circle()
                        .stroke(Color.white, lineWidth: 1)
                        .frame(width: CGFloat.random(in: 60...180))
                        .position(
                            x: CGFloat.random(in: 0...geo.size.width),
                            y: CGFloat.random(in: 0...geo.size.height)
                        )
                }
            }
        }
    }
}
