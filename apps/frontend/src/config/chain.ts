import { sepolia } from 'wagmi/chains'
import type { Chain } from 'wagmi/chains'

export const LOCAL_CHAIN: Chain = {
  id: 1337,
  name: 'Hardhat',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
  testnet: true,
}

export const SUPPORTED_CHAINS = [sepolia, LOCAL_CHAIN] as const

const envChainId = Number(import.meta.env.VITE_APP_CHAIN_ID)

export const APP_CHAIN =
  SUPPORTED_CHAINS.find((chain) => chain.id === envChainId) ?? sepolia

export const APP_CHAIN_ID = APP_CHAIN.id
