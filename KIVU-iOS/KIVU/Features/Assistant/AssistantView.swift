//
//  AssistantView.swift
//  Assistant IA personnel — Feature #6
//

import SwiftUI

struct AssistantView: View {
    @State private var messageText: String = ""
    @State private var messages: [AssistantMessage] = [
        AssistantMessage(content: "Bonjour Amadou ! Prêt pour ta leçon du jour ? Aujourd'hui on va apprendre à marchander en Haussa.", fromAssistant: true),
        AssistantMessage(content: "Oui, je vais au marché plus tard", fromAssistant: false),
        AssistantMessage(content: "Parfait ! Commençons par le vocabulaire essentiel. En Haussa, 'combien ça coûte?' se dit 'Nawa ne?'. Essayez de répéter.", fromAssistant: true)
    ]

    var body: some View {
        ZStack {
            KivuColors.background.ignoresSafeArea()
            VStack(spacing: 0) {
                FeaturePageHeader(
                    title: "Assistant",
                    subtitle: "Ton tuteur IA qui t'apprend en vivant",
                    icon: "sparkles",
                    color: KivuColors.assistantColor
                )

                ContextBar()
                    .padding(.horizontal, KivuSpacing.lg)
                    .padding(.top, KivuSpacing.xs)

                ScrollView {
                    VStack(spacing: KivuSpacing.sm) {
                        ForEach(messages) { msg in
                            MessageBubble(message: msg)
                        }
                    }
                    .padding(.horizontal, KivuSpacing.lg)
                    .padding(.vertical, KivuSpacing.md)
                }

                SuggestedPrompts()
                    .padding(.horizontal, KivuSpacing.lg)
                    .padding(.vertical, KivuSpacing.xs)

                ChatInputBar(text: $messageText, onSend: sendMessage)
                    .padding(.horizontal, KivuSpacing.lg)
                    .padding(.bottom, KivuSpacing.xxl + KivuSpacing.lg)
            }
        }
    }

    private func sendMessage() {
        guard !messageText.isEmpty else { return }
        messages.append(AssistantMessage(content: messageText, fromAssistant: false))
        messageText = ""
        // Simulated assistant reply
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            messages.append(AssistantMessage(content: "Excellent ! Essayons maintenant avec un fruit : 'Yaya ne mangoro?' (Combien coûte la mangue?)", fromAssistant: true))
        }
    }
}

struct AssistantMessage: Identifiable {
    let id = UUID()
    let content: String
    let fromAssistant: Bool
}

struct ContextBar: View {
    var body: some View {
        HStack(spacing: KivuSpacing.sm) {
            ContextChip(icon: "location.fill", text: "Marché proche", color: KivuColors.accent)
            ContextChip(icon: "book.fill", text: "Haussa niv.3", color: KivuColors.primary)
            ContextChip(icon: "flame.fill", text: "12j série", color: KivuColors.error)
        }
    }
}

struct ContextChip: View {
    let icon: String
    let text: String
    let color: Color
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 10))
            Text(text).font(KivuTypography.labelSmall)
        }
        .foregroundColor(color)
        .padding(.horizontal, KivuSpacing.sm)
        .padding(.vertical, 6)
        .background(color.opacity(0.12))
        .cornerRadius(KivuRadius.round)
    }
}

struct MessageBubble: View {
    let message: AssistantMessage
    var body: some View {
        HStack {
            if message.fromAssistant {
                ZStack {
                    Circle().fill(KivuColors.assistantColor.opacity(0.2)).frame(width: 34, height: 34)
                    Image(systemName: "sparkles").foregroundColor(KivuColors.assistantColor)
                }
            } else { Spacer(minLength: 40) }

            Text(message.content)
                .font(KivuTypography.bodyMedium)
                .foregroundColor(message.fromAssistant ? KivuColors.primaryText : .white)
                .padding(KivuSpacing.md)
                .background(
                    message.fromAssistant ?
                    AnyView(KivuColors.surface) :
                    AnyView(KivuColors.heroGradient)
                )
                .cornerRadius(KivuRadius.lg)
                .kivuSoftShadow()

            if !message.fromAssistant {
                Text("🧑🏾")
                    .font(.system(size: 28))
            } else { Spacer(minLength: 40) }
        }
    }
}

struct SuggestedPrompts: View {
    let prompts: [String] = [
        "Leçon du jour",
        "Parler au marché",
        "Politesse de base",
        "Chiffres"
    ]
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: KivuSpacing.xs) {
                ForEach(prompts, id: \.self) { prompt in
                    Button {} label: {
                        Text(prompt)
                            .font(KivuTypography.labelMedium)
                            .foregroundColor(KivuColors.assistantColor)
                            .padding(.horizontal, KivuSpacing.md)
                            .padding(.vertical, KivuSpacing.xs)
                            .background(KivuColors.assistantColor.opacity(0.12))
                            .cornerRadius(KivuRadius.round)
                    }
                }
            }
        }
    }
}

struct ChatInputBar: View {
    @Binding var text: String
    let onSend: () -> Void

    var body: some View {
        HStack(spacing: KivuSpacing.sm) {
            Button {} label: {
                Image(systemName: "mic.fill")
                    .foregroundColor(KivuColors.assistantColor)
                    .font(.system(size: 18))
                    .frame(width: 40, height: 40)
                    .background(KivuColors.assistantColor.opacity(0.15))
                    .clipShape(Circle())
            }
            TextField("Écris à ton tuteur...", text: $text)
                .padding(.horizontal, KivuSpacing.md)
                .padding(.vertical, KivuSpacing.sm)
                .background(KivuColors.surface)
                .cornerRadius(KivuRadius.round)
                .kivuSoftShadow()
            Button(action: onSend) {
                Image(systemName: "paperplane.fill")
                    .foregroundColor(.white)
                    .frame(width: 40, height: 40)
                    .background(KivuColors.assistantColor)
                    .clipShape(Circle())
            }
        }
    }
}
