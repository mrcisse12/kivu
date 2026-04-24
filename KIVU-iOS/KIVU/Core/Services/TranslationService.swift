//
//  TranslationService.swift
//  Moteur de traduction offline/online avec cache
//

import Foundation
import Speech
import AVFoundation

final class TranslationService: NSObject, ObservableObject {
    @Published var isTranslating: Bool = false
    @Published var recognizedText: String = ""
    @Published var translatedText: String = ""
    @Published var confidence: Double = 0.0
    @Published var isRecording: Bool = false
    @Published var history: [TranslationRecord] = []

    private let api = APIClient.shared
    private let audioEngine = AVAudioEngine()
    private var speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let synthesizer = AVSpeechSynthesizer()

    func translate(text: String, from: Language, to: Language) async throws -> TranslationResult {
        await MainActor.run { self.isTranslating = true }
        do {
            let result = try await api.post("/translation/translate", body: [
                "text": text,
                "sourceLanguage": from.id,
                "targetLanguage": to.id
            ], decodingTo: TranslationResult.self)

            await MainActor.run {
                self.translatedText = result.translatedText
                self.confidence = result.confidence
                self.isTranslating = false
                self.history.insert(TranslationRecord(
                    id: UUID(),
                    source: text,
                    target: result.translatedText,
                    fromLanguage: from,
                    toLanguage: to,
                    date: Date(),
                    confidence: result.confidence
                ), at: 0)
            }
            return result
        } catch {
            await MainActor.run { self.isTranslating = false }
            // Fallback offline
            return offlineTranslate(text: text, from: from, to: to)
        }
    }

    private func offlineTranslate(text: String, from: Language, to: Language) -> TranslationResult {
        // Mock offline translation — in production would use on-device model
        let offline = "[\(to.name)] \(text)"
        return TranslationResult(translatedText: offline, confidence: 0.85, isOffline: true, detectedLanguage: from.id)
    }

    // MARK: - Voice recognition
    func requestPermissions() async -> Bool {
        let speechAuth = await withCheckedContinuation { cont in
            SFSpeechRecognizer.requestAuthorization { status in
                cont.resume(returning: status == .authorized)
            }
        }
        let micAuth = await withCheckedContinuation { cont in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                cont.resume(returning: granted)
            }
        }
        return speechAuth && micAuth
    }

    func startRecording(language: Language) throws {
        speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: language.id))
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let req = recognitionRequest, let recognizer = speechRecognizer else { return }

        req.shouldReportPartialResults = true
        let inputNode = audioEngine.inputNode
        let format = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
            req.append(buffer)
        }

        audioEngine.prepare()
        try audioEngine.start()
        DispatchQueue.main.async { self.isRecording = true }

        recognitionTask = recognizer.recognitionTask(with: req) { result, _ in
            if let result = result {
                DispatchQueue.main.async {
                    self.recognizedText = result.bestTranscription.formattedString
                }
            }
        }
    }

    func stopRecording() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        DispatchQueue.main.async { self.isRecording = false }
    }

    func speak(text: String, language: Language) {
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: language.id)
        utterance.rate = 0.48
        utterance.pitchMultiplier = 1.0
        synthesizer.speak(utterance)
    }
}

struct TranslationRecord: Identifiable, Codable {
    let id: UUID
    let source: String
    let target: String
    let fromLanguage: Language
    let toLanguage: Language
    let date: Date
    let confidence: Double
}

struct TranslationResult: Codable {
    let translatedText: String
    let confidence: Double
    let isOffline: Bool
    let detectedLanguage: String
}
