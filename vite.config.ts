import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite 8 minifies CSS with LightningCSS, which drops unprefixed
 * `backdrop-filter` when `-webkit-backdrop-filter` is also declared.
 * Chromium/Firefox ignore the webkit-only form, so intro/auth frost
 * vanishes on kryogames.com while `npm run dev` still looks correct.
 */
function preserveBackdropFilter(): Plugin {
  const pair = (value: string, end: string) =>
    `-webkit-backdrop-filter:${value};backdrop-filter:${value}${end}`

  return {
    name: 'preserve-backdrop-filter',
    generateBundle(_options, bundle) {
      for (const item of Object.values(bundle)) {
        if (item.type !== 'asset' || !item.fileName.endsWith('.css')) continue
        if (typeof item.source !== 'string') continue
        item.source = item.source
          .replace(
            /-webkit-backdrop-filter:([^;{}]+)(;|})/g,
            (_m, value: string, end: string) => pair(value, end),
          )
          .replace(
            /(?<!-webkit-)backdrop-filter:([^;{}]+)(;|})/g,
            (m, value: string, end: string, offset: number, src: string) => {
              const prev = src.slice(Math.max(0, offset - value.length - 32), offset)
              if (prev.endsWith(`-webkit-backdrop-filter:${value};`)) return m
              return pair(value, end)
            },
          )
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), preserveBackdropFilter()],
})
