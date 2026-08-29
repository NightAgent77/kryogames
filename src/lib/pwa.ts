import { registerSW } from 'virtual:pwa-register'

/** Check for a new build whenever the home-screen app is opened or foregrounded. */
export function startPwaAutoUpdate() {
  if (!('serviceWorker' in navigator)) return

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      void updateSW(true)
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return

      const check = () => {
        void registration.update()
      }

      check()
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
      window.addEventListener('pageshow', check)
      window.addEventListener('focus', check)
    },
  })
}
