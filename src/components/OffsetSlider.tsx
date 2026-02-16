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
        {offset.toFixed(2)}s
      </div>
      <label htmlFor="offset-slider">Chop Offset</label>
      <input
        id="offset-slider"
        type="range"
        min="0.2"
        max="0.4"
        step="0.01"
        value={offset}
        onChange={(e) => onOffsetChange(parseFloat(e.target.value))}
        disabled={disabled}
      />
    </div>
  );
}
