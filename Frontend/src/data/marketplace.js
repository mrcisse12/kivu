/**
 * KIVU — Marketplace catalogue.
 *
 * Produits artisanaux et services africains, présentés avec :
 *  - Prix en monnaie locale (FCFA, USD, NGN, ZAR…)
 *  - Vendeur et pays
 *  - Langue d'origine de la description (auto-traduite par KIVU)
 *  - Catégorie + emoji visuel + couleur de fond
 *  - Note moyenne sur 5 + nombre d'avis
 */

export const CATEGORIES = [
  { id: 'all',      label: 'Tout',         emoji: '🌍', color: '#666E85' },
  { id: 'craft',    label: 'Artisanat',    emoji: '🎨', color: '#F2952D' },
  { id: 'fashion',  label: 'Mode',         emoji: '👗', color: '#E11D74' },
  { id: 'food',     label: 'Alimentation', emoji: '🍫', color: '#8C40AD' },
  { id: 'music',    label: 'Musique',      emoji: '🥁', color: '#1CB0F6' },
  { id: 'books',    label: 'Livres',       emoji: '📚', color: '#2D9E73' },
  { id: 'service',  label: 'Services',     emoji: '🛠️', color: '#174E9C' },
  { id: 'beauty',   label: 'Beauté',       emoji: '💄', color: '#FF6B9D' }
];

export const PRODUCTS = [
  // ─── Artisanat
  { id: 'p001', name: 'Statue Baoulé', emoji: '🗿', cover: 'linear-gradient(135deg, #6B4423 0%, #A57050 100%)',
    seller: 'Aïssata K.', country: 'Côte d\'Ivoire', countryFlag: '🇨🇮', region: 'Yamoussoukro',
    price: 45000, currency: 'FCFA', priceUSD: 75,
    category: 'craft', lang: 'fr',
    description: 'Statue traditionnelle Baoulé sculptée à la main dans du bois d\'iroko. Représente un esprit protecteur ancestral. 28cm de haut.',
    rating: 4.8, reviews: 47, sold: 132, inStock: 12 },

  { id: 'p002', name: 'Tissu Kente royal', emoji: '🎨', cover: 'linear-gradient(135deg, #F2C94C 0%, #DC4B26 100%)',
    seller: 'Kofi A.', country: 'Ghana', countryFlag: '🇬🇭', region: 'Kumasi',
    price: 85000, currency: 'FCFA', priceUSD: 142,
    category: 'craft', lang: 'tw',
    description: 'Kente royal Ashanti tissé à la main avec fils d\'or et de coton. Chaque motif raconte un proverbe. 2m × 1m20.',
    rating: 4.9, reviews: 89, sold: 217, inStock: 6 },

  { id: 'p003', name: 'Masque Dogon', emoji: '🎭', cover: 'linear-gradient(135deg, #5C2C18 0%, #8B4513 100%)',
    seller: 'Amadou T.', country: 'Mali', countryFlag: '🇲🇱', region: 'Bandiagara',
    price: 32000, currency: 'FCFA', priceUSD: 53,
    category: 'craft', lang: 'bam',
    description: 'Masque cérémoniel Dogon en bois sculpté, utilisé lors des fêtes Dama. Pièce authentique avec patine d\'usage.',
    rating: 4.7, reviews: 23, sold: 56, inStock: 4 },

  { id: 'p004', name: 'Panier Bolga', emoji: '🧺', cover: 'linear-gradient(135deg, #D4A574 0%, #8B6F47 100%)',
    seller: 'Esther M.', country: 'Ghana', countryFlag: '🇬🇭', region: 'Bolgatanga',
    price: 18000, currency: 'FCFA', priceUSD: 30,
    category: 'craft', lang: 'fra',
    description: 'Panier Bolgatanga tressé en herbe d\'éléphant. Coloré au teint naturel. Idéal pour les courses ou décoration.',
    rating: 4.6, reviews: 134, sold: 412, inStock: 28 },

  // ─── Mode
  { id: 'p005', name: 'Boubou wax brodé', emoji: '👗', cover: 'linear-gradient(135deg, #00A8B5 0%, #FF6B9D 100%)',
    seller: 'Fatou D.', country: 'Sénégal', countryFlag: '🇸🇳', region: 'Dakar',
    price: 65000, currency: 'FCFA', priceUSD: 108,
    category: 'fashion', lang: 'wol',
    description: 'Boubou femme en wax 100% coton avec broderies à la main. Coupe traditionnelle sénégalaise. Tailles M, L, XL.',
    rating: 5.0, reviews: 56, sold: 89, inStock: 15 },

  { id: 'p006', name: 'Sandales touaregues cuir', emoji: '👡', cover: 'linear-gradient(135deg, #C19A6B 0%, #654321 100%)',
    seller: 'Mohamed A.', country: 'Niger', countryFlag: '🇳🇪', region: 'Agadez',
    price: 22000, currency: 'FCFA', priceUSD: 37,
    category: 'fashion', lang: 'hau',
    description: 'Sandales artisanales en cuir tanné à la main, motifs géométriques touaregs. Pointures 36 à 44.',
    rating: 4.5, reviews: 78, sold: 245, inStock: 21 },

  { id: 'p007', name: 'Foulard Bògòlanfini', emoji: '🧣', cover: 'linear-gradient(135deg, #6B4423 0%, #2C1810 100%)',
    seller: 'Mariam C.', country: 'Mali', countryFlag: '🇲🇱', region: 'Ségou',
    price: 28000, currency: 'FCFA', priceUSD: 47,
    category: 'fashion', lang: 'bam',
    description: 'Foulard en bogolan (mud cloth) teint à la boue selon la technique ancestrale bambara. 80cm × 80cm.',
    rating: 4.8, reviews: 41, sold: 68, inStock: 9 },

  // ─── Alimentation
  { id: 'p008', name: 'Cacao bio Tabou', emoji: '🍫', cover: 'linear-gradient(135deg, #6B4423 0%, #3E2723 100%)',
    seller: 'Coopérative Tabou', country: 'Côte d\'Ivoire', countryFlag: '🇨🇮', region: 'Tabou',
    price: 4500, currency: 'FCFA', priceUSD: 7.5,
    category: 'food', lang: 'fra',
    description: 'Fèves de cacao bio fermentées 7 jours, séchées au soleil. Goût intense et fruité. 1kg.',
    rating: 4.9, reviews: 234, sold: 1847, inStock: 100 },

  { id: 'p009', name: 'Café Yirgacheffe', emoji: '☕', cover: 'linear-gradient(135deg, #4A2C1A 0%, #8B5A3C 100%)',
    seller: 'Dawit Tesfa', country: 'Éthiopie', countryFlag: '🇪🇹', region: 'Yirgacheffe',
    price: 12000, currency: 'FCFA', priceUSD: 20,
    category: 'food', lang: 'amh',
    description: 'Café Arabica Yirgacheffe lavé. Notes florales, citron, jasmin. Torréfié médium. 250g grains entiers.',
    rating: 4.9, reviews: 412, sold: 2156, inStock: 80 },

  { id: 'p010', name: 'Miel sauvage Casamance', emoji: '🍯', cover: 'linear-gradient(135deg, #FFB75E 0%, #ED8F03 100%)',
    seller: 'Apiculteurs Casamance', country: 'Sénégal', countryFlag: '🇸🇳', region: 'Casamance',
    price: 8500, currency: 'FCFA', priceUSD: 14,
    category: 'food', lang: 'wol',
    description: 'Miel sauvage récolté dans la forêt de Casamance. Cristallisation lente. 500g.',
    rating: 4.7, reviews: 156, sold: 423, inStock: 42 },

  { id: 'p011', name: 'Thé Rooibos Cederberg', emoji: '🍵', cover: 'linear-gradient(135deg, #C73E1D 0%, #8B2300 100%)',
    seller: 'Cederberg Tea Co.', country: 'Afrique du Sud', countryFlag: '🇿🇦', region: 'Western Cape',
    price: 6500, currency: 'FCFA', priceUSD: 11,
    category: 'food', lang: 'zul',
    description: 'Rooibos pur des montagnes Cederberg. Sans caféine, riche en antioxydants. 100 sachets.',
    rating: 4.8, reviews: 189, sold: 678, inStock: 65 },

  { id: 'p012', name: 'Karité brut du Burkina', emoji: '🥥', cover: 'linear-gradient(135deg, #F4E1B6 0%, #C9A063 100%)',
    seller: 'Femmes Karité Bobo', country: 'Burkina Faso', countryFlag: '🇧🇫', region: 'Bobo-Dioulasso',
    price: 5500, currency: 'FCFA', priceUSD: 9,
    category: 'food', lang: 'dyu',
    description: 'Beurre de karité 100% pur, non raffiné. Production équitable par coopérative féminine. 250g.',
    rating: 4.9, reviews: 287, sold: 1234, inStock: 95 },

  // ─── Musique
  { id: 'p013', name: 'Djembé Mali pro', emoji: '🥁', cover: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
    seller: 'Djembé Lélé', country: 'Mali', countryFlag: '🇲🇱', region: 'Bamako',
    price: 95000, currency: 'FCFA', priceUSD: 158,
    category: 'music', lang: 'bam',
    description: 'Djembé professionnel taillé dans un tronc de balanza. Peau de chèvre, cordage 5mm. Sa La D Si.',
    rating: 4.9, reviews: 67, sold: 124, inStock: 8 },

  { id: 'p014', name: 'Kora 21 cordes', emoji: '🎵', cover: 'linear-gradient(135deg, #DAA520 0%, #8B4513 100%)',
    seller: 'Atelier Cissoko', country: 'Sénégal', countryFlag: '🇸🇳', region: 'Tambacounda',
    price: 285000, currency: 'FCFA', priceUSD: 475,
    category: 'music', lang: 'wol',
    description: 'Kora 21 cordes traditionnelle, calebasse et manche en bois noble. Faite par maître griot Cissoko.',
    rating: 5.0, reviews: 18, sold: 23, inStock: 3 },

  { id: 'p015', name: 'Mbira Zimbabwe', emoji: '🎶', cover: 'linear-gradient(135deg, #2C5530 0%, #6B8E23 100%)',
    seller: 'Tendai Marombo', country: 'Zimbabwe', countryFlag: '🇿🇼', region: 'Harare',
    price: 42000, currency: 'FCFA', priceUSD: 70,
    category: 'music', lang: 'zul',
    description: 'Mbira nyunga nyunga traditionnelle Shona. 15 lames métal sur résonateur en gourde. Notes do.',
    rating: 4.7, reviews: 34, sold: 47, inStock: 11 },

  // ─── Livres
  { id: 'p016', name: 'L\'enfant noir — Camara Laye', emoji: '📖', cover: 'linear-gradient(135deg, #8B0000 0%, #FFD700 100%)',
    seller: 'Librairie Présence Africaine', country: 'France', countryFlag: '🇫🇷', region: 'Paris',
    price: 8500, currency: 'FCFA', priceUSD: 14,
    category: 'books', lang: 'fra',
    description: 'Édition illustrée du chef-d\'œuvre de Camara Laye. Souvenirs d\'enfance dans la Guinée traditionnelle.',
    rating: 4.9, reviews: 312, sold: 2134, inStock: 100 },

  { id: 'p017', name: 'Une si longue lettre — Mariama Bâ', emoji: '✉️', cover: 'linear-gradient(135deg, #D2691E 0%, #8B4513 100%)',
    seller: 'Éditions NEAS', country: 'Sénégal', countryFlag: '🇸🇳', region: 'Dakar',
    price: 6800, currency: 'FCFA', priceUSD: 11,
    category: 'books', lang: 'fra',
    description: 'Roman épistolaire emblématique de la littérature féminine africaine. 168 pages.',
    rating: 4.8, reviews: 245, sold: 1456, inStock: 80 },

  { id: 'p018', name: 'Things Fall Apart — Achebe', emoji: '📚', cover: 'linear-gradient(135deg, #2F4F4F 0%, #708090 100%)',
    seller: 'African Heritage Books', country: 'Nigeria', countryFlag: '🇳🇬', region: 'Lagos',
    price: 9500, currency: 'FCFA', priceUSD: 16,
    category: 'books', lang: 'ibo',
    description: 'Le classique de Chinua Achebe en édition anglaise. L\'histoire d\'Okonkwo et la fin d\'un monde.',
    rating: 4.9, reviews: 567, sold: 3421, inStock: 120 },

  // ─── Services
  { id: 'p019', name: 'Cours de Wolof en ligne', emoji: '🎓', cover: 'linear-gradient(135deg, #2D9E73 0%, #58C794 100%)',
    seller: 'Awa Sow', country: 'Sénégal', countryFlag: '🇸🇳', region: 'Saint-Louis',
    price: 25000, currency: 'FCFA', priceUSD: 42,
    category: 'service', lang: 'wol',
    description: '10 séances de 1h en visio, niveau débutant à intermédiaire. Avec support PDF et audio.',
    rating: 4.9, reviews: 156, sold: 287, inStock: 50 },

  { id: 'p020', name: 'Traduction certifiée', emoji: '📋', cover: 'linear-gradient(135deg, #174E9C 0%, #1CB0F6 100%)',
    seller: 'KIVU Translation Hub', country: 'Mondial', countryFlag: '🌍', region: '',
    price: 15000, currency: 'FCFA', priceUSD: 25,
    category: 'service', lang: 'fra',
    description: 'Traduction certifiée FR ↔ langue africaine, retour sous 48h. Documents officiels acceptés.',
    rating: 4.8, reviews: 423, sold: 1543, inStock: 999 },

  { id: 'p021', name: 'Voyage culturel Bénin', emoji: '✈️', cover: 'linear-gradient(135deg, #FCD116 0%, #008751 100%)',
    seller: 'Vodun Voyages', country: 'Bénin', countryFlag: '🇧🇯', region: 'Cotonou',
    price: 850000, currency: 'FCFA', priceUSD: 1417,
    category: 'service', lang: 'fra',
    description: '7 jours immersion culturelle : Ouidah, Abomey, Ganvié. Hébergement local, guide francophone.',
    rating: 4.9, reviews: 67, sold: 89, inStock: 15 },

  // ─── Beauté
  { id: 'p022', name: 'Savon noir africain', emoji: '🧼', cover: 'linear-gradient(135deg, #3E2723 0%, #5D4037 100%)',
    seller: 'Femmes du Karité', country: 'Ghana', countryFlag: '🇬🇭', region: 'Tamale',
    price: 4500, currency: 'FCFA', priceUSD: 7.5,
    category: 'beauty', lang: 'tw',
    description: 'Savon noir Alata Samina traditionnel. Plantain, cacao, palmiste. Anti-acné. 200g.',
    rating: 4.7, reviews: 234, sold: 1234, inStock: 75 },

  { id: 'p023', name: 'Huile d\'argan pure', emoji: '💧', cover: 'linear-gradient(135deg, #F4D03F 0%, #B7950B 100%)',
    seller: 'Coopérative Argan Femmes', country: 'Maroc', countryFlag: '🇲🇦', region: 'Essaouira',
    price: 12500, currency: 'FCFA', priceUSD: 21,
    category: 'beauty', lang: 'ara',
    description: 'Huile d\'argan vierge pressée à froid. 100% pure. Cheveux + visage. 100ml ambre.',
    rating: 4.9, reviews: 567, sold: 2345, inStock: 110 },

  { id: 'p024', name: 'Hibiscus séché bissap', emoji: '🌺', cover: 'linear-gradient(135deg, #C71585 0%, #8B0000 100%)',
    seller: 'Bissap Bio Sénégal', country: 'Sénégal', countryFlag: '🇸🇳', region: 'Thiès',
    price: 3500, currency: 'FCFA', priceUSD: 6,
    category: 'beauty', lang: 'wol',
    description: 'Fleurs d\'hibiscus séchées pour boisson bissap ou décoction. Riche en vitamine C. 200g.',
    rating: 4.6, reviews: 145, sold: 567, inStock: 60 }
];

export function getProduct(id) {
  return PRODUCTS.find(p => p.id === id);
}

export function searchProducts(query, category = 'all') {
  const q = (query || '').trim().toLowerCase();
  return PRODUCTS.filter(p => {
    if (category !== 'all' && p.category !== category) return false;
    if (!q) return true;
    return [p.name, p.description, p.seller, p.country, p.region].join(' ').toLowerCase().includes(q);
  });
}

export function relatedProducts(id, limit = 4) {
  const p = getProduct(id);
  if (!p) return [];
  return PRODUCTS.filter(x => x.category === p.category && x.id !== id).slice(0, limit);
}

export function countByCategory() {
  const counts = {};
  PRODUCTS.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
  return counts;
}

/** Lang code → human label for the "auto-traduit du X" badge */
export const LANG_LABELS = {
  fr: 'Français', fra: 'Français', en: 'Anglais', eng: 'Anglais',
  swa: 'Swahili', wol: 'Wolof', bam: 'Bambara', dyu: 'Dioula',
  hau: 'Haoussa', yor: 'Yoruba', zul: 'Zulu', ibo: 'Igbo',
  lin: 'Lingala', amh: 'Amharique', ara: 'Arabe', tw: 'Twi'
};
