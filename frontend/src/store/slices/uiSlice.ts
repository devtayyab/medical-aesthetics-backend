import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '@/config/constants';

export type SupportedLanguage = 'en' | 'el';
export type AppTheme = 'light' | 'dark';

export interface UiState {
  language: SupportedLanguage;
  isGreek: boolean;
  theme: AppTheme;
  sidebarOpen: boolean;
}

const getInitialLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return 'el';
  const saved = localStorage.getItem(STORAGE_KEYS.THEME ? 'preferredLang' : 'preferredLang');
  return (saved === 'en' || saved === 'el') ? saved : 'el';
};

const getInitialTheme = (): AppTheme => {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(STORAGE_KEYS.THEME || 'theme');
  return saved === 'dark' ? 'dark' : 'light';
};

const initialLang = getInitialLanguage();

const initialState: UiState = {
  language: initialLang,
  isGreek: initialLang === 'el',
  theme: getInitialTheme(),
  sidebarOpen: true,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<SupportedLanguage>) => {
      state.language = action.payload;
      state.isGreek = action.payload === 'el';
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferredLang', action.payload);
        window.dispatchEvent(new Event('languagechange'));
      }
    },
    toggleLanguage: (state) => {
      const nextLang: SupportedLanguage = state.language === 'el' ? 'en' : 'el';
      state.language = nextLang;
      state.isGreek = nextLang === 'el';
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferredLang', nextLang);
        window.dispatchEvent(new Event('languagechange'));
      }
    },
    setTheme: (state, action: PayloadAction<AppTheme>) => {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.THEME || 'theme', action.payload);
      }
    },
    toggleTheme: (state) => {
      const nextTheme: AppTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = nextTheme;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.THEME || 'theme', nextTheme);
      }
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const {
  setLanguage,
  toggleLanguage,
  setTheme,
  toggleTheme,
  setSidebarOpen,
  toggleSidebar,
} = uiSlice.actions;

export default uiSlice.reducer;
