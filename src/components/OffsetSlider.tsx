import './OffsetSlider.css';

interface OffsetSliderProps {
  offset: number;
  onOffsetChange: (offset: number) => void;
  disabled: boolean;
}

export function OffsetSlider({ offset, onOffsetChange, disabled }: OffsetSliderProps) {
  return (
    <div className="offset-slider">
      <div className="offset-value">
        {offset.toFixed(1)}s
      </div>
      <label htmlFor="offset-slider">Chop Offset</label>
      <input
        id="offset-slider"
        type="range"
        min="0.1"
        max="2.0"
        step="0.1"
        value={offset}
        onChange={(e) => onOffsetChange(parseFloat(e.target.value))}
        disabled={disabled}
      />
    </div>
  );
}
