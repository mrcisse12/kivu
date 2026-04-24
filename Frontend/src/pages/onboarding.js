import { store } from '../store.js';
import { navigate } from '../router.js';

const PAGES = [
  {
    icon: '🌍',
    title: 'Bienvenue dans KIVU',
    subtitle: 'La plateforme mondiale qui réunit 2000+ langues africaines',
    gradient: 'grad-hero',
    highlight: '2000+ Langues'
  },
  {
    icon: '🎙️',
    title: 'Traduction Vocale Instantanée',
    subtitle: 'Parlez dans votre langue maternelle. KIVU traduit en temps réel, même hors-ligne.',
    gradient: 'grad-sunset',
    highlight: '< 200ms'
  },
  {
    icon: '🎓',
    title: 'Apprendre en Jouant',
    subtitle: 'Quêtes interactives, XP, badges. Apprenez une langue en 30 jours.',
    gradient: 'grad-savanna',
    highlight: '85% rétention'
  },
  {
    icon: '🛡️',
    title: 'Préserver Notre Héritage',
    subtitle: 'Immortalisez les langues menacées. La voix de votre grand-mère, pour toujours.',
    gradient: 'grad-royal',
    highlight: '500+ langues sauvées'
  },
  {
    icon: '💙',
    title: 'Unir l\'Humanité',
    subtitle: 'Chaque langue raconte une histoire qui mérite d\'être entendue.',
    gradient: 'grad-hero',
    highlight: '7 milliards connectés'
  }
];

let currentPage = 0;

export function renderOnboarding() {
  const page = PAGES[currentPage];
  return `
    <div class="onboarding-container ${page.gradient}" style="
      position: fixed; inset: 0;
      background: var(--${page.gradient === 'grad-hero' ? 'grad-hero' : page.gradient === 'grad-sunset' ? 'grad-sunset' : page.gradient === 'grad-savanna' ? 'grad-savanna' : 'grad-royal'});
      display: flex; flex-direction: column; padding: 24px;
      color: white;
    ">
      <div class="flex justify-between items-center">
        <div></div>
        <button class="chip chip-white" data-action="onboarding-skip">Passer</button>
      </div>

      <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap: 28px;">
        <div style="
          width: 180px; height: 180px; border-radius: 50%;
          background: rgba(255,255,255,0.15); backdrop-filter: blur(20px);
          display: flex; align-items: center; justify-content: center;
          font-size: 80px;
          box-shadow: 0 0 80px rgba(255,255,255,0.4);
        ">${page.icon}</div>

        <span class="chip chip-white">${page.highlight}</span>

        <h1 style="font-size: 32px; font-weight: 800; max-width: 320px;">${page.title}</h1>
        <p style="opacity: 0.92; max-width: 320px; line-height: 1.5;">${page.subtitle}</p>
      </div>

      <div class="flex gap-xs justify-center" style="margin: 20px 0 28px;">
        ${PAGES.map((_, i) => `
          <span style="
            width: ${i === currentPage ? '28px' : '8px'}; height: 8px;
            border-radius: 999px; background: white;
            opacity: ${i === currentPage ? 1 : 0.4};
            transition: all 0.3s var(--ease-spring);
          "></span>
        `).join('')}
      </div>

      <button class="btn btn-white btn-full" data-action="onboarding-next" style="margin-bottom: 32px;">
        ${currentPage === PAGES.length - 1 ? '🚀 Commencer l\'aventure' : 'Continuer →'}
      </button>
    </div>
  `;
}

renderOnboarding.mount = () => {
  document.addEventListener('onboarding-next', () => {
    if (currentPage < PAGES.length - 1) {
      currentPage++;
      document.querySelector('.onboarding-container').parentElement.innerHTML =
        `<main class="screen">${renderOnboarding()}</main>`;
      renderOnboarding.mount();
    } else {
      store.set('onboardingCompleted', true);
      navigate('/');
    }
  }, { once: true });

  document.addEventListener('onboarding-skip', () => {
    store.set('onboardingCompleted', true);
    navigate('/');
  }, { once: true });
};
