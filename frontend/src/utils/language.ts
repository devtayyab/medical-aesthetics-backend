/**
 * Language switching without Google machine translation.
 *
 * The EN/EL buttons only change `preferredLang`; pages render their own built-in
 * Greek texts. The <html lang> attribute follows the choice, which also lets
 * browsers drop Greek accents when CSS `text-transform: uppercase` is applied.
 */
export type AppLanguage = 'en' | 'el';

export const getPreferredLanguage = (): AppLanguage => {
  try {
    // Same default as the screens (`preferredLang === 'el'` means Greek, anything else English)
    return localStorage.getItem('preferredLang') === 'el' ? 'el' : 'en';
  } catch {
    return 'en';
  }
};

export const applyDocumentLanguage = (lang: AppLanguage = getPreferredLanguage()) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
};

/** Remove the cookie the old Google Translate widget left behind, so it never re-translates pages. */
const clearGoogleTranslateCookie = () => {
  if (typeof document === 'undefined') return;
  const host = window.location.hostname;
  const expired = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  ['', host, `.${host}`].forEach((d) => {
    document.cookie = d ? `${expired}; domain=${d}` : expired;
  });
};

export const switchLanguage = (lang: AppLanguage) => {
  // <html lang> reflects the language the page is currently rendered in
  const rendered = typeof document !== 'undefined' ? document.documentElement.lang : lang;
  try {
    localStorage.setItem('preferredLang', lang);
  } catch {
    /* storage blocked: still switch for this page */
  }
  applyDocumentLanguage(lang);
  // Many screens read the language once on mount; reload so every text switches together.
  if (rendered !== lang) window.location.reload();
};

/** Call once at startup: set <html lang>, drop old machine-translation state, expose the global switcher. */
export const initLanguage = () => {
  clearGoogleTranslateCookie();
  applyDocumentLanguage();
  (window as any).switchLanguage = switchLanguage;
};
