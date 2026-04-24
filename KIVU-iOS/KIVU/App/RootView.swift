//
//  RootView.swift
//  Point d'entrée visuel — gère onboarding et navigation principale
//

import SwiftUI

struct RootView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        ZStack {
            if appState.isOnboardingCompleted {
                MainTabView()
                    .transition(.opacity.combined(with: .scale))
            } else {
                OnboardingView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.5), value: appState.isOnboardingCompleted)
    }
}

struct MainTabView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        ZStack(alignment: .bottom) {
            Group {
                switch appState.currentTab {
                case .home: HomeView()
                case .translate: TranslationView()
                case .learn: LearningView()
                case .preserve: PreservationView()
                case .profile: ProfileView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(KivuColors.background.ignoresSafeArea())

            KivuTabBar(selectedTab: $appState.currentTab)
        }
    }
}

struct KivuTabBar: View {
    @Binding var selectedTab: MainTab

    var body: some View {
        HStack(spacing: 0) {
            ForEach(MainTab.allCases) { tab in
                KivuTabBarItem(
                    tab: tab,
                    isSelected: selectedTab == tab,
                    action: {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                            selectedTab = tab
                        }
                    }
                )
            }
        }
        .padding(.horizontal, KivuSpacing.md)
        .padding(.vertical, KivuSpacing.sm)
        .background(
            RoundedRectangle(cornerRadius: KivuRadius.xxl)
                .fill(KivuColors.surface)
                .kivuMediumShadow()
        )
        .padding(.horizontal, KivuSpacing.md)
        .padding(.bottom, KivuSpacing.xs)
    }
}

struct KivuTabBarItem: View {
    let tab: MainTab
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                ZStack {
                    if isSelected {
                        Capsule()
                            .fill(KivuColors.heroGradient)
                            .frame(width: 52, height: 32)
                            .matchedGeometryEffect(id: "tabSelection", in: namespace)
                    }
                    Image(systemName: tab.icon)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(isSelected ? .white : KivuColors.secondaryText)
                }
                Text(tab.title)
                    .font(KivuTypography.labelSmall)
                    .foregroundColor(isSelected ? KivuColors.primary : KivuColors.secondaryText)
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
    }

    @Namespace private var namespace
}
