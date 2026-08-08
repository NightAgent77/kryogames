export function DownloadsSection() {
  return (
    <section
      id="downloads"
      className="section downloads-section"
      aria-labelledby="downloads-heading"
    >
      <div className="downloads-panel">
        <div className="section-header">
          <p className="section-eyebrow">Offline play</p>
          <h2 id="downloads-heading">Downloads</h2>
          <p className="section-lead">
            Standalone builds for macOS, Windows, or Linux can live here when
            you are ready. For now, everything is web-only.
          </p>
        </div>

        <div className="download-placeholder">
          <p>No downloads available yet.</p>
          <button type="button" className="btn btn-secondary" disabled>
            Check back soon
          </button>
        </div>
      </div>
    </section>
  )
}
