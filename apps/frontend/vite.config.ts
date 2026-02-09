import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

function getBuildNumber(): number {
  const counterFile = join(process.cwd(), '.build-counter')

  try {
    if (existsSync(counterFile)) {
      const current = parseInt(readFileSync(counterFile, 'utf8')) || 0
      const next = current + 1
      writeFileSync(counterFile, next.toString())
      return next
    }

    writeFileSync(counterFile, '1')
    return 1
  } catch (error) {
    console.warn('⚠️ Could not read/write build counter, using timestamp fallback')
    return Math.floor(Date.now() / 1000)
  }
}

const buildNumber = getBuildNumber()
console.log(`🚀 Build #${buildNumber}`)

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  if (!env.VITE_ALCHEMY_API_KEY) {
    throw new Error(
      'VITE_ALCHEMY_API_KEY is required. Please set it in your .env.local file. Get your key from https://www.alchemy.com/'
    )
  }

  return {
    plugins: [react()],
    define: {
      __BUILD_ID__: JSON.stringify(`build-${buildNumber}`),
      'process.env.NODE_ENV': JSON.stringify(mode),
      __LIT_DEV_MODE__: 'false',
      global: 'globalThis',
      Buffer: 'globalThis.Buffer',
      util: 'globalThis.util',
    },
    resolve: {
      alias: {
        buffer: 'buffer',
        util: 'util',
        process: 'process',
      },
    },
    optimizeDeps: {
      include: ['buffer', 'util', 'process'],
      esbuildOptions: {
        define: {
          global: 'globalThis',
          Buffer: 'globalThis.Buffer',
          util: 'globalThis.util',
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            wagmi: ['wagmi', '@tanstack/react-query'],
            rainbowkit: ['@rainbow-me/rainbowkit'],
          },
        },
      },
    },
  }
})
