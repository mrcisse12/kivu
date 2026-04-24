//
//  KIVUApp.swift
//  KIVU - La Plateforme Mondiale de Traduction & Apprentissage Linguistique
//
//  Created for Science Fest Africa 2026
//

import SwiftUI

@main
struct KIVUApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var authService = AuthService()
    @StateObject private var translationService = TranslationService()
    @StateObject private var learningService = LearningService()
    @StateObject private var preservationService = PreservationService()
    @StateObject private var themeManager = ThemeManager()

    init() {
        configureAppearance()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .environmentObject(authService)
                .environmentObject(translationService)
                .environmentObject(learningService)
                .environmentObject(preservationService)
                .environmentObject(themeManager)
                .preferredColorScheme(themeManager.colorScheme)
        }
    }

    private func configureAppearance() {
        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithTransparentBackground()
        navAppearance.titleTextAttributes = [.foregroundColor: UIColor(KivuColors.primaryText)]
        navAppearance.largeTitleTextAttributes = [
            .foregroundColor: UIColor(KivuColors.primaryText),
            .font: UIFont.systemFont(ofSize: 34, weight: .bold)
        ]
        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance

        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithTransparentBackground()
        tabAppearance.backgroundColor = UIColor(KivuColors.surface.opacity(0.85))
        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance
    }
}

final class AppState: ObservableObject {
    @Published var isOnboardingCompleted: Bool = UserDefaults.standard.bool(forKey: "onboardingCompleted")
    @Published var currentTab: MainTab = .home
    @Published var selectedLanguage: Language = .french

    func completeOnboarding() {
        isOnboardingCompleted = true
        UserDefaults.standard.set(true, forKey: "onboardingCompleted")
    }
}

enum MainTab: Int, CaseIterable, Identifiable {
    case home, translate, learn, preserve, profile
    var id: Int { rawValue }

    var title: String {
        switch self {
        case .home: return "Accueil"
        case .translate: return "Traduire"
        case .learn: return "Apprendre"
        case .preserve: return "Préserver"
        case .profile: return "Profil"
        }
    }

    var icon: String {
        switch self {
        case .home: return "house.fill"
        case .translate: return "waveform.and.mic"
        case .learn: return "graduationcap.fill"
        case .preserve: return "archivebox.fill"
        case .profile: return "person.crop.circle.fill"
        }
    }
}
