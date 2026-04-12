/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AQICN_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
