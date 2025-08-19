export default function ProgressBar({ progress }) {
  return (
    <div className="progress-bar-container">
      <div className="progress-bar-filler" style={{ width: `${progress}%` }} />
    </div>
  );
}
