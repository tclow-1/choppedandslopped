import './VolumeSlider.css';

interface VolumeSliderProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  disabled: boolean;
}

export function VolumeSlider({ volume, onVolumeChange, disabled }: VolumeSliderProps) {
  return (
    <div className="volume-slider">
      <div className="volume-value">
        {Math.round(volume * 100)}%
      </div>
      <label htmlFor="volume-slider">Volume</label>
      <input
        id="volume-slider"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        disabled={disabled}
      />
    </div>
  );
}
