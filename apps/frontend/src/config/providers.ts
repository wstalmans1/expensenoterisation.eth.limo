const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY

export const ALCHEMY_HTTP_SEPOLIA = `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`
export const ALCHEMY_WS_SEPOLIA = `wss://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`

export const HARDHAT_HTTP = 'http://127.0.0.1:8545'
export const HARDHAT_WS = 'ws://127.0.0.1:8545'

export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent)
}
