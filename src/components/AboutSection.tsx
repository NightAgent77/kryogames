export function AboutSection() {
  return (
    <section id="about" className="section about-section" aria-labelledby="about-heading">
      <div className="about-grid">
        <div className="section-header about-copy">
          <p className="section-eyebrow">Studio</p>
          <h2 id="about-heading">About KyroGames</h2>
          <p className="section-lead">
            KyroGames is a personal studio for browser-native games — quick to
            load, easy to share, and built with modern web tech. The catalog
            will grow as new projects are finished.
          </p>
        </div>

        <ul className="about-features">
          <li>
            <strong>Web-first</strong>
            <span>Games run directly in the browser — no launcher required.</span>
          </li>
          <li>
            <strong>Lightweight</strong>
            <span>Small, focused experiences designed for fast sessions.</span>
          </li>
          <li>
            <strong>Download-ready</strong>
            <span>
              Optional desktop builds can be linked here when you want offline
              play.
            </span>
          </li>
        </ul>
      </div>
    </section>
  )
}
