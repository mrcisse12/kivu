//
//  MultiPartyView.swift
//  Communication multi-participants temps réel — Feature #5
//

import SwiftUI

struct MultiPartyView: View {
    @State private var showNewMeeting = false

    var body: some View {
        ZStack {
            KivuColors.background.ignoresSafeArea()
            ScrollView {
                VStack(spacing: KivuSpacing.lg) {
                    FeaturePageHeader(
                        title: "Multi-Party",
                        subtitle: "Réunions en toutes les langues, simultanément",
                        icon: "person.3.fill",
                        color: KivuColors.multiPartyColor
                    )

                    NewMeetingCTA(showNewMeeting: $showNewMeeting)
                        .padding(.horizontal, KivuSpacing.lg)

                    ActiveMeetingCard()
                        .padding(.horizontal, KivuSpacing.lg)

                    UpcomingMeetings()
                        .padding(.horizontal, KivuSpacing.lg)

                    QuickTemplates()
                        .padding(.horizontal, KivuSpacing.lg)

                    Color.clear.frame(height: 100)
                }
                .padding(.top, KivuSpacing.md)
            }
        }
        .sheet(isPresented: $showNewMeeting) { MeetingSetupSheet() }
    }
}

struct NewMeetingCTA: View {
    @Binding var showNewMeeting: Bool
    var body: some View {
        HStack(spacing: KivuSpacing.sm) {
            Button { showNewMeeting = true } label: {
                VStack(spacing: KivuSpacing.xs) {
                    Image(systemName: "video.fill.badge.plus")
                        .font(.system(size: 24))
                    Text("Nouvelle réunion")
                        .font(KivuTypography.labelLarge)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, KivuSpacing.md)
                .background(KivuColors.multiPartyColor)
                .cornerRadius(KivuRadius.lg)
                .kivuSoftShadow()
            }
            Button {} label: {
                VStack(spacing: KivuSpacing.xs) {
                    Image(systemName: "link")
                        .font(.system(size: 24))
                    Text("Rejoindre")
                        .font(KivuTypography.labelLarge)
                }
                .foregroundColor(KivuColors.multiPartyColor)
                .frame(maxWidth: .infinity)
                .padding(.vertical, KivuSpacing.md)
                .background(KivuColors.multiPartyColor.opacity(0.12))
                .cornerRadius(KivuRadius.lg)
            }
        }
    }
}

struct ActiveMeetingCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            HStack {
                Circle().fill(KivuColors.success).frame(width: 10, height: 10)
                Text("EN COURS")
                    .font(KivuTypography.labelSmall)
                    .foregroundColor(KivuColors.success)
                Spacer()
                Text("04:23")
                    .font(KivuTypography.labelMedium)
                    .foregroundColor(KivuColors.secondaryText)
            }

            Text("Fusion Amani × Kivu")
                .font(KivuTypography.headlineMedium)
                .foregroundColor(KivuColors.primaryText)

            HStack(spacing: -12) {
                ParticipantAvatar(emoji: "👨🏾‍💼", language: "🇨🇮")
                ParticipantAvatar(emoji: "👩🏾‍💼", language: "🇸🇳")
                ParticipantAvatar(emoji: "🧑🏾‍💼", language: "🇰🇪")
                ParticipantAvatar(emoji: "👨🏿‍💼", language: "🇳🇬")
                Text("+3").font(KivuTypography.labelMedium).foregroundColor(.white)
                    .frame(width: 36, height: 36)
                    .background(KivuColors.secondaryText)
                    .clipShape(Circle())
                Spacer()
                Button {} label: {
                    Text("Rejoindre")
                        .font(KivuTypography.labelLarge)
                        .foregroundColor(.white)
                        .padding(.horizontal, KivuSpacing.md)
                        .padding(.vertical, KivuSpacing.xs)
                        .background(KivuColors.multiPartyColor)
                        .cornerRadius(KivuRadius.round)
                }
            }

            HStack(spacing: KivuSpacing.xs) {
                ForEach(["🇨🇮", "🇸🇳", "🇰🇪", "🇳🇬", "🇬🇭", "🇲🇱"], id: \.self) { flag in
                    Text(flag).font(.system(size: 18))
                }
                Spacer()
                Label("7 langues simultanées", systemImage: "globe")
                    .font(KivuTypography.labelSmall)
                    .foregroundColor(KivuColors.primary)
            }
        }
        .padding(KivuSpacing.lg)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.xl)
        .overlay(
            RoundedRectangle(cornerRadius: KivuRadius.xl)
                .stroke(KivuColors.success.opacity(0.3), lineWidth: 2)
        )
        .kivuSoftShadow()
    }
}

struct ParticipantAvatar: View {
    let emoji: String
    let language: String
    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Text(emoji)
                .font(.system(size: 24))
                .frame(width: 36, height: 36)
                .background(KivuColors.background)
                .clipShape(Circle())
                .overlay(Circle().stroke(Color.white, lineWidth: 2))
            Text(language)
                .font(.system(size: 12))
                .offset(x: 4, y: 4)
        }
    }
}

struct UpcomingMeetings: View {
    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            Text("Prochaines réunions")
                .font(KivuTypography.headlineLarge)
                .foregroundColor(KivuColors.primaryText)

            VStack(spacing: KivuSpacing.xs) {
                MeetingCell(title: "Conseil d'administration", time: "14:00", participants: 6, flags: ["🇨🇮","🇸🇳","🇰🇪"])
                MeetingCell(title: "Négociation fournisseur", time: "16:30", participants: 3, flags: ["🇲🇱","🇳🇪"])
                MeetingCell(title: "Consultation médicale", time: "Demain 09:00", participants: 2, flags: ["🇧🇫","🇫🇷"])
            }
        }
    }
}

struct MeetingCell: View {
    let title: String
    let time: String
    let participants: Int
    let flags: [String]

    var body: some View {
        HStack(spacing: KivuSpacing.md) {
            VStack {
                Text(time)
                    .font(KivuTypography.labelMedium)
                    .foregroundColor(KivuColors.multiPartyColor)
            }
            .frame(width: 70)
            .padding(.vertical, KivuSpacing.sm)
            .background(KivuColors.multiPartyColor.opacity(0.12))
            .cornerRadius(KivuRadius.md)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(KivuTypography.headlineSmall)
                    .foregroundColor(KivuColors.primaryText)
                HStack(spacing: 4) {
                    ForEach(flags, id: \.self) { Text($0) }
                    Text("·")
                    Text("\(participants) participants")
                        .font(KivuTypography.labelSmall)
                        .foregroundColor(KivuColors.secondaryText)
                }
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundColor(KivuColors.tertiaryText)
        }
        .padding(KivuSpacing.md)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.md)
        .kivuSoftShadow()
    }
}

struct QuickTemplates: View {
    let templates: [(String, String, Color)] = [
        ("Réunion business", "briefcase.fill", KivuColors.businessColor),
        ("Consultation médicale", "cross.case.fill", KivuColors.error),
        ("Négociation diplomatique", "globe.badge.chevron.backward", KivuColors.primary),
        ("Cours académique", "graduationcap.fill", KivuColors.accent)
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            Text("Modèles rapides")
                .font(KivuTypography.headlineLarge)
                .foregroundColor(KivuColors.primaryText)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: KivuSpacing.sm) {
                    ForEach(templates, id: \.0) { template in
                        VStack(alignment: .leading, spacing: KivuSpacing.sm) {
                            Image(systemName: template.1)
                                .foregroundColor(template.2)
                                .font(.system(size: 24))
                            Text(template.0)
                                .font(KivuTypography.headlineSmall)
                                .foregroundColor(KivuColors.primaryText)
                        }
                        .frame(width: 150, alignment: .leading)
                        .padding(KivuSpacing.md)
                        .background(KivuColors.surface)
                        .cornerRadius(KivuRadius.lg)
                        .kivuSoftShadow()
                    }
                }
            }
        }
    }
}

struct MeetingSetupSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var title: String = ""
    @State private var selectedLanguages: Set<String> = ["fra", "swa"]

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: KivuSpacing.lg) {
                    VStack(alignment: .leading, spacing: KivuSpacing.xs) {
                        Text("Titre de la réunion")
                            .font(KivuTypography.labelLarge)
                            .foregroundColor(KivuColors.secondaryText)
                        TextField("Ex: Fusion Amani × Kivu", text: $title)
                            .padding()
                            .background(KivuColors.background)
                            .cornerRadius(KivuRadius.md)
                    }

                    VStack(alignment: .leading, spacing: KivuSpacing.xs) {
                        Text("Langues actives")
                            .font(KivuTypography.labelLarge)
                            .foregroundColor(KivuColors.secondaryText)
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())]) {
                            ForEach(Language.allLanguages.prefix(8)) { lang in
                                Button {
                                    if selectedLanguages.contains(lang.id) { selectedLanguages.remove(lang.id) }
                                    else { selectedLanguages.insert(lang.id) }
                                } label: {
                                    HStack {
                                        Text(lang.flag)
                                        Text(lang.name)
                                            .font(KivuTypography.labelMedium)
                                        Spacer()
                                        if selectedLanguages.contains(lang.id) {
                                            Image(systemName: "checkmark.circle.fill")
                                                .foregroundColor(KivuColors.multiPartyColor)
                                        }
                                    }
                                    .foregroundColor(KivuColors.primaryText)
                                    .padding()
                                    .background(KivuColors.surface)
                                    .cornerRadius(KivuRadius.md)
                                }
                            }
                        }
                    }

                    Button {} label: {
                        Text("Lancer la réunion")
                            .font(KivuTypography.headlineMedium)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(KivuColors.multiPartyColor)
                            .cornerRadius(KivuRadius.lg)
                    }
                }
                .padding()
            }
            .background(KivuColors.background.ignoresSafeArea())
            .navigationTitle("Nouvelle réunion")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Fermer") { dismiss() }
                }
            }
        }
    }
}
