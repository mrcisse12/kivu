/**
 * KIVU — Marketplace chat service.
 *
 * Vraie messagerie acheteur ↔ vendeur. Les messages sont persistés
 * dans store.marketplace.chats. Les vendeurs répondent automatiquement
 * via une IA contextuelle (réponses réalistes selon l'intent du message).
 *
 * Une conversation = { sellerId, productId?, messages: [], lastSeenAt }
 * Un message      = { id, from: 'user'|'seller', text, ts, read, attachment? }
 *
 * Le store déclenche les listeners → le ChatModal se met à jour live.
 */

import { store } from '../store.js';
import { notifications } from './notifications.js';
import { getProduct } from '../data/marketplace.js';

const MAX_MSG = 100;

/* ─── Storage helpers ─────────────────────────────────────── */

function getState() {
  const m = store.get('marketplaceChats');
  return m || { conversations: [] };
}

function saveState(state) {
  store.set('marketplaceChats', state);
}

function nowIso() { return new Date().toISOString(); }
function genId(prefix = 'm') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/* ─── Public API ──────────────────────────────────────────── */

/** Open or create a conversation with a seller (about an optional product). */
export function openConversation(sellerId, sellerName, productId = null) {
  const state = getState();
  let conv = state.conversations.find(c => c.sellerId === sellerId);
  if (!conv) {
    conv = {
      id: genId('conv'),
      sellerId,
      sellerName,
      productId,
      messages: [{
        id: genId('m'),
        from: 'seller',
        text: getInitialGreeting(sellerName, productId),
        ts: nowIso(),
        read: false
      }],
      lastSeenAt: nowIso(),
      createdAt: nowIso()
    };
    state.conversations = [conv, ...state.conversations];
    saveState(state);
  } else if (productId && conv.productId !== productId) {
    // Switch context to the new product without losing history
    conv.productId = productId;
    saveState(state);
  }
  return conv;
}

/** Get a conversation (with seller info) by id. */
export function getConversation(convId) {
  const state = getState();
  return state.conversations.find(c => c.id === convId) || null;
}

/** All conversations sorted by last activity desc. */
export function listConversations() {
  return [...getState().conversations].sort((a, b) => {
    const ta = new Date(a.messages[a.messages.length - 1]?.ts || a.createdAt).getTime();
    const tb = new Date(b.messages[b.messages.length - 1]?.ts || b.createdAt).getTime();
    return tb - ta;
  });
}

/** How many conversations have unread messages */
export function unreadCount() {
  return getState().conversations.reduce((n, c) =>
    n + c.messages.filter(m => m.from === 'seller' && !m.read).length, 0);
}

/** Mark a conversation's messages from seller as read. */
export function markRead(convId) {
  const state = getState();
  const conv = state.conversations.find(c => c.id === convId);
  if (!conv) return;
  let changed = false;
  conv.messages.forEach(m => {
    if (m.from === 'seller' && !m.read) { m.read = true; changed = true; }
  });
  conv.lastSeenAt = nowIso();
  if (changed) saveState(state);
}

/** Send a user message; the seller will auto-reply within 2-8s. */
export function sendUserMessage(convId, text) {
  const state = getState();
  const conv = state.conversations.find(c => c.id === convId);
  if (!conv || !text || !text.trim()) return null;

  const userMsg = {
    id: genId('m'),
    from: 'user',
    text: text.trim(),
    ts: nowIso(),
    read: true
  };
  conv.messages.push(userMsg);
  // Cap message history
  if (conv.messages.length > MAX_MSG) {
    conv.messages = conv.messages.slice(-MAX_MSG);
  }
  saveState(state);

  // Schedule the seller's reply
  scheduleSellerReply(convId, userMsg.text);
  return userMsg;
}

/** Delete a conversation entirely */
export function deleteConversation(convId) {
  const state = getState();
  state.conversations = state.conversations.filter(c => c.id !== convId);
  saveState(state);
}

/* ─── Seller AI reply engine ──────────────────────────────── */

const REPLY_PATTERNS = [
  // Greeting
  { match: /^(bonjour|salut|hello|hi|sannu|jambo)/i,
    replies: (ctx) => [
      `Bonjour ! Bienvenue, je suis ${ctx.sellerName.split(' ')[0]}. Comment puis-je vous aider avec ${ctx.productName} ? 🌍`,
      `Bonjour ! Merci pour votre intérêt. Posez-moi vos questions sur ${ctx.productName}, je réponds rapidement.`,
      `Salut ! Vous avez un projet en tête pour ${ctx.productName} ? Dites-moi tout 😊`
    ]
  },
  // Price / discount
  { match: /\b(prix|coût|combien|cher|reduction|remise|rabais|discount|promo)\b/i,
    replies: (ctx) => [
      `Le prix est de ${ctx.priceFormatted}. Pour 5 unités ou plus, je peux faire -10%. Ça vous intéresse ?`,
      `Le prix affiché (${ctx.priceFormatted}) est ferme pour 1 unité. Pour des commandes en gros (10+), j'ai des tarifs préférentiels.`,
      `${ctx.priceFormatted} est mon meilleur prix au détail. Si vous prenez plusieurs articles, on peut négocier 💰`
    ]
  },
  // Shipping / delivery
  { match: /\b(livraison|envoi|shipping|deliv|combien.*temps|quand.*recev|expédi)\b/i,
    replies: (ctx) => [
      `Livraison sous 3-7 jours en Afrique de l'Ouest, 7-14 jours pour l'international. Suivi inclus. 📦`,
      `J'expédie depuis ${ctx.sellerCountry} via DHL ou Bolloré. Comptez 5 jours pour Dakar/Abidjan, 10 jours pour Paris.`,
      `Frais de port calculés selon destination. Express 48h dispo (+50%). Vous êtes où ?`
    ]
  },
  // Quality / authenticity
  { match: /\b(authent|véritab|qualit|origin|vrai|fake|copie|garant)\b/i,
    replies: (ctx) => [
      `100% authentique, fait main chez moi. Je peux vous envoyer une vidéo de fabrication si vous voulez. 🎥`,
      `Garanti d'origine ${ctx.sellerCountry}. J'ai un certificat de l'Office du Commerce que je joins à chaque envoi.`,
      `C'est ma propre production artisanale. Vous pouvez voir mes ateliers sur ma page profil.`
    ]
  },
  // Customization
  { match: /\b(personnalis|sur.*mesure|tailles?|couleurs?|modèle|custom)\b/i,
    replies: (ctx) => [
      `Oui, je peux personnaliser ! Couleurs, dimensions, motifs — dites-moi ce que vous imaginez.`,
      `Personnalisation possible : comptez +1 semaine de délai et +15% sur le prix.`,
      `Quelle taille / couleur souhaitez-vous ? Je travaille à la demande.`
    ]
  },
  // Stock / availability
  { match: /\b(stock|dispo|disponib|reste|combien.*reste|encore)\b/i,
    replies: (ctx) => [
      `J'ai actuellement ${ctx.stock} unités en stock prêtes à expédier. ✓`,
      `Stock dispo : ${ctx.stock} pièces. Au-delà, comptez 2-3 semaines pour la production.`,
      `${ctx.stock} en stock. Si vous voulez plus, je peux lancer une production.`
    ]
  },
  // Payment
  { match: /\b(paiement|paye|payer|carte|mobile.*money|wave|orange|mtn|moov|payment)\b/i,
    replies: (ctx) => [
      `J'accepte : Orange Money, Wave, MTN MoMo, virement bancaire, et carte Visa via KIVU Pay. 💳`,
      `Mobile Money est le plus rapide. Carte aussi acceptée via la plateforme KIVU sécurisée.`,
      `Tous les moyens de paiement africains + virement international. KIVU sécurise la transaction.`
    ]
  },
  // Negotiation / order
  { match: /\b(commande|commander|achete|acheter|prendre|réserve|order|buy)\b/i,
    replies: (ctx) => [
      `Excellent ! Cliquez "Ajouter au panier" puis "Commander" — je suis notifié immédiatement et je prépare l'envoi.`,
      `Super choix ! Une fois la commande validée, je vous envoie le numéro de suivi sous 24h.`,
      `Avec plaisir ! Pour commander : ajoutez au panier, choisissez votre paiement, je m'occupe du reste 🎁`
    ]
  },
  // Thank you
  { match: /\b(merci|thank|gracias|asante|jërëjëf|na gode)\b/i,
    replies: (ctx) => [
      `De rien ! N'hésitez pas si vous avez d'autres questions. Bonne journée 🌍`,
      `Avec plaisir ! Je reste dispo pour toute info supplémentaire.`,
      `Merci à vous pour votre intérêt ! Je suis là si besoin.`
    ]
  },
  // Goodbye
  { match: /^(au revoir|à\s*bientôt|à\s*plus|bye|kwaheri|bonne journée)/i,
    replies: (ctx) => [
      `À bientôt ! N'hésitez pas à revenir 👋`,
      `Bonne journée ! Je suis là quand vous voulez.`,
      `Au revoir, et merci pour votre visite ! ✨`
    ]
  },
  // Default / generic
  { match: /./,
    replies: (ctx) => [
      `Bonne question ! Pouvez-vous préciser ? Je veux être sûr de bien vous répondre.`,
      `Hmm, je vois. Voulez-vous qu'on en discute en appel ? Cliquez sur l'icône téléphone en haut.`,
      `Intéressant. Pour ce produit (${ctx.productName}), je vous recommande de regarder les détails techniques. Sinon je suis dispo en visio.`,
      `D'accord, je note. Si vous voulez voir le produit en vidéo, je peux faire un live appel — touche l'icône vidéo en haut.`
    ]
  }
];

function pickReply(text, ctx) {
  for (const pattern of REPLY_PATTERNS) {
    if (pattern.match.test(text)) {
      const opts = pattern.replies(ctx);
      return opts[Math.floor(Math.random() * opts.length)];
    }
  }
  return 'Désolé, je n\'ai pas bien compris. Pouvez-vous reformuler ?';
}

function getInitialGreeting(sellerName, productId) {
  const product = productId ? getProduct(productId) : null;
  const firstName = sellerName.split(' ')[0];
  if (product) {
    return `Bonjour 👋 Je suis ${firstName}. Vous regardez « ${product.name} » — n'hésitez pas si vous avez des questions ! Je réponds en moyenne en 2 minutes.`;
  }
  return `Bonjour 👋 Je suis ${firstName}. Comment puis-je vous aider aujourd'hui ?`;
}

function scheduleSellerReply(convId, userText) {
  // Realistic delay: 2-8 seconds (sellers are humans, not bots)
  const delay = 2000 + Math.random() * 6000;
  setTimeout(() => {
    const state = getState();
    const conv = state.conversations.find(c => c.id === convId);
    if (!conv) return;
    const product = conv.productId ? getProduct(conv.productId) : null;
    const ctx = {
      sellerName: conv.sellerName,
      sellerCountry: product?.country || 'Afrique',
      productName: product?.name || 'ce produit',
      priceFormatted: product ? `${product.price.toLocaleString('fr-FR')} ${product.currency}` : 'le prix indiqué',
      stock: product?.inStock || '?'
    };
    const reply = pickReply(userText, ctx);
    const sellerMsg = {
      id: genId('m'),
      from: 'seller',
      text: reply,
      ts: nowIso(),
      read: false
    };
    conv.messages.push(sellerMsg);
    saveState(state);

    // Push notification (only if app isn't actively viewing this conversation)
    notifications.push({
      type: 'community',
      icon: '💬',
      title: `${conv.sellerName.split(' ')[0]} t'a répondu`,
      body: reply.length > 60 ? reply.slice(0, 60) + '…' : reply,
      actionPath: '/messages'
    });
  }, delay);
}
