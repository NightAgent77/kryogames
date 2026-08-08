export function getSiteUrl() {
  const configured = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '')
  if (configured) return configured
  return window.location.origin
}
