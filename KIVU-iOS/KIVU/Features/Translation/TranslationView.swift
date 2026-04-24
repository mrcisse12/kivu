//
//  TranslationView.swift
//  Traduction vocale temps réel offline — Feature #1
//

import SwiftUI

struct TranslationView: View {
    @EnvironmentObject var translationService: TranslationService
    @State private var sourceLanguage: Language = .dioula
    @State private var targetLanguage: Language = .bambara
    @State private var inputText: String = ""
    @State private var translatedText: String = "Appuyez sur le microphone pour commencer..."
    @State private var isRecording: Bool = false
    @State private var mode: TranslationMode = .voice
    @State private var showLanguagePicker: Bool = false
    @State private var pickerTarget: LanguagePickerTarget = .source
    @State private var waveAmplitudes: [CGFloat] = Array(repeating: 0.3, count: 40)

    var body: some View {
        ZStack {
            KivuColors.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: KivuSpacing.lg) {
                    // Header
                    TranslationHeader()

                    // Mode Switcher
                    ModeSwitcherView(selectedMode: $mode)
                        .padding(.horizontal, KivuSpacing.lg)

                    // Language Swap
                    LanguageSelectorPair(
                        source: $sourceLanguage,
                        target: $targetLanguage,
                        onTapSource: { pickerTarget = .source; showLanguagePicker = true },
                        onTapTarget: { pickerTarget = .target; showLanguagePicker = true }
                    )
                    .padding(.horizontal, KivuSpacing.lg)

                    // Source Card
                    TranslationCard(
                        language: sourceLanguage,
                        text: inputText.isEmpty ? "Parlez ou écrivez ici..." : inputText,
                        isPlaceholder: inputText.isEmpty,
                        gradient: KivuColors.heroGradient,
                        isSource: true
                    )
                    .padding(.horizontal, KivuSpacing.lg)

                    // Mic Button
                    MicrophoneButton(isRecording: $isRecording, waveAmplitudes: $waveAmplitudes)

                    // Target Card
                    TranslationCard(
                        language: targetLanguage,
                        text: translatedText,
                        isPlaceholder: translatedText.contains("Appuyez"),
                        gradient: KivuColors.sunsetGradient,
                        isSource: false
                    )
                    .padding(.horizontal, KivuSpacing.lg)

                    // Offline & Privacy badges
                    FeatureBadgesRow()
                        .padding(.horizontal, KivuSpacing.lg)

                    // Recent Translations
                    RecentTranslationsSection()
                        .padding(.horizontal, KivuSpacing.lg)

                    Color.clear.frame(height: 120)
                }
                .padding(.top, KivuSpacing.md)
            }
        }
        .sheet(isPresented: $showLanguagePicker) {
            LanguagePickerSheet(
                selected: pickerTarget == .source ? $sourceLanguage : $targetLanguage,
                title: pickerTarget == .source ? "Langue source" : "Langue cible"
            )
        }
    }
}

enum TranslationMode: String, CaseIterable {
    case voice = "Vocale"
    case text = "Texte"
    case camera = "Caméra"
    case conversation = "Discussion"

    var icon: String {
        switch self {
        case .voice: return "mic.fill"
        case .text: return "text.bubble.fill"
        case .camera: return "camera.fill"
        case .conversation: return "bubble.left.and.bubble.right.fill"
        }
    }
}

enum LanguagePickerTarget { case source, target }

struct TranslationHeader: View {
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Traduction")
                    .font(KivuTypography.displaySmall)
                    .foregroundColor(KivuColors.primaryText)
                Text("2000+ langues, même hors-ligne")
                    .font(KivuTypography.bodySmall)
                    .foregroundColor(KivuColors.secondaryText)
            }
            Spacer()
            Button {} label: {
                Image(systemName: "ellipsis.circle.fill")
                    .font(.system(size: 28))
                    .foregroundColor(KivuColors.primary)
            }
        }
        .padding(.horizontal, KivuSpacing.lg)
    }
}

struct ModeSwitcherView: View {
    @Binding var selectedMode: TranslationMode

    var body: some View {
        HStack(spacing: KivuSpacing.xs) {
            ForEach(TranslationMode.allCases, id: \.self) { mode in
                Button(action: {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                        selectedMode = mode
                    }
                }) {
                    VStack(spacing: 4) {
                        Image(systemName: mode.icon)
                            .font(.system(size: 16, weight: .semibold))
                        Text(mode.rawValue)
                            .font(KivuTypography.labelSmall)
                    }
                    .foregroundColor(selectedMode == mode ? .white : KivuColors.secondaryText)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, KivuSpacing.sm)
                    .background(
                        ZStack {
                            if selectedMode == mode {
                                KivuColors.heroGradient
                                    .cornerRadius(KivuRadius.md)
                            }
                        }
                    )
                }
            }
        }
        .padding(KivuSpacing.xs)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.lg)
        .kivuSoftShadow()
    }
}

struct LanguageSelectorPair: View {
    @Binding var source: Language
    @Binding var target: Language
    let onTapSource: () -> Void
    let onTapTarget: () -> Void

    var body: some View {
        HStack(spacing: KivuSpacing.xs) {
            LanguagePill(language: source, label: "De", action: onTapSource)
            Button {
                withAnimation(.spring()) {
                    let temp = source
                    source = target
                    target = temp
                }
            } label: {
                Image(systemName: "arrow.left.arrow.right")
                    .foregroundColor(.white)
                    .font(.system(size: 16, weight: .bold))
                    .frame(width: 44, height: 44)
                    .background(KivuColors.primary)
                    .clipShape(Circle())
                    .kivuSoftShadow()
            }
            LanguagePill(language: target, label: "Vers", action: onTapTarget)
        }
    }
}

struct LanguagePill: View {
    let language: Language
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: KivuSpacing.xs) {
                Text(language.flag)
                    .font(.system(size: 24))
                VStack(alignment: .leading, spacing: 0) {
                    Text(label)
                        .font(KivuTypography.labelSmall)
                        .foregroundColor(KivuColors.secondaryText)
                    Text(language.name)
                        .font(KivuTypography.headlineSmall)
                        .foregroundColor(KivuColors.primaryText)
                }
                Spacer()
                Image(systemName: "chevron.down")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(KivuColors.secondaryText)
            }
            .padding(.horizontal, KivuSpacing.md)
            .padding(.vertical, KivuSpacing.sm)
            .frame(maxWidth: .infinity)
            .background(KivuColors.surface)
            .cornerRadius(KivuRadius.lg)
            .kivuSoftShadow()
        }
        .buttonStyle(.plain)
    }
}

struct TranslationCard: View {
    let language: Language
    let text: String
    let isPlaceholder: Bool
    let gradient: LinearGradient
    let isSource: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            HStack {
                Text(language.flag)
                Text(language.name)
                    .font(KivuTypography.labelLarge)
                    .foregroundColor(KivuColors.secondaryText)
                Spacer()
                HStack(spacing: KivuSpacing.sm) {
                    Button { } label: {
                        Image(systemName: "speaker.wave.2.fill")
                            .foregroundColor(KivuColors.primary)
                    }
                    Button { } label: {
                        Image(systemName: "doc.on.doc")
                            .foregroundColor(KivuColors.primary)
                    }
                    Button { } label: {
                        Image(systemName: "square.and.arrow.up")
                            .foregroundColor(KivuColors.primary)
                    }
                }
            }

            Text(text)
                .font(KivuTypography.headlineMedium)
                .foregroundColor(isPlaceholder ? KivuColors.tertiaryText : KivuColors.primaryText)
                .lineSpacing(6)
                .frame(maxWidth: .infinity, alignment: .leading)

            if !isSource {
                HStack(spacing: KivuSpacing.xs) {
                    BadgeChip(text: "95% confiance", icon: "checkmark.seal.fill", color: KivuColors.success)
                    BadgeChip(text: "Hors-ligne", icon: "wifi.slash", color: KivuColors.primary)
                    Spacer()
                }
            }
        }
        .padding(KivuSpacing.lg)
        .background(
            RoundedRectangle(cornerRadius: KivuRadius.lg)
                .fill(KivuColors.surface)
                .overlay(
                    RoundedRectangle(cornerRadius: KivuRadius.lg)
                        .stroke(gradient, lineWidth: 2)
                        .opacity(0.3)
                )
        )
        .kivuSoftShadow()
    }
}

struct BadgeChip: View {
    let text: String
    let icon: String
    let color: Color

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 10))
            Text(text)
                .font(KivuTypography.labelSmall)
        }
        .foregroundColor(color)
        .padding(.horizontal, KivuSpacing.sm)
        .padding(.vertical, 4)
        .background(color.opacity(0.1))
        .cornerRadius(KivuRadius.round)
    }
}

struct MicrophoneButton: View {
    @Binding var isRecording: Bool
    @Binding var waveAmplitudes: [CGFloat]
    let timer = Timer.publish(every: 0.1, on: .main, in: .common).autoconnect()

    var body: some View {
        VStack(spacing: KivuSpacing.md) {
            ZStack {
                // Ripple animations
                ForEach(0..<3) { i in
                    Circle()
                        .stroke(KivuColors.primary.opacity(0.3), lineWidth: 2)
                        .frame(width: 120 + CGFloat(i * 20), height: 120 + CGFloat(i * 20))
                        .scaleEffect(isRecording ? 1.2 : 1)
                        .opacity(isRecording ? 0 : 1)
                        .animation(
                            isRecording ?
                                .easeOut(duration: 1.5).repeatForever(autoreverses: false).delay(Double(i) * 0.3) :
                                .default,
                            value: isRecording
                        )
                }

                // Wave visualizer
                if isRecording {
                    HStack(spacing: 2) {
                        ForEach(0..<waveAmplitudes.count, id: \.self) { i in
                            Capsule()
                                .fill(KivuColors.sunsetGradient)
                                .frame(width: 3, height: waveAmplitudes[i] * 40)
                                .animation(.easeInOut(duration: 0.15), value: waveAmplitudes[i])
                        }
                    }
                    .frame(width: 200)
                }

                Button(action: toggleRecording) {
                    ZStack {
                        Circle()
                            .fill(isRecording ? KivuColors.sunsetGradient : KivuColors.heroGradient)
                            .frame(width: 88, height: 88)
                            .kivuMediumShadow()
                        Image(systemName: isRecording ? "stop.fill" : "mic.fill")
                            .foregroundColor(.white)
                            .font(.system(size: 34, weight: .bold))
                    }
                }
                .scaleEffect(isRecording ? 1.1 : 1)
                .animation(.spring(response: 0.4, dampingFraction: 0.5), value: isRecording)
            }
            .frame(height: 180)

            Text(isRecording ? "Écoute en cours..." : "Appuyez pour parler")
                .font(KivuTypography.labelLarge)
                .foregroundColor(KivuColors.secondaryText)
        }
        .onReceive(timer) { _ in
            if isRecording {
                waveAmplitudes = waveAmplitudes.map { _ in CGFloat.random(in: 0.2...1.0) }
            }
        }
    }

    private func toggleRecording() {
        withAnimation(.spring()) {
            isRecording.toggle()
        }
    }
}

struct FeatureBadgesRow: View {
    var body: some View {
        HStack(spacing: KivuSpacing.sm) {
            MiniBadge(icon: "wifi.slash", text: "Hors-ligne", color: KivuColors.primary)
            MiniBadge(icon: "lock.shield.fill", text: "E2E chiffré", color: KivuColors.success)
            MiniBadge(icon: "bolt.fill", text: "< 200 ms", color: KivuColors.accent)
        }
    }
}

struct MiniBadge: View {
    let icon: String
    let text: String
    let color: Color

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 12))
            Text(text)
                .font(KivuTypography.labelMedium)
        }
        .foregroundColor(color)
        .padding(.horizontal, KivuSpacing.md)
        .padding(.vertical, KivuSpacing.xs)
        .frame(maxWidth: .infinity)
        .background(color.opacity(0.12))
        .cornerRadius(KivuRadius.round)
    }
}

struct RecentTranslationsSection: View {
    let recent: [RecentTranslation] = [
        RecentTranslation(source: "Ça va mon ami ?", target: "I ka kɛnɛ, n teri?", from: Language.french, to: Language.bambara, time: "à l'instant"),
        RecentTranslation(source: "Combien coûte ce fruit ?", target: "Joli foli yen ka jigi fili ?", from: Language.french, to: Language.dioula, time: "il y a 5 min"),
        RecentTranslation(source: "Bon voyage", target: "Safari njema", from: Language.french, to: Language.swahili, time: "hier")
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            HStack {
                Text("Traductions récentes")
                    .font(KivuTypography.headlineLarge)
                    .foregroundColor(KivuColors.primaryText)
                Spacer()
                Button("Tout voir") {}
                    .font(KivuTypography.labelMedium)
                    .foregroundColor(KivuColors.primary)
            }

            VStack(spacing: KivuSpacing.xs) {
                ForEach(recent) { item in
                    RecentTranslationRow(item: item)
                }
            }
        }
    }
}

struct RecentTranslation: Identifiable {
    let id = UUID()
    let source: String
    let target: String
    let from: Language
    let to: Language
    let time: String
}

struct RecentTranslationRow: View {
    let item: RecentTranslation

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.xs) {
            HStack(spacing: 4) {
                Text(item.from.flag)
                Image(systemName: "arrow.right")
                    .font(.system(size: 10))
                    .foregroundColor(KivuColors.tertiaryText)
                Text(item.to.flag)
                Spacer()
                Text(item.time)
                    .font(KivuTypography.labelSmall)
                    .foregroundColor(KivuColors.tertiaryText)
            }
            Text(item.source)
                .font(KivuTypography.bodyMedium)
                .foregroundColor(KivuColors.secondaryText)
            Text(item.target)
                .font(KivuTypography.headlineSmall)
                .foregroundColor(KivuColors.primaryText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(KivuSpacing.md)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.md)
        .kivuSoftShadow()
    }
}

struct LanguagePickerSheet: View {
    @Binding var selected: Language
    let title: String
    @Environment(\.dismiss) private var dismiss
    @State private var searchText: String = ""

    var filteredLanguages: [Language] {
        if searchText.isEmpty { return Language.allLanguages }
        return Language.allLanguages.filter {
            $0.name.localizedCaseInsensitiveContains(searchText) ||
            $0.nativeName.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                HStack(spacing: KivuSpacing.xs) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(KivuColors.secondaryText)
                    TextField("Rechercher une langue...", text: $searchText)
                        .font(KivuTypography.bodyMedium)
                }
                .padding(KivuSpacing.md)
                .background(KivuColors.background)
                .cornerRadius(KivuRadius.md)
                .padding()

                ScrollView {
                    LazyVStack(spacing: KivuSpacing.xs) {
                        ForEach(filteredLanguages) { lang in
                            Button {
                                selected = lang
                                dismiss()
                            } label: {
                                HStack {
                                    Text(lang.flag).font(.system(size: 30))
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(lang.name)
                                            .font(KivuTypography.headlineSmall)
                                            .foregroundColor(KivuColors.primaryText)
                                        Text(lang.nativeName)
                                            .font(KivuTypography.bodySmall)
                                            .foregroundColor(KivuColors.secondaryText)
                                    }
                                    Spacer()
                                    if lang.id == selected.id {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(KivuColors.primary)
                                    }
                                }
                                .padding(KivuSpacing.md)
                                .background(KivuColors.surface)
                                .cornerRadius(KivuRadius.md)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal)
                }
            }
            .background(KivuColors.background)
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Fermer") { dismiss() }
                }
            }
        }
    }
}
