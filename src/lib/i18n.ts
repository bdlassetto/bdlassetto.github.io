// Simplified internationalization (i18n) system
import { addMessages, init, locale, _ } from 'svelte-i18n';
import { writable } from 'svelte/store';

// Language definitions
export const SUPPORTED_LANGUAGES = ['en', 'pt', 'es'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Basic translations (used mainly for testing)
export const translations = {
  en: {
    greeting: 'Hello',
    welcome: 'Welcome to the application',
    language: 'Language',
    'app.title': 'BDL CAR VIEWER',
    'app.subtitle': 'Interactive 3D Car Model Viewer',
    'features.title': 'Included Features',
    'features.theme': 'Light/dark theme toggle',
    'features.accessibility': 'Basic accessibility',
    'features.typescript': 'TypeScript support',
    'features.testing': 'Unit and e2e tests',
    'features.i18n': 'Internationalization support',
    'footer.copyright': '© 2025 BDL CAR VIEWER. Built with Svelte.',
    'about.title': 'About BDL',
    'about.history_title': 'Our History',
    'about.history': 'Brazilian Drag League was the first virtual drag racing league with a proper tree start system in Assetto Corsa, founded to bring high-quality models to a game where realistic Brazilian cars are hard to find.',
    'about.mission_title': 'Our Mission',
    'about.mission': 'We focus on the complete experience. This involves physics (tracks and cars), 3D modeling, optimization, short deadlines, and solid rules.',
    'about.pillars_title': 'Core Pillars',
    'about.pillar_physics': 'Refined Physics',
    'about.pillar_3d': 'High Quality 3D',
    'about.pillar_optimization': 'Optimization',
    'about.pillar_rules': 'Solid Rules',
    'about.tagline': 'The ultimate drag racing experience.'
  },
  pt: {
    greeting: 'Olá',
    welcome: 'Bem-vindo ao aplicativo',
    language: 'Idioma',
    'app.title': 'BDL CAR VIEWER',
    'app.subtitle': 'Visualizador Interativo de Modelo de Carro 3D',
    'features.title': 'Recursos Incluídos',
    'features.theme': 'Alternância de tema claro/escuro',
    'features.accessibility': 'Acessibilidade básica',
    'features.typescript': 'Suporte ao TypeScript',
    'features.testing': 'Testes unitários e e2e',
    'features.i18n': 'Suporte à internacionalização',
    'footer.copyright': '© 2025 BDL CAR VIEWER. Construído com Svelte.',
    'about.title': 'Sobre a BDL',
    'about.history_title': 'Nossa História',
    'about.history': 'A Brazilian Drag League foi a primeira liga de arrancada virtual com pinheirinho no Assetto Corsa, fundada para trazer modelos de qualidade para um jogo onde é difícil encontrar carros brasileiros realistas.',
    'about.mission_title': 'Nossa Missão',
    'about.mission': 'Nosso foco está na experiência completa. Isso envolve física (das pistas e dos carros), 3D, otimização, prazos curtos e regras sólidas.',
    'about.pillars_title': 'Pilares',
    'about.pillar_physics': 'Física Refinada',
    'about.pillar_3d': 'Modelagem 3D',
    'about.pillar_optimization': 'Otimização',
    'about.pillar_rules': 'Regras Sólidas',
    'about.tagline': 'A experiência definitiva de arrancada.'
  },
  es: {
    greeting: 'Hola',
    welcome: 'Bienvenido a la aplicación',
    language: 'Idioma',
    'app.title': 'BDL CAR VIEWER',
    'app.subtitle': 'Visor Interactivo de Modelo de Coche 3D',
    'features.title': 'Características Incluidas',
    'features.theme': 'Alternancia de tema claro/oscuro',
    'features.accessibility': 'Accesibilidad básica',
    'features.typescript': 'Soporte para TypeScript',
    'features.testing': 'Pruebas unitarias y e2e',
    'features.i18n': 'Soporte para internacionalización',
    'footer.copyright': '© 2025 BDL CAR VIEWER. Construido con Svelte.',
    'about.title': 'Sobre BDL',
    'about.history_title': 'Nuestra Historia',
    'about.history': 'Brazilian Drag League fue la primera liga de carreras de arrancones virtuales con sistema de semáforo en Assetto Corsa, fundada para traer modelos de calidad a un juego donde es difícil encontrar autos brasileños realistas.',
    'about.mission_title': 'Nuestra Misión',
    'about.mission': 'Nuestro enfoque está en la experiencia completa. Esto implica física (de pistas y autos), 3D, optimización, plazos cortos y reglas sólidas.',
    'about.pillars_title': 'Pilares',
    'about.pillar_physics': 'Física Refinada',
    'about.pillar_3d': 'Modelado 3D',
    'about.pillar_optimization': 'Optimización',
    'about.pillar_rules': 'Reglas Sólidas',
    'about.tagline': 'La experiencia definitiva de arrancones.'
  }
};

// Add messages to the dictionary
addMessages('en', translations.en);
addMessages('pt', translations.pt);
addMessages('es', translations.es);

// Initialize i18n with appropriate settings
export function setupI18n() {
  const initialLocale = getInitialLocale();

  init({
    fallbackLocale: 'en',
    initialLocale: initialLocale,
  });
}

type TranslationKey = keyof typeof translations['en'];

// Function to get the initial locale based on browser or localStorage
function getInitialLocale() {
  if (typeof window === 'undefined') {
    return 'en';
  }

  // Check if there's a preferred language stored in localStorage
  const savedLocale = localStorage.getItem('preferredLanguage');

  if (savedLocale && SUPPORTED_LANGUAGES.includes(savedLocale as SupportedLanguage)) {
    return savedLocale;
  }

  // Use browser language if available
  const browserLocale = navigator.language.split('-')[0];
  return SUPPORTED_LANGUAGES.includes(browserLocale as SupportedLanguage) ? browserLocale : 'en';
}

export function createI18nStore() {
  const { subscribe, set } = writable<SupportedLanguage>('en');

  const store = {
    subscribe,
    setLanguage(lang: SupportedLanguage) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('preferredLanguage', lang);
      }
      locale.set(lang);
      set(lang);
      return lang;
    },
    initialize() {
      // Get saved preference, if any
      const savedLang = typeof localStorage !== 'undefined'
        ? localStorage.getItem('preferredLanguage') as SupportedLanguage
        : null;

      if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) {
        this.setLanguage(savedLang);
        return;
      }

      // Try to use browser language
      if (typeof navigator !== 'undefined') {
        const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
        if (SUPPORTED_LANGUAGES.includes(browserLang)) {
          this.setLanguage(browserLang);
          return;
        }
      }

      // Use English as default
      this.setLanguage('en');
    },
    t(key: TranslationKey, lang: SupportedLanguage = 'en') {
      return translations[lang]?.[key] || key;
    },
    translations // Export translations for tests
  };

  return store;
}

export const i18n = createI18nStore();

// Configure on load
setupI18n();

export { _, locale };