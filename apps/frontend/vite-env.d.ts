/// <reference types="vite/client" />

declare const __BUILD_ID__: string

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly VITE_ALCHEMY_API_KEY: string
  readonly VITE_APP_CHAIN_ID: string
  readonly VITE_EXPENSE_REGISTRY_ADDRESS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
