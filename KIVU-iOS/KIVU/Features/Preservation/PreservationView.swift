//
//  PreservationView.swift
//  Préservation culturelle — Feature #3 (Mission Sacrée)
//

import SwiftUI

struct PreservationView: View {
    @EnvironmentObject var preservationService: PreservationService
    @State private var showRecorder: Bool = false

    var body: some View {
        ZStack {
            KivuColors.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: KivuSpacing.lg) {
                    PreservationHeader()
                    MissionStatementCard()
                        .padding(.horizontal, KivuSpacing.lg)
                    RecordCTACard(showRecorder: $showRecorder)
                        .padding(.horizontal, KivuSpacing.lg)
                    ArchiveCategoriesGrid()
                        .padding(.horizontal, KivuSpacing.lg)
                    EndangeredListSection()
                        .padding(.horizontal, KivuSpacing.lg)
                    FamilyArchiveSection()
                        .padding(.horizontal, KivuSpacing.lg)

                    Color.clear.frame(height: 100)
                }
                .padding(.top, KivuSpacing.md)
            }
        }
        .sheet(isPresented: $showRecorder) {
            RecorderSheet()
        }
    }
}

struct PreservationHeader: View {
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Préservation")
                    .font(KivuTypography.displaySmall)
                    .foregroundColor(KivuColors.primaryText)
                Text("L'héritage de l'humanité, éternel")
                    .font(KivuTypography.bodySmall)
                    .foregroundColor(KivuColors.secondaryText)
            }
            Spacer()
        }
        .padding(.horizontal, KivuSpacing.lg)
    }
}

struct MissionStatementCard: View {
    var body: some View {
        ZStack {
            KivuColors.royalGradient.cornerRadius(KivuRadius.xl)

            VStack(alignment: .leading, spacing: KivuSpacing.md) {
                HStack {
                    Image(systemName: "shield.checkerboard")
                        .foregroundColor(.white)
                    Text("Mission sacrée")
                        .font(KivuTypography.labelLarge)
                        .foregroundColor(.white.opacity(0.9))
                    Spacer()
                }

                Text("483 langues sauvegardées")
                    .font(KivuTypography.displaySmall)
                    .foregroundColor(.white)

                Text("Grâce à 127 000 contributeurs à travers le monde.\nChaque voix compte. Chaque mot est précieux.")
                    .font(KivuTypography.bodyMedium)
                    .foregroundColor(.white.opacity(0.9))

                HStack(spacing: KivuSpacing.md) {
                    MissionStat(value: "1 247", label: "heures d'audio")
                    MissionStat(value: "84K", label: "mots archivés")
                    MissionStat(value: "317", label: "proverbes")
                }
            }
            .padding(KivuSpacing.lg)
        }
        .kivuMediumShadow()
    }
}

struct MissionStat: View {
    let value: String
    let label: String
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value)
                .font(KivuTypography.headlineMedium)
                .foregroundColor(.white)
            Text(label)
                .font(KivuTypography.labelSmall)
                .foregroundColor(.white.opacity(0.85))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct RecordCTACard: View {
    @Binding var showRecorder: Bool

    var body: some View {
        Button { showRecorder = true } label: {
            HStack(spacing: KivuSpacing.md) {
                ZStack {
                    Circle()
                        .fill(KivuColors.tertiary)
                        .frame(width: 60, height: 60)
                    Image(systemName: "mic.badge.plus")
                        .foregroundColor(.white)
                        .font(.system(size: 26, weight: .semibold))
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text("Enregistrer ma langue")
                        .font(KivuTypography.headlineMedium)
                        .foregroundColor(KivuColors.primaryText)
                    Text("Partagez histoires, proverbes, chansons")
                        .font(KivuTypography.bodySmall)
                        .foregroundColor(KivuColors.secondaryText)
                }
                Spacer()
                Image(systemName: "arrow.right.circle.fill")
                    .foregroundColor(KivuColors.tertiary)
                    .font(.system(size: 28))
            }
            .padding(KivuSpacing.md)
            .background(KivuColors.surface)
            .cornerRadius(KivuRadius.lg)
            .kivuSoftShadow()
        }
        .buttonStyle(.plain)
    }
}

struct ArchiveCategoriesGrid: View {
    let categories: [ArchiveCategory] = [
        ArchiveCategory(title: "Contes & Légendes", icon: "book.closed.fill", count: 1_247, color: KivuColors.primary),
        ArchiveCategory(title: "Proverbes", icon: "quote.bubble.fill", count: 847, color: KivuColors.tertiary),
        ArchiveCategory(title: "Chants & Musique", icon: "music.note", count: 523, color: KivuColors.accent),
        ArchiveCategory(title: "Cérémonies", icon: "hands.sparkles.fill", count: 234, color: KivuColors.secondary),
        ArchiveCategory(title: "Savoir médicinal", icon: "leaf.fill", count: 156, color: KivuColors.success),
        ArchiveCategory(title: "Histoire orale", icon: "clock.arrow.circlepath", count: 412, color: KivuColors.info)
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            Text("Archives culturelles")
                .font(KivuTypography.headlineLarge)
                .foregroundColor(KivuColors.primaryText)

            LazyVGrid(columns: [
                GridItem(.flexible(), spacing: KivuSpacing.sm),
                GridItem(.flexible(), spacing: KivuSpacing.sm)
            ], spacing: KivuSpacing.sm) {
                ForEach(categories) { cat in
                    ArchiveCategoryTile(category: cat)
                }
            }
        }
    }
}

struct ArchiveCategory: Identifiable {
    let id = UUID()
    let title: String
    let icon: String
    let count: Int
    let color: Color
}

struct ArchiveCategoryTile: View {
    let category: ArchiveCategory

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.sm) {
            ZStack {
                Circle()
                    .fill(category.color.opacity(0.15))
                    .frame(width: 44, height: 44)
                Image(systemName: category.icon)
                    .foregroundColor(category.color)
                    .font(.system(size: 20, weight: .semibold))
            }
            Text(category.title)
                .font(KivuTypography.headlineSmall)
                .foregroundColor(KivuColors.primaryText)
            Text("\(category.count) contributions")
                .font(KivuTypography.labelSmall)
                .foregroundColor(KivuColors.secondaryText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(KivuSpacing.md)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.lg)
        .kivuSoftShadow()
    }
}

struct EndangeredListSection: View {
    let endangered = Language.endangeredLanguages

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            HStack {
                Text("Langues en péril")
                    .font(KivuTypography.headlineLarge)
                    .foregroundColor(KivuColors.primaryText)
                Spacer()
                Text("\(endangered.count)")
                    .font(KivuTypography.labelMedium)
                    .foregroundColor(.white)
                    .padding(.horizontal, KivuSpacing.xs)
                    .padding(.vertical, 2)
                    .background(KivuColors.error)
                    .cornerRadius(KivuRadius.round)
            }

            VStack(spacing: KivuSpacing.xs) {
                ForEach(endangered) { lang in
                    EndangeredLanguageRow(language: lang)
                }
            }
        }
    }
}

struct EndangeredLanguageRow: View {
    let language: Language

    var body: some View {
        HStack(spacing: KivuSpacing.md) {
            ZStack {
                Circle().fill(KivuColors.error.opacity(0.1))
                    .frame(width: 48, height: 48)
                Text(language.flag).font(.system(size: 24))
            }
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(language.name)
                        .font(KivuTypography.headlineSmall)
                        .foregroundColor(KivuColors.primaryText)
                    Text("·").foregroundColor(KivuColors.tertiaryText)
                    Text(language.nativeName)
                        .font(KivuTypography.bodySmall)
                        .foregroundColor(KivuColors.secondaryText)
                }
                HStack(spacing: 6) {
                    Image(systemName: language.status.icon)
                        .font(.system(size: 10))
                    Text(language.status.rawValue)
                        .font(KivuTypography.labelSmall)
                }
                .foregroundColor(KivuColors.error)
            }
            Spacer()
            Button {} label: {
                Image(systemName: "plus.circle.fill")
                    .foregroundColor(KivuColors.tertiary)
                    .font(.system(size: 28))
            }
        }
        .padding(KivuSpacing.md)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.md)
        .kivuSoftShadow()
    }
}

struct FamilyArchiveSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            Text("Mon archive familiale")
                .font(KivuTypography.headlineLarge)
                .foregroundColor(KivuColors.primaryText)

            VStack(spacing: KivuSpacing.sm) {
                FamilyRecordRow(
                    icon: "👵🏾",
                    title: "Grand-mère Awa — Contes Wolof",
                    duration: "42 min",
                    date: "15 mars 2026"
                )
                FamilyRecordRow(
                    icon: "👴🏾",
                    title: "Grand-père Moussa — Histoire du village",
                    duration: "1h 17min",
                    date: "2 février 2026"
                )
                FamilyRecordRow(
                    icon: "👨🏾‍🌾",
                    title: "Oncle Ibrahim — Proverbes Bambara",
                    duration: "28 min",
                    date: "12 janvier 2026"
                )
            }
        }
    }
}

struct FamilyRecordRow: View {
    let icon: String
    let title: String
    let duration: String
    let date: String

    var body: some View {
        HStack(spacing: KivuSpacing.sm) {
            ZStack {
                Circle().fill(KivuColors.tertiary.opacity(0.15))
                    .frame(width: 48, height: 48)
                Text(icon).font(.system(size: 26))
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(KivuTypography.headlineSmall)
                    .foregroundColor(KivuColors.primaryText)
                    .lineLimit(1)
                HStack(spacing: 6) {
                    Label(duration, systemImage: "clock.fill")
                    Text("·")
                    Text(date)
                }
                .font(KivuTypography.labelSmall)
                .foregroundColor(KivuColors.secondaryText)
            }
            Spacer()
            Button {} label: {
                Image(systemName: "play.circle.fill")
                    .foregroundColor(KivuColors.tertiary)
                    .font(.system(size: 34))
            }
        }
        .padding(KivuSpacing.md)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.md)
        .kivuSoftShadow()
    }
}

struct RecorderSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var isRecording: Bool = false
    @State private var recordingTime: TimeInterval = 0
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        ZStack {
            KivuColors.royalGradient.ignoresSafeArea()

            VStack(spacing: KivuSpacing.xl) {
                HStack {
                    Button("Annuler") { dismiss() }
                        .foregroundColor(.white)
                    Spacer()
                    Text("Enregistrement")
                        .font(KivuTypography.headlineMedium)
                        .foregroundColor(.white)
                    Spacer()
                    Button("Sauvegarder") {}
                        .foregroundColor(.white)
                        .fontWeight(.bold)
                }
                .padding()

                Spacer()

                VStack(spacing: KivuSpacing.lg) {
                    Text(timeString(from: recordingTime))
                        .font(.system(size: 64, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)

                    ZStack {
                        ForEach(0..<3) { i in
                            Circle()
                                .stroke(Color.white.opacity(0.3), lineWidth: 2)
                                .frame(width: 180 + CGFloat(i * 30))
                                .scaleEffect(isRecording ? 1.3 : 1)
                                .opacity(isRecording ? 0 : 1)
                                .animation(
                                    isRecording ?
                                        .easeOut(duration: 2).repeatForever(autoreverses: false).delay(Double(i) * 0.5) :
                                        .default,
                                    value: isRecording
                                )
                        }
                        Button { isRecording.toggle() } label: {
                            ZStack {
                                Circle().fill(Color.white).frame(width: 120, height: 120)
                                Image(systemName: isRecording ? "stop.fill" : "mic.fill")
                                    .foregroundColor(KivuColors.tertiary)
                                    .font(.system(size: 50))
                            }
                            .kivuStrongShadow()
                        }
                    }

                    Text(isRecording ? "Enregistrement en cours..." : "Appuyez pour commencer")
                        .font(KivuTypography.bodyLarge)
                        .foregroundColor(.white.opacity(0.9))
                }

                Spacer()

                VStack(spacing: KivuSpacing.xs) {
                    Text("KIVU transcrira automatiquement")
                        .font(KivuTypography.labelMedium)
                        .foregroundColor(.white.opacity(0.9))
                    Text("et traduira en 50+ langues")
                        .font(KivuTypography.labelSmall)
                        .foregroundColor(.white.opacity(0.7))
                }
                .padding(.bottom, KivuSpacing.xxl)
            }
        }
        .onReceive(timer) { _ in
            if isRecording { recordingTime += 1 }
        }
    }

    private func timeString(from t: TimeInterval) -> String {
        let m = Int(t) / 60
        let s = Int(t) % 60
        return String(format: "%02d:%02d", m, s)
    }
}
