// The compass is part of the background image; the rings pulse around it.
export default function Startup() {
  return (
    <div className="splash" role="status" aria-label="Loading Explora">
      <span className="splash-ring" aria-hidden="true" />
      <span className="splash-ring" aria-hidden="true" />
      <div className="splash-content">
        <h1 className="splash-title">Explora</h1>
        <p className="splash-sub">Discover places worth visiting</p>
      </div>
    </div>
  );
}
