/**
 * Loads the Google Maps JavaScript API once, using VITE_GOOGLE_MAPS_API_KEY.
 * Resolves with the global `google` object.
 */
let loader: Promise<any> | null = null;

export const loadGoogleMaps = (): Promise<any> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  const w = window as any;
  if (w.google?.maps?.Map) return Promise.resolve(w.google);
  if (loader) return loader;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!apiKey) {
    console.warn('[Maps] VITE_GOOGLE_MAPS_API_KEY is not set; map disabled.');
    return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY'));
  }

  const language = (() => {
    try {
      return localStorage.getItem('preferredLang') === 'el' ? 'el' : 'en';
    } catch {
      return 'en';
    }
  })();

  loader = new Promise((resolve, reject) => {
    const callbackName = '__bdGoogleMapsReady';
    w[callbackName] = () => {
      delete w[callbackName];
      resolve(w.google);
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&region=GR&language=${language}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loader = null;
      reject(new Error('Google Maps failed to load'));
    };
    document.head.appendChild(script);
  });
  return loader;
};
