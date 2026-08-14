export default function AppLoading() {
  return (
    <div className="page-loading" role="status" aria-live="polite" aria-label="Loading page">
      <div className="loading-heading skeleton" />
      <div className="loading-subheading skeleton" />
      <div className="stats loading-stats">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="stat-card" key={index}>
            <div className="loading-label skeleton" />
            <div className="loading-number skeleton" />
          </div>
        ))}
      </div>
      <div className="panel loading-panel">
        <div className="panel-header">
          <div className="loading-label skeleton" />
        </div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="loading-row" key={index}>
            <span className="skeleton" />
            <span className="skeleton" />
            <span className="skeleton" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
