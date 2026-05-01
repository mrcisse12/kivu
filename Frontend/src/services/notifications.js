/**
 * KIVU — Système de notifications interne
 *
 * Stocke les notifications dans `store.notifications.list[]`.
 * Format : { id, type, icon, title, body, date, read, actionPath? }
 *
 * Types : achievement | streak | system | community | reminder
 */

import { store } from '../store.js';

const MAX_NOTIFICATIONS = 50;

function nowISO() { return new Date().toISOString(); }

export const notifications = {
  /** Renvoie la liste (plus récent en premier) */
  list() {
    return store.get('notifications')?.list || [];
  },

  unreadCount() {
    return this.list().filter(n => !n.read).length;
  },

  /** Ajoute une notification */
  push({ type = 'system', icon = '🔔', title, body = '', actionPath = null }) {
    if (!title) return;
    const note = {
      id: 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      type, icon, title, body, actionPath,
      date: nowISO(),
      read: false
    };
    const cur = store.get('notifications') || { list: [] };
    const list = [note, ...(cur.list || [])].slice(0, MAX_NOTIFICATIONS);
    store.set('notifications', { ...cur, list });
    return note;
  },

  /** Marque une notification comme lue */
  markRead(id) {
    store.update('notifications', cur => ({
      ...(cur || {}),
      list: (cur?.list || []).map(n => n.id === id ? { ...n, read: true } : n)
    }));
  },

  markAllRead() {
    store.update('notifications', cur => ({
      ...(cur || {}),
      list: (cur?.list || []).map(n => ({ ...n, read: true }))
    }));
  },

  remove(id) {
    store.update('notifications', cur => ({
      ...(cur || {}),
      list: (cur?.list || []).filter(n => n.id !== id)
    }));
  },

  clear() {
    store.set('notifications', { list: [] });
  },

  /** Helpers ciblés pour les événements gamification */
  achievement(badgeIcon, badgeLabel) {
    return this.push({
      type: 'achievement',
      icon: badgeIcon,
      title: 'Badge débloqué !',
      body: badgeLabel,
      actionPath: '/profile'
    });
  },

  levelUp(newLevel) {
    return this.push({
      type: 'achievement',
      icon: '🚀',
      title: `Niveau ${newLevel} atteint !`,
      body: 'Continuez pour débloquer encore plus de récompenses.',
      actionPath: '/profile'
    });
  },

  streak(days) {
    return this.push({
      type: 'streak',
      icon: '🔥',
      title: `${days} jours de série !`,
      body: 'Restez consistant pour atteindre les sommets.',
      actionPath: '/learn'
    });
  },

  reminder(text) {
    return this.push({
      type: 'reminder',
      icon: '⏰',
      title: 'Rappel KIVU',
      body: text,
      actionPath: '/learn'
    });
  },

  community(text, icon = '🌍') {
    return this.push({
      type: 'community',
      icon,
      title: 'Communauté',
      body: text
    });
  }
};

/** Initialise des notifications de bienvenue à la première utilisation */
export function seedWelcomeNotifications() {
  const cur = store.get('notifications');
  if (cur?.list?.length || cur?.seeded) return;
  store.set('notifications', { list: [], seeded: true });
  notifications.push({
    type: 'system',
    icon: '🌍',
    title: 'Bienvenue sur KIVU !',
    body: '2 000 langues africaines à portée de voix. Commencez votre première leçon.',
    actionPath: '/learn'
  });
  notifications.push({
    type: 'community',
    icon: '🎉',
    title: 'Festival des langues africaines',
    body: 'Du 15 au 22 mai, événements communautaires partout en Afrique.',
    actionPath: '/diaspora'
  });
  notifications.push({
    type: 'reminder',
    icon: '🦅',
    title: 'Astuce du jour',
    body: 'Touchez l\'étoile sur une traduction pour la garder en favori.',
    actionPath: '/translate'
  });
}
