//
//  DiasporaView.swift
//  Connexion Diaspora — Feature #7
//

import SwiftUI

struct DiasporaView: View {
    var body: some View {
        ZStack {
            KivuColors.background.ignoresSafeArea()
            ScrollView {
                VStack(spacing: KivuSpacing.lg) {
                    FeaturePageHeader(
                        title: "Diaspora",
                        subtitle: "Familles connectées, cultures vivantes",
                        icon: "heart.circle.fill",
                        color: KivuColors.diasporaColor
                    )

                    FamilyTreeCard().padding(.horizontal, KivuSpacing.lg)
                    VideoCallCTA().padding(.horizontal, KivuSpacing.lg)
                    StoriesSection().padding(.horizontal, KivuSpacing.lg)
                    HeritageJourneyCard().padding(.horizontal, KivuSpacing.lg)

                    Color.clear.frame(height: 100)
                }
                .padding(.top, KivuSpacing.md)
            }
        }
    }
}

struct FamilyTreeCard: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [KivuColors.diasporaColor, KivuColors.primaryLight],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
            .cornerRadius(KivuRadius.xl)

            VStack(alignment: .leading, spacing: KivuSpacing.md) {
                Label("Mon arbre familial", systemImage: "tree.fill")
                    .font(KivuTypography.labelLarge)
                    .foregroundColor(.white)

                Text("3 générations · 12 membres")
                    .font(KivuTypography.headlineLarge)
                    .foregroundColor(.white)

                HStack(spacing: -10) {
                    ForEach(["👵🏾", "👴🏾", "👨🏾", "👩🏾", "🧒🏾", "👶🏾"], id: \.self) { emoji in
                        Text(emoji)
                            .font(.system(size: 28))
                            .frame(width: 44, height: 44)
                            .background(Color.white)
                            .clipShape(Circle())
                    }
                }

                HStack {
                    Text("Paris 🇫🇷 · Dakar 🇸🇳 · Abidjan 🇨🇮 · New York 🇺🇸")
                        .font(KivuTypography.labelSmall)
                        .foregroundColor(.white.opacity(0.9))
                    Spacer()
                }
            }
            .padding(KivuSpacing.lg)
        }
        .kivuSoftShadow()
    }
}

struct VideoCallCTA: View {
    var body: some View {
        HStack(spacing: KivuSpacing.sm) {
            Button {} label: {
                VStack(spacing: KivuSpacing.xs) {
                    Image(systemName: "video.fill").font(.system(size: 22))
                    Text("Appel vidéo").font(KivuTypography.labelLarge)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, KivuSpacing.md)
                .background(KivuColors.diasporaColor)
                .cornerRadius(KivuRadius.lg)
            }
            Button {} label: {
                VStack(spacing: KivuSpacing.xs) {
                    Image(systemName: "mic.circle.fill").font(.system(size: 22))
                    Text("Message vocal").font(KivuTypography.labelLarge)
                }
                .foregroundColor(KivuColors.diasporaColor)
                .frame(maxWidth: .infinity)
                .padding(.vertical, KivuSpacing.md)
                .background(KivuColors.diasporaColor.opacity(0.12))
                .cornerRadius(KivuRadius.lg)
            }
        }
    }
}

struct StoriesSection: View {
    let stories: [FamilyStory] = [
        FamilyStory(title: "L'histoire du village", author: "Grand-père Moussa", duration: "1h 17min", avatar: "👴🏾", language: "Bambara"),
        FamilyStory(title: "Le conte du lièvre rusé", author: "Grand-mère Awa", duration: "22min", avatar: "👵🏾", language: "Wolof"),
        FamilyStory(title: "Recette du Thieboudienne", author: "Tante Fatou", duration: "35min", avatar: "👩🏾‍🍳", language: "Wolof")
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            Text("Histoires de famille")
                .font(KivuTypography.headlineLarge)
                .foregroundColor(KivuColors.primaryText)

            VStack(spacing: KivuSpacing.xs) {
                ForEach(stories) { story in
                    StoryRow(story: story)
                }
            }
        }
    }
}

struct FamilyStory: Identifiable {
    let id = UUID()
    let title: String
    let author: String
    let duration: String
    let avatar: String
    let language: String
}

struct StoryRow: View {
    let story: FamilyStory
    var body: some View {
        HStack(spacing: KivuSpacing.sm) {
            Text(story.avatar)
                .font(.system(size: 40))
                .frame(width: 56, height: 56)
                .background(KivuColors.diasporaColor.opacity(0.15))
                .clipShape(Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(story.title)
                    .font(KivuTypography.headlineSmall)
                    .foregroundColor(KivuColors.primaryText)
                Text("par \(story.author) · \(story.language)")
                    .font(KivuTypography.labelSmall)
                    .foregroundColor(KivuColors.secondaryText)
                HStack(spacing: 4) {
                    Image(systemName: "waveform").font(.system(size: 10))
                    Text(story.duration).font(KivuTypography.labelSmall)
                }
                .foregroundColor(KivuColors.diasporaColor)
            }
            Spacer()
            Button {} label: {
                Image(systemName: "play.circle.fill")
                    .foregroundColor(KivuColors.diasporaColor)
                    .font(.system(size: 34))
            }
        }
        .padding(KivuSpacing.md)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.md)
        .kivuSoftShadow()
    }
}

struct HeritageJourneyCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            Label("Parcours héritage", systemImage: "map.fill")
                .font(KivuTypography.headlineMedium)
                .foregroundColor(KivuColors.primaryText)

            Text("Redécouvrez la langue de vos ancêtres en 30 jours. Recevez des contes, proverbes et leçons quotidiennes.")
                .font(KivuTypography.bodySmall)
                .foregroundColor(KivuColors.secondaryText)

            HStack(spacing: KivuSpacing.sm) {
                ForEach(1...7, id: \.self) { day in
                    VStack(spacing: 4) {
                        Circle()
                            .fill(day <= 3 ? KivuColors.diasporaColor : KivuColors.background)
                            .frame(width: 36, height: 36)
                            .overlay(
                                Text("\(day)")
                                    .font(KivuTypography.labelMedium)
                                    .foregroundColor(day <= 3 ? .white : KivuColors.secondaryText)
                            )
                        Text("J\(day)")
                            .font(KivuTypography.caption)
                            .foregroundColor(KivuColors.tertiaryText)
                    }
                }
            }

            Button {} label: {
                Text("Continuer jour 4")
                    .font(KivuTypography.labelLarge)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(KivuColors.diasporaColor)
                    .cornerRadius(KivuRadius.md)
            }
        }
        .padding(KivuSpacing.lg)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.xl)
        .kivuSoftShadow()
    }
}
