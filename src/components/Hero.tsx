export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-content">
        <p className="hero-eyebrow">Indie game studio</p>
        <h1 id="hero-heading">
          Play in the browser.
          <span className="hero-highlight"> Built for the web.</span>
        </h1>
        <p className="hero-lead">
          KryoGames is a home for small games you can launch instantly — no
          install required. Some titles may also be available as downloads
          later.
        </p>
        <div className="hero-actions">
          <a href="#games" className="btn btn-primary">
            Browse games
          </a>
          <a href="#about" className="btn btn-secondary">
            Learn more
          </a>
        </div>
      </div>

      <div className="hero-visual" aria-hidden="true">
        <div className="hero-cube">
          <div className="cube-face cube-front" />
          <div className="cube-face cube-back" />
          <div className="cube-face cube-right" />
          <div className="cube-face cube-left" />
          <div className="cube-face cube-top" />
          <div className="cube-face cube-bottom" />
        </div>
      </div>
    </section>
  )
}
