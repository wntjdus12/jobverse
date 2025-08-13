// Skeletons.jsx
export function SkeletonHeader() {
  return (
    <header className="portfolio-header">
      <div className="skeleton-text" style={{ width: 260, height: 28 }} />
      <div className="skeleton-text" style={{ width: 200, height: 16 }} />
    </header>
  );
}

export function SkeletonSidebar() {
  return (
    <aside className="portfolio-sidebar">
      <div
        className="skeleton-text"
        style={{ width: 120, height: 22, marginBottom: 16 }}
      />
      <div
        className="skeleton-circle"
        style={{ width: 250, height: 250, borderRadius: "50%" }}
      />
      <div
        className="skeleton-text"
        style={{ width: 160, height: 14, marginTop: 16 }}
      />
      <div
        className="skeleton-text"
        style={{ width: 100, height: 14, marginTop: 8 }}
      />
    </aside>
  );
}

export function SkeletonRepoCard() {
  return (
    <div className="repo-card">
      <div className="repo-header">
        <div className="skeleton-text" style={{ width: 180, height: 20 }} />
        <div className="skeleton-text" style={{ width: 80, height: 14 }} />
      </div>
      <div
        className="skeleton-text"
        style={{ width: "100%", height: 14, marginTop: 8 }}
      />
      <div
        className="skeleton-text"
        style={{ width: "85%", height: 14, marginTop: 8 }}
      />
      <div
        className="repo-langs"
        style={{ marginTop: 12, display: "flex", gap: 8 }}
      >
        <div className="skeleton-pill" />
        <div className="skeleton-pill" />
        <div className="skeleton-pill" />
      </div>
      <div className="repo-contrib" style={{ marginTop: 16 }}>
        <div className="contrib-info">
          <div className="skeleton-text" style={{ width: 70, height: 14 }} />
          <div className="skeleton-text" style={{ width: 110, height: 14 }} />
        </div>
        <div className="contrib-bar-bg">
          <div className="skeleton-bar" />
        </div>
      </div>
      <div className="repo-summary" style={{ marginTop: 16 }}>
        <div
          className="skeleton-text"
          style={{ width: 160, height: 18, marginBottom: 10 }}
        />
        <div
          className="skeleton-text"
          style={{ width: "100%", height: 14, marginTop: 6 }}
        />
        <div
          className="skeleton-text"
          style={{ width: "92%", height: 14, marginTop: 6 }}
        />
        <div
          className="skeleton-text"
          style={{ width: "88%", height: 14, marginTop: 6 }}
        />
      </div>
    </div>
  );
}
