import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http, webSocket } from 'viem'
import { sepolia } from 'wagmi/chains'
import { LOCAL_CHAIN, SUPPORTED_CHAINS } from './chain'
import { ALCHEMY_HTTP_SEPOLIA, ALCHEMY_WS_SEPOLIA, HARDHAT_HTTP, isMobileDevice } from './providers'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
if (!projectId) {
  throw new Error(
    'VITE_WALLETCONNECT_PROJECT_ID is required. Please set it in your .env.local file.'
  )
}

const sepoliaTransport = isMobileDevice()
  ? http(ALCHEMY_HTTP_SEPOLIA)
  : webSocket(ALCHEMY_WS_SEPOLIA)

export const wagmiConfig = getDefaultConfig({
  appName: 'Expense Notarization',
  projectId,
  chains: SUPPORTED_CHAINS,
  transports: {
    [sepolia.id]: sepoliaTransport,
    [LOCAL_CHAIN.id]: http(HARDHAT_HTTP),
  },
  ssr: false,
})
