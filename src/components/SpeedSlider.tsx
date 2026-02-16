import './SpeedSlider.css';

interface SpeedSliderProps {
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  disabled: boolean;
}

export function SpeedSlider({ playbackRate, onPlaybackRateChange, disabled }: SpeedSliderProps) {
  return (
    <div className="speed-slider">
      <div className="speed-percentage">
        {Math.round(playbackRate * 100)}%
      </div>
      <label htmlFor="speed-slider">Screw Level</label>
      <input
        id="speed-slider"
        type="range"
        min="0.5"
        max="1.0"
        step="0.05"
        value={playbackRate}
        onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
        disabled={disabled}
      />
    </div>
  );
}
