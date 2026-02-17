import './TapeSlider.css';

interface TapeSliderProps {
  intensity: number;
  onIntensityChange: (intensity: number) => void;
  disabled: boolean;
}

export function TapeSlider({ intensity, onIntensityChange, disabled }: TapeSliderProps) {
  return (
    <div className="tape-slider">
      <div className="tape-value">
        {Math.round(intensity * 100)}%
      </div>
      <label htmlFor="tape-slider">Cassette Effect Intensity (Try 90%)</label>
      <input
        id="tape-slider"
        type="range"
        min="0"
        max="100"
        step="1"
        value={Math.round(intensity * 100)}
        onChange={(e) => onIntensityChange(Number(e.target.value) / 100)}
        disabled={disabled}
      />
    </div>
  );
}
