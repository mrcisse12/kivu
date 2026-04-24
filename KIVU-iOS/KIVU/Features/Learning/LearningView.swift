//
//  LearningView.swift
//  Apprentissage gamifié — Feature #2
//

import SwiftUI

struct LearningView: View {
    @EnvironmentObject var learningService: LearningService
    @State private var selectedLanguage: Language = .swahili
    @State private var selectedTab: LearningTab = .quests

    var body: some View {
        ZStack {
            KivuColors.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: KivuSpacing.lg) {
                    LearningHeader(selectedLanguage: $selectedLanguage)
                    XPProgressCard()
                        .padding(.horizontal, KivuSpacing.lg)
                    LearningTabBar(selected: $selectedTab)
                        .padding(.horizontal, KivuSpacing.lg)

                    switch selectedTab {
                    case .quests: QuestsSection()
                    case .skills: SkillsSection()
                    case .achievements: AchievementsSection()
                    case .leaderboard: LeaderboardSection()
                    }

                    Color.clear.frame(height: 100)
                }
                .padding(.top, KivuSpacing.md)
            }
        }
    }
}

enum LearningTab: String, CaseIterable {
    case quests = "Quêtes"
    case skills = "Compétences"
    case achievements = "Badges"
    case leaderboard = "Classement"
}

struct LearningHeader: View {
    @Binding var selectedLanguage: Language

    var body: some View {
        VStack(spacing: KivuSpacing.md) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Apprendre")
                        .font(KivuTypography.displaySmall)
                        .foregroundColor(KivuColors.primaryText)
                    Text("Joue, gagne, parle couramment")
                        .font(KivuTypography.bodySmall)
                        .foregroundColor(KivuColors.secondaryText)
                }
                Spacer()
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: KivuSpacing.xs) {
                    ForEach(Language.allLanguages.prefix(10)) { lang in
                        Button {
                            withAnimation { selectedLanguage = lang }
                        } label: {
                            HStack(spacing: 6) {
                                Text(lang.flag)
                                Text(lang.name)
                                    .font(KivuTypography.labelMedium)
                            }
                            .foregroundColor(selectedLanguage.id == lang.id ? .white : KivuColors.primaryText)
                            .padding(.horizontal, KivuSpacing.md)
                            .padding(.vertical, KivuSpacing.xs)
                            .background(
                                selectedLanguage.id == lang.id ?
                                AnyView(KivuColors.heroGradient.cornerRadius(KivuRadius.round)) :
                                AnyView(KivuColors.surface.cornerRadius(KivuRadius.round))
                            )
                        }
                    }
                }
            }
        }
        .padding(.horizontal, KivuSpacing.lg)
    }
}

struct XPProgressCard: View {
    var body: some View {
        ZStack {
            KivuColors.savannaGradient.cornerRadius(KivuRadius.xl)

            HStack(spacing: KivuSpacing.md) {
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.3), lineWidth: 8)
                        .frame(width: 80, height: 80)
                    Circle()
                        .trim(from: 0, to: 0.65)
                        .stroke(Color.white, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .frame(width: 80, height: 80)
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: 0) {
                        Text("8")
                            .font(KivuTypography.displaySmall)
                            .foregroundColor(.white)
                        Text("Niv.")
                            .font(KivuTypography.labelSmall)
                            .foregroundColor(.white.opacity(0.8))
                    }
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("Maître Conversationnel")
                        .font(KivuTypography.headlineMedium)
                        .foregroundColor(.white)
                    Text("2 340 / 3 600 XP")
                        .font(KivuTypography.bodySmall)
                        .foregroundColor(.white.opacity(0.9))
                    HStack(spacing: KivuSpacing.sm) {
                        Label("12", systemImage: "flame.fill")
                        Label("47", systemImage: "book.fill")
                    }
                    .font(KivuTypography.labelSmall)
                    .foregroundColor(.white)
                }
                Spacer()
            }
            .padding(KivuSpacing.lg)
        }
        .frame(height: 140)
        .kivuSoftShadow()
    }
}

struct LearningTabBar: View {
    @Binding var selected: LearningTab

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: KivuSpacing.xs) {
                ForEach(LearningTab.allCases, id: \.self) { tab in
                    Button {
                        withAnimation { selected = tab }
                    } label: {
                        Text(tab.rawValue)
                            .font(KivuTypography.labelLarge)
                            .foregroundColor(selected == tab ? .white : KivuColors.secondaryText)
                            .padding(.horizontal, KivuSpacing.md)
                            .padding(.vertical, KivuSpacing.sm)
                            .background(
                                selected == tab ?
                                AnyView(KivuColors.accent.cornerRadius(KivuRadius.round)) :
                                AnyView(KivuColors.surface.cornerRadius(KivuRadius.round))
                            )
                    }
                }
            }
        }
    }
}

struct QuestsSection: View {
    let quests: [Quest] = [
        Quest(title: "Marché de Dakar", subtitle: "Négocie avec un vendeur de fruits", icon: "🥭", xp: 150, progress: 0.33, color: KivuColors.accent),
        Quest(title: "Premier Rendez-vous", subtitle: "Fais connaissance avec un ami", icon: "☕", xp: 100, progress: 0.60, color: KivuColors.secondary),
        Quest(title: "Taxi à Abidjan", subtitle: "Indique ta destination", icon: "🚕", xp: 120, progress: 0, color: KivuColors.primary),
        Quest(title: "À l'hôpital", subtitle: "Décris tes symptômes", icon: "🏥", xp: 200, progress: 0, color: KivuColors.error)
    ]

    var body: some View {
        VStack(spacing: KivuSpacing.md) {
            HStack {
                Text("Quêtes du jour")
                    .font(KivuTypography.headlineLarge)
                    .foregroundColor(KivuColors.primaryText)
                Spacer()
                Label("4 actives", systemImage: "flag.fill")
                    .font(KivuTypography.labelMedium)
                    .foregroundColor(KivuColors.accent)
            }
            .padding(.horizontal, KivuSpacing.lg)

            VStack(spacing: KivuSpacing.sm) {
                ForEach(quests) { quest in
                    QuestCard(quest: quest)
                }
            }
            .padding(.horizontal, KivuSpacing.lg)
        }
    }
}

struct Quest: Identifiable {
    let id = UUID()
    let title: String
    let subtitle: String
    let icon: String
    let xp: Int
    let progress: Double
    let color: Color
}

struct QuestCard: View {
    let quest: Quest

    var body: some View {
        HStack(spacing: KivuSpacing.md) {
            ZStack {
                Circle()
                    .fill(quest.color.opacity(0.15))
                    .frame(width: 58, height: 58)
                Text(quest.icon).font(.system(size: 30))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(quest.title)
                    .font(KivuTypography.headlineSmall)
                    .foregroundColor(KivuColors.primaryText)
                Text(quest.subtitle)
                    .font(KivuTypography.bodySmall)
                    .foregroundColor(KivuColors.secondaryText)

                HStack(spacing: KivuSpacing.xs) {
                    ProgressView(value: quest.progress)
                        .tint(quest.color)
                        .frame(maxWidth: 120)
                    Label("+\(quest.xp) XP", systemImage: "star.fill")
                        .font(KivuTypography.labelSmall)
                        .foregroundColor(quest.color)
                }
            }

            Spacer()

            Image(systemName: quest.progress > 0 ? "play.circle.fill" : "lock.open.fill")
                .foregroundColor(quest.color)
                .font(.system(size: 28))
        }
        .padding(KivuSpacing.md)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.lg)
        .kivuSoftShadow()
    }
}

struct SkillsSection: View {
    let skills: [Skill] = [
        Skill(name: "Salutations", level: 12, maxLevel: 15, color: KivuColors.primary, icon: "hand.wave.fill"),
        Skill(name: "Nombres & chiffres", level: 8, maxLevel: 15, color: KivuColors.secondary, icon: "number"),
        Skill(name: "Nourriture", level: 6, maxLevel: 15, color: KivuColors.accent, icon: "fork.knife"),
        Skill(name: "Famille", level: 10, maxLevel: 15, color: KivuColors.tertiary, icon: "person.2.fill"),
        Skill(name: "Voyage", level: 4, maxLevel: 15, color: KivuColors.info, icon: "airplane"),
        Skill(name: "Travail", level: 3, maxLevel: 15, color: KivuColors.diasporaColor, icon: "briefcase.fill")
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            Text("Compétences")
                .font(KivuTypography.headlineLarge)
                .foregroundColor(KivuColors.primaryText)

            LazyVGrid(columns: [
                GridItem(.flexible(), spacing: KivuSpacing.sm),
                GridItem(.flexible(), spacing: KivuSpacing.sm)
            ], spacing: KivuSpacing.sm) {
                ForEach(skills) { skill in
                    SkillTile(skill: skill)
                }
            }
        }
        .padding(.horizontal, KivuSpacing.lg)
    }
}

struct Skill: Identifiable {
    let id = UUID()
    let name: String
    let level: Int
    let maxLevel: Int
    let color: Color
    let icon: String
}

struct SkillTile: View {
    let skill: Skill

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.sm) {
            HStack {
                ZStack {
                    Circle()
                        .fill(skill.color.opacity(0.15))
                        .frame(width: 40, height: 40)
                    Image(systemName: skill.icon)
                        .foregroundColor(skill.color)
                }
                Spacer()
                Text("\(skill.level)/\(skill.maxLevel)")
                    .font(KivuTypography.labelMedium)
                    .foregroundColor(KivuColors.secondaryText)
            }
            Text(skill.name)
                .font(KivuTypography.headlineSmall)
                .foregroundColor(KivuColors.primaryText)
            ProgressView(value: Double(skill.level), total: Double(skill.maxLevel))
                .tint(skill.color)
        }
        .padding(KivuSpacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.lg)
        .kivuSoftShadow()
    }
}

struct AchievementsSection: View {
    let achievements: [Achievement] = [
        Achievement(title: "Première Conversation", icon: "💬", unlocked: true, rarity: .common),
        Achievement(title: "100 Mots Appris", icon: "📚", unlocked: true, rarity: .rare),
        Achievement(title: "Série 7 jours", icon: "🔥", unlocked: true, rarity: .rare),
        Achievement(title: "Polyglotte", icon: "🌍", unlocked: false, rarity: .epic),
        Achievement(title: "Maître Conteur", icon: "👑", unlocked: false, rarity: .legendary),
        Achievement(title: "Gardien Cultural", icon: "🛡️", unlocked: false, rarity: .legendary)
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            Text("Badges & Récompenses")
                .font(KivuTypography.headlineLarge)
                .foregroundColor(KivuColors.primaryText)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: KivuSpacing.sm) {
                ForEach(achievements) { ach in
                    AchievementTile(achievement: ach)
                }
            }
        }
        .padding(.horizontal, KivuSpacing.lg)
    }
}

struct Achievement: Identifiable {
    let id = UUID()
    let title: String
    let icon: String
    let unlocked: Bool
    let rarity: Rarity

    enum Rarity {
        case common, rare, epic, legendary
        var color: Color {
            switch self {
            case .common: return KivuColors.secondaryText
            case .rare: return KivuColors.primary
            case .epic: return KivuColors.tertiary
            case .legendary: return KivuColors.accent
            }
        }
    }
}

struct AchievementTile: View {
    let achievement: Achievement

    var body: some View {
        VStack(spacing: 6) {
            ZStack {
                Circle()
                    .fill(achievement.unlocked ? achievement.rarity.color.opacity(0.15) : Color.gray.opacity(0.1))
                    .frame(width: 64, height: 64)
                    .overlay(
                        Circle().stroke(achievement.unlocked ? achievement.rarity.color : Color.gray.opacity(0.3), lineWidth: 2)
                    )
                Text(achievement.icon)
                    .font(.system(size: 32))
                    .opacity(achievement.unlocked ? 1 : 0.3)
            }
            Text(achievement.title)
                .font(KivuTypography.labelSmall)
                .foregroundColor(achievement.unlocked ? KivuColors.primaryText : KivuColors.tertiaryText)
                .multilineTextAlignment(.center)
                .lineLimit(2)
        }
        .padding(KivuSpacing.xs)
        .frame(maxWidth: .infinity)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.md)
        .kivuSoftShadow()
    }
}

struct LeaderboardSection: View {
    let leaders: [Leader] = [
        Leader(rank: 1, name: "Fatou D.", country: "🇸🇳", xp: 14_580, avatar: "👩🏾"),
        Leader(rank: 2, name: "Kofi A.", country: "🇬🇭", xp: 13_204, avatar: "👨🏿"),
        Leader(rank: 3, name: "Amina B.", country: "🇲🇱", xp: 12_890, avatar: "👩🏾‍🦱"),
        Leader(rank: 4, name: "Sekou T.", country: "🇬🇳", xp: 11_500, avatar: "👨🏾"),
        Leader(rank: 5, name: "Vous", country: "🇨🇮", xp: 2_340, avatar: "🧑🏾", isMe: true)
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            Text("Classement mondial")
                .font(KivuTypography.headlineLarge)
                .foregroundColor(KivuColors.primaryText)

            VStack(spacing: KivuSpacing.xs) {
                ForEach(leaders) { leader in
                    LeaderRow(leader: leader)
                }
            }
        }
        .padding(.horizontal, KivuSpacing.lg)
    }
}

struct Leader: Identifiable {
    let id = UUID()
    let rank: Int
    let name: String
    let country: String
    let xp: Int
    let avatar: String
    var isMe: Bool = false
}

struct LeaderRow: View {
    let leader: Leader

    var body: some View {
        HStack(spacing: KivuSpacing.sm) {
            Text("\(leader.rank)")
                .font(KivuTypography.headlineMedium)
                .foregroundColor(rankColor)
                .frame(width: 32)
            Text(leader.avatar)
                .font(.system(size: 28))
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(leader.name)
                        .font(KivuTypography.headlineSmall)
                        .foregroundColor(KivuColors.primaryText)
                    Text(leader.country)
                }
                Text("\(leader.xp.formatted()) XP")
                    .font(KivuTypography.labelSmall)
                    .foregroundColor(KivuColors.secondaryText)
            }
            Spacer()
            if leader.rank <= 3 {
                Image(systemName: "medal.fill")
                    .foregroundColor(rankColor)
            }
        }
        .padding(KivuSpacing.md)
        .background(leader.isMe ? KivuColors.primary.opacity(0.08) : KivuColors.surface)
        .cornerRadius(KivuRadius.md)
        .overlay(
            leader.isMe ?
                RoundedRectangle(cornerRadius: KivuRadius.md).stroke(KivuColors.primary, lineWidth: 2) :
                nil
        )
        .kivuSoftShadow()
    }

    private var rankColor: Color {
        switch leader.rank {
        case 1: return KivuColors.accent
        case 2: return KivuColors.secondaryText
        case 3: return Color(red: 0.7, green: 0.45, blue: 0.2)
        default: return KivuColors.primaryText
        }
    }
}
