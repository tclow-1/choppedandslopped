import './KeyboardLegend.css';

export function KeyboardLegend() {
  return (
    <div className="keyboard-legend">
      <h3>Keyboard Shortcuts</h3>
      <div className="shortcut-list">
        <div className="shortcut-item">
          <kbd>Space</kbd>
          <span>Play/Pause</span>
        </div>
        <div className="shortcut-item">
          <kbd>Home</kbd>
          <span>Stop</span>
        </div>
        <div className="shortcut-item">
          <kbd>←</kbd>
          <span>Seek -5s</span>
        </div>
        <div className="shortcut-item">
          <kbd>→</kbd>
          <span>Seek +5s</span>
        </div>
        <div className="shortcut-item disabled">
          <kbd>Shift</kbd>
          <span>Chop (coming soon)</span>
        </div>
      </div>
    </div>
  );
}
