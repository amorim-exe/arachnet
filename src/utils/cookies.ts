import Cookies from 'js-cookie';

export const COOKIE_NAMES = {
  THEME: 'homer_simpson_theme',
  LANGUAGE: 'bart_simpson_lang'
} as const;

const COOKIE_OPTIONS = {
  expires: 365, // 1 ano
  secure: window.location.protocol === 'https:',
  sameSite: 'strict' as const
};

export const setThemeCookie = (theme: 'dark' | 'light') => {
  Cookies.set(COOKIE_NAMES.THEME, theme, COOKIE_OPTIONS);
};

export const getThemeCookie = (): 'dark' | 'light' | null => {
  const theme = Cookies.get(COOKIE_NAMES.THEME);
  return theme === 'dark' || theme === 'light' ? theme : null;
};

export const removeThemeCookie = () => {
  Cookies.remove(COOKIE_NAMES.THEME);
};

export const setLanguageCookie = (language: 'en' | 'pt') => {
  Cookies.set(COOKIE_NAMES.LANGUAGE, language, COOKIE_OPTIONS);
};

export const getLanguageCookie = (): 'en' | 'pt' | null => {
  const lang = Cookies.get(COOKIE_NAMES.LANGUAGE);
  return lang === 'en' || lang === 'pt' ? lang : null;
};

export const removeLanguageCookie = () => {
  Cookies.remove(COOKIE_NAMES.LANGUAGE);
};
