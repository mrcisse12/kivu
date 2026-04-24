//
//  PreservationService.swift
//  Archive culturelle — enregistrements, proverbes, histoires
//

import Foundation
import AVFoundation

final class PreservationService: NSObject, ObservableObject {
    @Published var archives: [CulturalArchive] = []
    @Published var isRecording: Bool = false
    @Published var currentRecordingURL: URL?
    @Published var totalArchivedLanguages: Int = 483
    @Published var totalContributors: Int = 127_000

    private var audioRecorder: AVAudioRecorder?
    private let api = APIClient.shared

    override init() {
        super.init()
        loadMockArchives()
    }

    func startRecording(for language: Language, title: String, category: CulturalArchive.Category) throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .default)
        try session.setActive(true)

        let url = FileManager.default.temporaryDirectory.appendingPathComponent("\(UUID().uuidString).m4a")
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44100,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]
        audioRecorder = try AVAudioRecorder(url: url, settings: settings)
        audioRecorder?.record()
        currentRecordingURL = url
        DispatchQueue.main.async { self.isRecording = true }
    }

    func stopRecording() {
        audioRecorder?.stop()
        audioRecorder = nil
        DispatchQueue.main.async { self.isRecording = false }
    }

    func uploadArchive(_ archive: CulturalArchive) async throws {
        _ = try await api.post("/preservation/archives", body: [
            "title": archive.title,
            "languageId": archive.language.id,
            "category": archive.category.rawValue,
            "duration": archive.duration,
            "transcription": archive.transcription ?? ""
        ], decodingTo: CulturalArchive.self)

        await MainActor.run {
            self.archives.insert(archive, at: 0)
        }
    }

    private func loadMockArchives() {
        archives = [
            CulturalArchive(
                id: "a1",
                title: "Contes Wolof — Mamie Awa",
                language: .wolof,
                category: .stories,
                duration: 2520,
                recordedDate: Date().addingTimeInterval(-86400 * 5),
                contributor: "Awa Diop (👵🏾)",
                transcription: "Ci jamono yu njëkk, bu xam-xam doon ame nite..."
            ),
            CulturalArchive(
                id: "a2",
                title: "Proverbes Bambara",
                language: .bambara,
                category: .proverbs,
                duration: 1680,
                recordedDate: Date().addingTimeInterval(-86400 * 12),
                contributor: "Ibrahim Koné (👨🏾‍🌾)",
                transcription: "Ni tiga farala, i bɛ n'a ɲini..."
            ),
            CulturalArchive(
                id: "a3",
                title: "Cérémonie du mariage Dioula",
                language: .dioula,
                category: .ceremonies,
                duration: 4620,
                recordedDate: Date().addingTimeInterval(-86400 * 30),
                contributor: "Chef de village — Sia",
                transcription: nil
            )
        ]
    }
}

struct CulturalArchive: Identifiable, Codable {
    let id: String
    let title: String
    let language: Language
    let category: Category
    let duration: TimeInterval
    let recordedDate: Date
    let contributor: String
    let transcription: String?

    enum Category: String, Codable, CaseIterable {
        case stories = "stories"
        case proverbs = "proverbs"
        case songs = "songs"
        case ceremonies = "ceremonies"
        case medicinal = "medicinal"
        case oralHistory = "oralHistory"

        var displayName: String {
            switch self {
            case .stories: return "Contes & Légendes"
            case .proverbs: return "Proverbes"
            case .songs: return "Chants & Musique"
            case .ceremonies: return "Cérémonies"
            case .medicinal: return "Savoir médicinal"
            case .oralHistory: return "Histoire orale"
            }
        }

        var icon: String {
            switch self {
            case .stories: return "book.closed.fill"
            case .proverbs: return "quote.bubble.fill"
            case .songs: return "music.note"
            case .ceremonies: return "hands.sparkles.fill"
            case .medicinal: return "leaf.fill"
            case .oralHistory: return "clock.arrow.circlepath"
            }
        }
    }
}
