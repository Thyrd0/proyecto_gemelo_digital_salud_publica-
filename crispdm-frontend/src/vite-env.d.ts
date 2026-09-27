/// <reference types="vite/client" />

declare module 'i18next-browser-languagedetector';

interface ImportMetaEnv {
  readonly VITE_STREAMLIT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
