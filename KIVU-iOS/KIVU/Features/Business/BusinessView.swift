//
//  BusinessView.swift
//  Commerce multilingue — Feature #4
//

import SwiftUI

struct BusinessView: View {
    var body: some View {
        ZStack {
            KivuColors.background.ignoresSafeArea()
            ScrollView {
                VStack(spacing: KivuSpacing.lg) {
                    FeaturePageHeader(
                        title: "Business",
                        subtitle: "Commerce sans frontières linguistiques",
                        icon: "briefcase.fill",
                        color: KivuColors.businessColor
                    )

                    BusinessHeroCard()
                        .padding(.horizontal, KivuSpacing.lg)

                    B2BServicesGrid()
                        .padding(.horizontal, KivuSpacing.lg)

                    MarketplaceSection()
                        .padding(.horizontal, KivuSpacing.lg)

                    ContractsSection()
                        .padding(.horizontal, KivuSpacing.lg)

                    Color.clear.frame(height: 100)
                }
                .padding(.top, KivuSpacing.md)
            }
        }
    }
}

struct FeaturePageHeader: View {
    let title: String
    let subtitle: String
    let icon: String
    let color: Color

    var body: some View {
        HStack(spacing: KivuSpacing.md) {
            ZStack {
                Circle().fill(color.opacity(0.15)).frame(width: 56, height: 56)
                Image(systemName: icon).foregroundColor(color).font(.system(size: 24, weight: .semibold))
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(KivuTypography.displaySmall)
                    .foregroundColor(KivuColors.primaryText)
                Text(subtitle)
                    .font(KivuTypography.bodySmall)
                    .foregroundColor(KivuColors.secondaryText)
            }
            Spacer()
        }
        .padding(.horizontal, KivuSpacing.lg)
    }
}

struct BusinessHeroCard: View {
    var body: some View {
        ZStack {
            KivuColors.savannaGradient.cornerRadius(KivuRadius.xl)
            VStack(alignment: .leading, spacing: KivuSpacing.md) {
                Text("Déverrouillez le commerce africain")
                    .font(KivuTypography.headlineLarge)
                    .foregroundColor(.white)
                Text("$200B/an d'opportunités perdues à cause des barrières linguistiques. KIVU les libère.")
                    .font(KivuTypography.bodyMedium)
                    .foregroundColor(.white.opacity(0.9))

                HStack(spacing: KivuSpacing.md) {
                    HeroStat(value: "+$5B", label: "Commerce année 1")
                    HeroStat(value: "54", label: "Pays couverts")
                    HeroStat(value: "500K", label: "Entreprises")
                }
            }
            .padding(KivuSpacing.lg)
        }
        .kivuSoftShadow()
    }
}

struct HeroStat: View {
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

struct B2BServicesGrid: View {
    let services: [B2BService] = [
        B2BService(title: "Négociation en direct", icon: "bubble.left.and.bubble.right.fill", color: KivuColors.primary, description: "Multi-participants traduits"),
        B2BService(title: "Contrats traduits", icon: "doc.text.fill", color: KivuColors.secondary, description: "Documents légaux"),
        B2BService(title: "Service client", icon: "headphones", color: KivuColors.accent, description: "Support 200+ langues"),
        B2BService(title: "Marketing localisé", icon: "megaphone.fill", color: KivuColors.tertiary, description: "Campagnes adaptées")
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            Text("Services Entreprise")
                .font(KivuTypography.headlineLarge)
                .foregroundColor(KivuColors.primaryText)

            LazyVGrid(columns: [
                GridItem(.flexible(), spacing: KivuSpacing.sm),
                GridItem(.flexible(), spacing: KivuSpacing.sm)
            ], spacing: KivuSpacing.sm) {
                ForEach(services) { service in
                    B2BServiceTile(service: service)
                }
            }
        }
    }
}

struct B2BService: Identifiable {
    let id = UUID()
    let title: String
    let icon: String
    let color: Color
    let description: String
}

struct B2BServiceTile: View {
    let service: B2BService
    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.sm) {
            ZStack {
                Circle().fill(service.color.opacity(0.15)).frame(width: 44, height: 44)
                Image(systemName: service.icon).foregroundColor(service.color)
            }
            Text(service.title)
                .font(KivuTypography.headlineSmall)
                .foregroundColor(KivuColors.primaryText)
            Text(service.description)
                .font(KivuTypography.bodySmall)
                .foregroundColor(KivuColors.secondaryText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(KivuSpacing.md)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.lg)
        .kivuSoftShadow()
    }
}

struct MarketplaceSection: View {
    let products: [MarketplaceItem] = [
        MarketplaceItem(name: "Cacao bio", seller: "Aminata — 🇨🇮", price: "2 500 FCFA/kg", language: "Dioula → Français", icon: "🍫"),
        MarketplaceItem(name: "Tissu Kente", seller: "Kofi — 🇬🇭", price: "15 000 FCFA", language: "Ewe → Anglais", icon: "🎨"),
        MarketplaceItem(name: "Café éthiopien", seller: "Dawit — 🇪🇹", price: "8 000 FCFA/kg", language: "Amharique → Swahili", icon: "☕")
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            Text("Marketplace sans frontières")
                .font(KivuTypography.headlineLarge)
                .foregroundColor(KivuColors.primaryText)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: KivuSpacing.sm) {
                    ForEach(products) { product in
                        ProductCard(item: product)
                    }
                }
            }
        }
    }
}

struct MarketplaceItem: Identifiable {
    let id = UUID()
    let name: String
    let seller: String
    let price: String
    let language: String
    let icon: String
}

struct ProductCard: View {
    let item: MarketplaceItem

    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.sm) {
            ZStack {
                RoundedRectangle(cornerRadius: KivuRadius.md)
                    .fill(KivuColors.background)
                    .frame(width: 180, height: 120)
                Text(item.icon).font(.system(size: 60))
            }
            Text(item.name)
                .font(KivuTypography.headlineSmall)
                .foregroundColor(KivuColors.primaryText)
            Text(item.seller)
                .font(KivuTypography.labelMedium)
                .foregroundColor(KivuColors.secondaryText)
            Text(item.price)
                .font(KivuTypography.headlineMedium)
                .foregroundColor(KivuColors.secondary)
            Label(item.language, systemImage: "arrow.left.arrow.right")
                .font(KivuTypography.labelSmall)
                .foregroundColor(KivuColors.primary)
        }
        .padding(KivuSpacing.sm)
        .frame(width: 200)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.lg)
        .kivuSoftShadow()
    }
}

struct ContractsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: KivuSpacing.md) {
            Text("Mes contrats récents")
                .font(KivuTypography.headlineLarge)
                .foregroundColor(KivuColors.primaryText)

            VStack(spacing: KivuSpacing.xs) {
                ContractRow(title: "Vente Cacao — Nigeria", status: "Signé", date: "12 avril", color: KivuColors.success)
                ContractRow(title: "Partenariat Tech — Kenya", status: "En négociation", date: "18 avril", color: KivuColors.warning)
                ContractRow(title: "Distribution — Sénégal", status: "Brouillon", date: "20 avril", color: KivuColors.info)
            }
        }
    }
}

struct ContractRow: View {
    let title: String
    let status: String
    let date: String
    let color: Color
    var body: some View {
        HStack {
            Image(systemName: "doc.text.fill")
                .foregroundColor(color)
                .frame(width: 44, height: 44)
                .background(color.opacity(0.15))
                .clipShape(Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(KivuTypography.headlineSmall).foregroundColor(KivuColors.primaryText)
                Text(status)
                    .font(KivuTypography.labelSmall)
                    .foregroundColor(color)
            }
            Spacer()
            Text(date).font(KivuTypography.labelSmall).foregroundColor(KivuColors.tertiaryText)
        }
        .padding(KivuSpacing.md)
        .background(KivuColors.surface)
        .cornerRadius(KivuRadius.md)
        .kivuSoftShadow()
    }
}
