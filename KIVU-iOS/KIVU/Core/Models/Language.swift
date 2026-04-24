//
//  Language.swift
//  Modèle des 2000+ langues supportées par KIVU
//

import Foundation

struct Language: Identifiable, Hashable, Codable {
    let id: String              // ISO code (e.g. "wol", "yor")
    let name: String            // Nom français (e.g. "Wolof")
    let nativeName: String      // Nom dans sa propre langue (e.g. "Wolof")
    let flag: String            // Emoji drapeau
    let family: LanguageFamily
    let speakers: Int           // Nombre de locuteurs
    let countries: [String]
    let status: LanguageStatus
    let isOfflineAvailable: Bool
    let hasVoiceSupport: Bool
    let hasLearningCourse: Bool

    static let french = Language(
        id: "fra", name: "Français", nativeName: "Français",
        flag: "🇫🇷", family: .indoEuropean, speakers: 300_000_000,
        countries: ["FR", "CI", "SN", "ML"], status: .international,
        isOfflineAvailable: true, hasVoiceSupport: true, hasLearningCourse: true
    )

    static let english = Language(
        id: "eng", name: "Anglais", nativeName: "English",
        flag: "🇬🇧", family: .indoEuropean, speakers: 1_500_000_000,
        countries: ["GB", "US", "KE", "NG"], status: .international,
        isOfflineAvailable: true, hasVoiceSupport: true, hasLearningCourse: true
    )

    static let swahili = Language(
        id: "swa", name: "Swahili", nativeName: "Kiswahili",
        flag: "🇹🇿", family: .nigerCongo, speakers: 200_000_000,
        countries: ["TZ", "KE", "UG", "CD"], status: .lingua,
        isOfflineAvailable: true, hasVoiceSupport: true, hasLearningCourse: true
    )

    static let yoruba = Language(
        id: "yor", name: "Yoruba", nativeName: "Yorùbá",
        flag: "🇳🇬", family: .nigerCongo, speakers: 45_000_000,
        countries: ["NG", "BJ", "TG"], status: .healthy,
        isOfflineAvailable: true, hasVoiceSupport: true, hasLearningCourse: true
    )

    static let wolof = Language(
        id: "wol", name: "Wolof", nativeName: "Wolof",
        flag: "🇸🇳", family: .nigerCongo, speakers: 12_000_000,
        countries: ["SN", "GM", "MR"], status: .healthy,
        isOfflineAvailable: true, hasVoiceSupport: true, hasLearningCourse: true
    )

    static let bambara = Language(
        id: "bam", name: "Bambara", nativeName: "Bamanankan",
        flag: "🇲🇱", family: .nigerCongo, speakers: 15_000_000,
        countries: ["ML", "BF", "CI"], status: .healthy,
        isOfflineAvailable: true, hasVoiceSupport: true, hasLearningCourse: true
    )

    static let dioula = Language(
        id: "dyu", name: "Dioula", nativeName: "Julakan",
        flag: "🇨🇮", family: .nigerCongo, speakers: 10_000_000,
        countries: ["CI", "BF", "ML"], status: .healthy,
        isOfflineAvailable: true, hasVoiceSupport: true, hasLearningCourse: true
    )

    static let hausa = Language(
        id: "hau", name: "Haoussa", nativeName: "Hausa",
        flag: "🇳🇬", family: .afroAsiatic, speakers: 80_000_000,
        countries: ["NG", "NE", "GH"], status: .healthy,
        isOfflineAvailable: true, hasVoiceSupport: true, hasLearningCourse: true
    )

    static let igbo = Language(
        id: "ibo", name: "Igbo", nativeName: "Igbo",
        flag: "🇳🇬", family: .nigerCongo, speakers: 27_000_000,
        countries: ["NG"], status: .healthy,
        isOfflineAvailable: true, hasVoiceSupport: true, hasLearningCourse: true
    )

    static let amharic = Language(
        id: "amh", name: "Amharique", nativeName: "አማርኛ",
        flag: "🇪🇹", family: .afroAsiatic, speakers: 57_000_000,
        countries: ["ET"], status: .healthy,
        isOfflineAvailable: true, hasVoiceSupport: true, hasLearningCourse: true
    )

    static let zulu = Language(
        id: "zul", name: "Zoulou", nativeName: "isiZulu",
        flag: "🇿🇦", family: .nigerCongo, speakers: 28_000_000,
        countries: ["ZA"], status: .healthy,
        isOfflineAvailable: true, hasVoiceSupport: true, hasLearningCourse: true
    )

    static let lingala = Language(
        id: "lin", name: "Lingala", nativeName: "Lingála",
        flag: "🇨🇩", family: .nigerCongo, speakers: 40_000_000,
        countries: ["CD", "CG"], status: .lingua,
        isOfflineAvailable: true, hasVoiceSupport: true, hasLearningCourse: true
    )

    static let kinyarwanda = Language(
        id: "kin", name: "Kinyarwanda", nativeName: "Ikinyarwanda",
        flag: "🇷🇼", family: .nigerCongo, speakers: 12_000_000,
        countries: ["RW", "CD", "UG"], status: .healthy,
        isOfflineAvailable: true, hasVoiceSupport: true, hasLearningCourse: true
    )

    // Langues menacées — Mission Préservation
    static let bissa = Language(
        id: "bib", name: "Bissa", nativeName: "Bisa",
        flag: "🇧🇫", family: .nigerCongo, speakers: 50_000,
        countries: ["BF", "GH", "TG"], status: .endangered,
        isOfflineAvailable: true, hasVoiceSupport: false, hasLearningCourse: true
    )

    static let kru = Language(
        id: "kru", name: "Kru", nativeName: "Kru",
        flag: "🇱🇷", family: .nigerCongo, speakers: 30_000,
        countries: ["LR", "CI"], status: .critical,
        isOfflineAvailable: true, hasVoiceSupport: false, hasLearningCourse: true
    )

    static let dangme = Language(
        id: "dng", name: "Dangme", nativeName: "Dangme",
        flag: "🇬🇭", family: .nigerCongo, speakers: 20_000,
        countries: ["GH"], status: .critical,
        isOfflineAvailable: true, hasVoiceSupport: false, hasLearningCourse: true
    )

    static let soninke = Language(
        id: "snk", name: "Soninké", nativeName: "Sooninkanxanne",
        flag: "🇲🇱", family: .nigerCongo, speakers: 1_300_000,
        countries: ["ML", "SN", "MR"], status: .vulnerable,
        isOfflineAvailable: true, hasVoiceSupport: true, hasLearningCourse: true
    )

    static let allLanguages: [Language] = [
        .french, .english, .swahili, .yoruba, .wolof, .bambara, .dioula,
        .hausa, .igbo, .amharic, .zulu, .lingala, .kinyarwanda,
        .bissa, .kru, .dangme, .soninke
    ]

    static let africanLanguages: [Language] = allLanguages.filter { $0.id != "fra" && $0.id != "eng" }
    static let endangeredLanguages: [Language] = allLanguages.filter { $0.status == .endangered || $0.status == .critical }
}

enum LanguageFamily: String, Codable, CaseIterable {
    case indoEuropean = "Indo-européenne"
    case nigerCongo = "Niger-Congo"
    case afroAsiatic = "Afro-asiatique"
    case nilotic = "Nilotique"
    case khoisan = "Khoïsane"
    case austronesian = "Austronésienne"
}

enum LanguageStatus: String, Codable {
    case international = "Internationale"
    case lingua = "Langue Véhiculaire"
    case healthy = "Vitale"
    case vulnerable = "Vulnérable"
    case endangered = "Menacée"
    case critical = "Critique"
    case extinct = "Éteinte"

    var color: String {
        switch self {
        case .international, .lingua, .healthy: return "success"
        case .vulnerable: return "warning"
        case .endangered, .critical: return "error"
        case .extinct: return "secondaryText"
        }
    }

    var icon: String {
        switch self {
        case .international: return "globe"
        case .lingua: return "network"
        case .healthy: return "heart.fill"
        case .vulnerable: return "exclamationmark.triangle"
        case .endangered: return "exclamationmark.triangle.fill"
        case .critical: return "flame.fill"
        case .extinct: return "xmark.octagon"
        }
    }
}
