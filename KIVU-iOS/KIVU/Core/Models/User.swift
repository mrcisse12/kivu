//
//  User.swift
//  Modèle utilisateur principal
//

import Foundation

struct User: Identifiable, Codable {
    let id: String
    var name: String
    var email: String
    var avatarEmoji: String
    var country: String
    var countryFlag: String
    var preferredLanguage: String
    var learningLanguages: [String]
    var motherTongue: String?
    var subscription: Subscription
    var createdAt: Date
    var stats: UserStats

    enum Subscription: String, Codable {
        case free
        case starter
        case pro
        case family
        case enterprise

        var displayName: String {
            switch self {
            case .free: return "Gratuit"
            case .starter: return "Starter"
            case .pro: return "Pro"
            case .family: return "Famille"
            case .enterprise: return "Entreprise"
            }
        }

        var monthlyPrice: Int {
            switch self {
            case .free: return 0
            case .starter: return 2000
            case .pro: return 5000
            case .family: return 10000
            case .enterprise: return 0
            }
        }
    }

    struct UserStats: Codable {
        var xp: Int
        var level: Int
        var streak: Int
        var badgesCount: Int
        var translationsCount: Int
        var contributionsCount: Int
        var rank: Int
    }

    static let demo = User(
        id: "demo-user-001",
        name: "Amadou Diallo",
        email: "amadou@kivu.africa",
        avatarEmoji: "🧑🏾",
        country: "Côte d'Ivoire",
        countryFlag: "🇨🇮",
        preferredLanguage: "fra",
        learningLanguages: ["swa", "wol", "bam"],
        motherTongue: "dyu",
        subscription: .pro,
        createdAt: Date(),
        stats: UserStats(xp: 2340, level: 8, streak: 12, badgesCount: 23, translationsCount: 147, contributionsCount: 18, rank: 42)
    )
}
