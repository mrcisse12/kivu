//
//  LearningService.swift
//  Orchestration des quêtes, XP, badges et progression
//

import Foundation
import Combine

final class LearningService: ObservableObject {
    @Published var userProgress: UserProgress = .empty
    @Published var availableQuests: [LearningQuest] = []
    @Published var activeQuest: LearningQuest?
    @Published var badges: [LearningBadge] = []
    @Published var leaderboard: [LeaderboardEntry] = []

    private let api = APIClient.shared

    init() {
        loadMockData()
    }

    func loadMockData() {
        availableQuests = [
            LearningQuest(
                id: "q1",
                title: "Marché de Dakar",
                description: "Apprenez à négocier le prix d'un fruit",
                language: "swa",
                difficulty: .beginner,
                xpReward: 150,
                steps: [
                    LearningStep(id: "s1", prompt: "How do you say 'How much?'", answer: "Bei gani?", hint: "Commence par 'Bei'"),
                    LearningStep(id: "s2", prompt: "How do you say 'Too expensive'", answer: "Ghali sana", hint: "Terminé par sana")
                ],
                icon: "🥭",
                category: .commerce
            ),
            LearningQuest(
                id: "q2",
                title: "Présentations",
                description: "Rencontrer un nouvel ami",
                language: "swa",
                difficulty: .beginner,
                xpReward: 100,
                steps: [
                    LearningStep(id: "s1", prompt: "Dire 'Bonjour'", answer: "Habari", hint: "Commence par H"),
                    LearningStep(id: "s2", prompt: "Dire 'Je m'appelle Amadou'", answer: "Jina langu ni Amadou", hint: "Jina = nom")
                ],
                icon: "👋",
                category: .greetings
            )
        ]

        badges = [
            LearningBadge(id: "b1", title: "Première conversation", icon: "💬", unlockedDate: Date(), rarity: .common),
            LearningBadge(id: "b2", title: "100 mots", icon: "📚", unlockedDate: Date(), rarity: .rare),
            LearningBadge(id: "b3", title: "Série 7 jours", icon: "🔥", unlockedDate: Date(), rarity: .rare)
        ]

        userProgress = UserProgress(
            level: 8,
            currentXP: 2340,
            requiredXP: 3600,
            streak: 12,
            wordsLearned: 47,
            lessonsCompleted: 23,
            activeLanguages: ["swa", "wol", "bam"]
        )
    }

    func completeQuest(_ quest: LearningQuest) {
        userProgress.currentXP += quest.xpReward
        if userProgress.currentXP >= userProgress.requiredXP {
            userProgress.level += 1
            userProgress.currentXP -= userProgress.requiredXP
            userProgress.requiredXP = Int(Double(userProgress.requiredXP) * 1.25)
        }
        userProgress.lessonsCompleted += 1
    }

    func startQuest(_ quest: LearningQuest) {
        activeQuest = quest
    }
}

struct UserProgress: Codable {
    var level: Int
    var currentXP: Int
    var requiredXP: Int
    var streak: Int
    var wordsLearned: Int
    var lessonsCompleted: Int
    var activeLanguages: [String]

    static let empty = UserProgress(level: 1, currentXP: 0, requiredXP: 100, streak: 0, wordsLearned: 0, lessonsCompleted: 0, activeLanguages: [])
}

struct LearningQuest: Identifiable, Codable {
    let id: String
    let title: String
    let description: String
    let language: String
    let difficulty: Difficulty
    let xpReward: Int
    let steps: [LearningStep]
    let icon: String
    let category: QuestCategory

    enum Difficulty: String, Codable { case beginner, intermediate, advanced, expert }
    enum QuestCategory: String, Codable { case greetings, commerce, family, travel, work, culture, medical }
}

struct LearningStep: Identifiable, Codable {
    let id: String
    let prompt: String
    let answer: String
    let hint: String
}

struct LearningBadge: Identifiable, Codable {
    let id: String
    let title: String
    let icon: String
    let unlockedDate: Date
    let rarity: Rarity

    enum Rarity: String, Codable { case common, rare, epic, legendary }
}

struct LeaderboardEntry: Identifiable, Codable {
    let id: String
    let rank: Int
    let userName: String
    let countryFlag: String
    let xp: Int
}
