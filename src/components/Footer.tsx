export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <p>
        &copy; {year} KyroGames. Built for the web.
      </p>
      <p className="footer-note">More games coming soon.</p>
    </footer>
  )
}
