import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';

export const pxlLightTheme = {
  dark: false,
  colors: {
    primary: '#AE9A64',
    secondary: '#030203',
    background: '#FAF8F3',
    surface: '#FFFFFF',
    error: '#B3261E',
    success: '#2E7D32',
    warning: '#A06B00',
    info: '#1F4F8A',
  },
};

export const vuetify = createVuetify({
  theme: {
    defaultTheme: 'pxlLight',
    themes: {
      pxlLight: pxlLightTheme,
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  defaults: {
    VBtn: { variant: 'flat' },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
    VCard: { rounded: 'lg' },
  },
});
