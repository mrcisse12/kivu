/**
 * KIVU — Méthodes de paiement africaines + internationales.
 *
 * Toutes les méthodes ci-dessous existent réellement et sont les plus
 * utilisées sur le continent. KIVU les présente avec leur charte
 * graphique authentique. En mode démo, aucune vraie transaction
 * n'est faite — c'est l'UX complète qui est démontrée.
 */

export const PAYMENT_METHODS = [
  // ─── Mobile Money (Afrique de l'Ouest)
  {
    id: 'orange_money',
    name: 'Orange Money',
    type: 'mobile_money',
    logo: '🟠',
    color: '#FF6600',
    countries: ['🇸🇳', '🇨🇮', '🇲🇱', '🇧🇫', '🇨🇲', '🇲🇬', '🇬🇳'],
    label: 'Orange Money',
    desc: 'Sénégal, Côte d\'Ivoire, Mali, Cameroun, Madagascar +',
    phonePrefix: '+221',
    phoneFormat: 'XX XXX XX XX',
    fees: 'Sans frais',
    instant: true,
    popular: true
  },
  {
    id: 'wave',
    name: 'Wave',
    type: 'mobile_money',
    logo: '💙',
    color: '#1FB6FF',
    countries: ['🇸🇳', '🇨🇮', '🇺🇬', '🇲🇱'],
    label: 'Wave',
    desc: 'Frais à 1% — l\'option la moins chère',
    phonePrefix: '+221',
    phoneFormat: 'XX XXX XX XX',
    fees: 'Frais 1%',
    instant: true,
    popular: true
  },
  {
    id: 'mtn_momo',
    name: 'MTN MoMo',
    type: 'mobile_money',
    logo: '🟡',
    color: '#FFCC00',
    countries: ['🇨🇮', '🇨🇲', '🇬🇭', '🇧🇯', '🇺🇬', '🇿🇦', '🇷🇼'],
    label: 'MTN Mobile Money',
    desc: 'Côte d\'Ivoire, Cameroun, Ghana, Bénin, Ouganda +',
    phonePrefix: '+225',
    phoneFormat: 'XX XX XX XX XX',
    fees: 'Sans frais',
    instant: true
  },
  {
    id: 'moov_money',
    name: 'Moov Money',
    type: 'mobile_money',
    logo: '🔵',
    color: '#0066CC',
    countries: ['🇨🇮', '🇧🇯', '🇧🇫', '🇹🇬', '🇳🇪'],
    label: 'Moov Money',
    desc: 'Afrique de l\'Ouest francophone',
    phonePrefix: '+225',
    phoneFormat: 'XX XX XX XX XX',
    fees: 'Sans frais',
    instant: true
  },
  {
    id: 'mpesa',
    name: 'M-Pesa',
    type: 'mobile_money',
    logo: '🟢',
    color: '#00A859',
    countries: ['🇰🇪', '🇹🇿', '🇨🇩', '🇲🇿', '🇪🇬'],
    label: 'M-Pesa',
    desc: 'Le pionnier Mobile Money — Kenya, Tanzanie +',
    phonePrefix: '+254',
    phoneFormat: 'XXX XXX XXX',
    fees: 'Sans frais',
    instant: true,
    popular: true
  },
  {
    id: 'free_money',
    name: 'Free Money',
    type: 'mobile_money',
    logo: '🔴',
    color: '#E60000',
    countries: ['🇸🇳'],
    label: 'Free Money',
    desc: 'Sénégal',
    phonePrefix: '+221',
    phoneFormat: 'XX XXX XX XX',
    fees: 'Sans frais',
    instant: true
  },

  // ─── Cartes / International
  {
    id: 'card',
    name: 'Carte bancaire',
    type: 'card',
    logo: '💳',
    color: '#1A1F36',
    countries: ['🌍'],
    label: 'Visa · Mastercard · Verve',
    desc: 'Paiement sécurisé via Stripe',
    fees: 'Frais 2,9%',
    instant: true,
    popular: true
  },
  {
    id: 'paypal',
    name: 'PayPal',
    type: 'wallet',
    logo: '🅿️',
    color: '#0070BA',
    countries: ['🌍'],
    label: 'PayPal',
    desc: 'Pour la diaspora',
    fees: 'Frais 3,4%',
    instant: true
  },
  {
    id: 'crypto',
    name: 'Crypto',
    type: 'crypto',
    logo: '₿',
    color: '#F7931A',
    countries: ['🌍'],
    label: 'USDC · BTC · ETH',
    desc: 'Mondial, sans frontières',
    fees: 'Frais réseau ~ 1$',
    instant: false
  },

  // ─── Cash on delivery
  {
    id: 'cod',
    name: 'À la livraison',
    type: 'cod',
    logo: '🚚',
    color: '#666E85',
    countries: ['🌍'],
    label: 'Paiement cash à la livraison',
    desc: 'Disponible dans 12 pays africains',
    fees: '+500 FCFA',
    instant: false
  }
];

export function getMethod(id) {
  return PAYMENT_METHODS.find(m => m.id === id);
}

/** Most popular methods for the Top section */
export function popularMethods() {
  return PAYMENT_METHODS.filter(m => m.popular);
}

/** Group methods by type for the picker */
export function groupedMethods() {
  return [
    {
      title: 'Mobile Money',
      subtitle: 'Le plus utilisé en Afrique',
      methods: PAYMENT_METHODS.filter(m => m.type === 'mobile_money')
    },
    {
      title: 'Cartes & wallets',
      subtitle: 'International',
      methods: PAYMENT_METHODS.filter(m => ['card', 'wallet', 'crypto'].includes(m.type))
    },
    {
      title: 'Autres',
      subtitle: '',
      methods: PAYMENT_METHODS.filter(m => m.type === 'cod')
    }
  ];
}

/** Format a phone number based on the method's pattern */
export function formatPhone(method, raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  // Group in chunks of 2 by default (XX XX XX XX XX style)
  return digits.replace(/(\d{2})(?=\d)/g, '$1 ');
}

/** Mask the phone for display: +221 77 ••• 12 34 */
export function maskedPhone(method, raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length < 4) return digits;
  const prefix = method.phonePrefix || '';
  const visibleEnd = digits.slice(-4);
  return `${prefix} ${digits.slice(0, 2)} ••• ${visibleEnd.slice(0, 2)} ${visibleEnd.slice(2)}`;
}

/** Rough validation — must be 8-13 digits for mobile money */
export function isValidPhone(method, raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 13;
}

/** Card validation (Luhn check) */
export function isValidCard(num) {
  const s = String(num || '').replace(/\D/g, '');
  if (s.length < 13 || s.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let d = parseInt(s[i], 10);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}
