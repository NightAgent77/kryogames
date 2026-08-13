import type { GamePlatform } from '../../data/games'

const labels: Record<GamePlatform, string> = {
  web: 'Web',
  android: 'Android',
  windows: 'Windows',
  mac: 'Mac',
  ios: 'iOS',
}

interface PlatformIconProps {
  platform: GamePlatform
  className?: string
}

export function PlatformIcon({ platform, className }: PlatformIconProps) {
  const label = labels[platform]

  return (
    <span className={className} title={label} aria-label={label}>
      {platform === 'web' && (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
          <ellipse cx="12" cy="12" rx="4" ry="9" stroke="currentColor" strokeWidth="1.75" />
          <path d="M3.5 12h17" stroke="currentColor" strokeWidth="1.75" />
          <path d="M4.5 7.5h15M4.5 16.5h15" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )}

      {platform === 'android' && (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M7.2 9.2c-.7 0-1.2.5-1.2 1.2v5.8c0 .7.5 1.2 1.2 1.2s1.2-.5 1.2-1.2v-5.8c0-.7-.5-1.2-1.2-1.2Zm9.6 0c-.7 0-1.2.5-1.2 1.2v5.8c0 .7.5 1.2 1.2 1.2s1.2-.5 1.2-1.2v-5.8c0-.7-.5-1.2-1.2-1.2ZM8.1 8.4h7.8c.4 0 .7.3.7.7v7.2c0 .9-.7 1.6-1.6 1.6H9c-.9 0-1.6-.7-1.6-1.6V9.1c0-.4.3-.7.7-.7Zm1.1-3.3.8 1.4h3.9l.8-1.4c.1-.2.4-.3.6-.1.2.1.3.4.1.6l-.7 1.2h.1c1.1 0 2 .9 2 2v.2H7.2v-.2c0-1.1.9-2 2-2h.1l-.7-1.2c-.1-.2 0-.5.2-.6.2-.1.5 0 .6.1Z" />
        </svg>
      )}

      {platform === 'windows' && (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3 5.5 10.2 4.4v7.1H3V5.5Zm8.4-1.3L21 2.8v8.7h-9.6V4.2ZM3 13.5h7.2v7.1L3 19.5v-6Zm8.4 0H21v8.7l-9.6-1.4v-7.3Z" />
        </svg>
      )}

      {platform === 'mac' && (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16.7 12.4c0-2.2 1.8-3.2 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.3-.1-2.6.8-3.3.8-.7 0-1.8-.8-3-.7-1.5 0-2.9.9-3.7 2.3-1.6 2.8-.4 6.9 1.1 9.2.8 1.1 1.7 2.3 2.9 2.3 1.1 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.4-.9-2.4-3.6Zm-2.2-6.5c.6-.8 1.1-1.8.9-2.9-1 .1-2.1.7-2.7 1.5-.6.7-1.1 1.8-.9 2.8 1.1.1 2.1-.5 2.7-1.4Z" />
        </svg>
      )}

      {platform === 'ios' && (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16.2 2H7.8C6.3 2 5 3.3 5 4.8v14.4C5 20.7 6.3 22 7.8 22h8.4c1.5 0 2.8-1.3 2.8-2.8V4.8C19 3.3 17.7 2 16.2 2Zm-4.2 18.2c-.7 0-1.2-.5-1.2-1.2s.5-1.2 1.2-1.2 1.2.5 1.2 1.2-.5 1.2-1.2 1.2Zm4.5-3.4H7.5V5.2h9v11.6Z" />
        </svg>
      )}
    </span>
  )
}
