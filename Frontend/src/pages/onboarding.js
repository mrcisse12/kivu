import { store } from '../store.js';
import { navigate } from '../router.js';
import { icons } from '../components/icons.js';
import { mascot } from '../components/mascot.js';

const PAGES = [
  {
    emotion: 'waving',
    title: 'Bienvenue dans KIVU',
    subtitle: 'Je suis Kivi, votre guide. Ensemble on va connecter 2 000+ langues africaines.',
    gradient: 'grad-hero',
    highlight: '2 000+ langues'
  },
  {
    emotion: 'happy',
    title: 'Traduction vocale instantanée',
    subtitle: 'Parlez dans votre langue maternelle. KIVU traduit en temps réel, même hors-ligne.',
    gradient: 'grad-sunset',
    highlight: '< 200 ms'
  },
  {
    emotion: 'cheering',
    title: 'Apprendre en jouant',
    subtitle: 'Quêtes interactives, XP, badges. Maîtrisez une langue en 30 jours.',
    gradient: 'grad-savanna',
    highlight: '85% rétention'
  },
  {
    emotion: 'thinking',
    title: 'Préserver notre héritage',
    subtitle: 'Immortalisez les langues menacées. La voix de votre grand-mère, pour toujours.',
    gradient: 'grad-royal',
    highlight: '500+ langues sauvées'
  },
  {
    emotion: 'cheering',
    title: 'Unir l\'humanité',
    subtitle: 'Chaque langue raconte une histoire qui mérite d\'être entendue.',
    gradient: 'grad-hero',
    highlight: '7 milliards connectés'
  }
];

let currentPage = 0;

export function renderOnboarding() {
  const page = PAGES[currentPage];
  const isLast = currentPage === PAGES.length - 1;

  return `
    <div class="onboarding-container ${page.gradient} mesh-bg animated">
      <div class="orb orb--accent" style="width:300px;height:300px;top:-100px;right:-80px;opacity:0.35"></div>
      <div class="orb orb--primary" style="width:240px;height:240px;bottom:-60px;left:-60px;opacity:0.3;animation-delay:-4s;"></div>

      <header class="onboarding-header">
        <div class="onboarding-brand">KIVU</div>
        ${!isLast ? '<button class="chip chip-white" data-action="onboarding-skip">Passer</button>' : ''}
      </header>

      <main class="onboarding-body">
        <div class="onboarding-illustration animate-scale-in" key="${currentPage}">
          <span class="onboarding-mascot" aria-hidden="true">${mascot[page.emotion](150)}</span>
        </div>

        <span class="chip chip-white animate-slide-up">${page.highlight}</span>

        <h1 class="onboarding-title animate-slide-up">${page.title}</h1>
        <p class="onboarding-subtitle animate-slide-up">${page.subtitle}</p>
      </main>

      <footer class="onboarding-footer">
        <div class="onboarding-dots">
          ${PAGES.map((_, i) => `
            <span class="onboarding-dot ${i === currentPage ? 'active' : ''}"
                  data-action="onboarding-jump" data-index="${i}"
                  aria-label="Étape ${i + 1}"></span>
          `).join('')}
        </div>

        <button class="btn btn-white btn-full onboarding-cta" data-action="onboarding-next">
          ${isLast ? 'Commencer l\'aventure' : 'Continuer'}
          <span class="onboarding-arrow">${icons.arrowRight(18)}</span>
        </button>
      </footer>
    </div>
  `;
}

renderOnboarding.mount = () => {
  const rerender = () => {
    document.getElementById('app').innerHTML = `<main class="screen">${renderOnboarding()}</main>`;
    renderOnboarding.mount();
  };

  document.querySelectorAll('[data-action="onboarding-next"]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (currentPage < PAGES.length - 1) {
        currentPage++;
        rerender();
      } else {
        store.set('onboardingCompleted', true);
        navigate('/');
      }
    })
  );

  document.querySelectorAll('[data-action="onboarding-skip"]').forEach(btn =>
    btn.addEventListener('click', () => {
      store.set('onboardingCompleted', true);
      navigate('/');
    })
  );

  document.querySelectorAll('[data-action="onboarding-jump"]').forEach(dot =>
    dot.addEventListener('click', () => {
      currentPage = Number(dot.dataset.index) || 0;
      rerender();
    })
  );
};
