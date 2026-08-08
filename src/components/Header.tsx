const navLinks = [
  { href: '#games', label: 'Games' },
  { href: '#about', label: 'About' },
  { href: '#downloads', label: 'Downloads' },
]

export function Header() {
  return (
    <header className="site-header">
      <a href="#" className="logo" aria-label="KyroGames home">
        <span className="logo-mark" aria-hidden="true">
          K
        </span>
        <span className="logo-text">
          Kyro<span className="logo-accent">Games</span>
        </span>
      </a>

      <nav className="site-nav" aria-label="Main">
        <ul>
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
