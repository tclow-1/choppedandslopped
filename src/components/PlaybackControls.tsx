import type { PlaybackState } from '../types/audio';
import './PlaybackControls.css';

interface PlaybackControlsProps {
  playbackState: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  currentTime: number;
  duration: number;
  disabled: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function PlaybackControls({
  playbackState,
  onPlay,
  onPause,
  onStop,
  volume,
  onVolumeChange,
  currentTime,
  duration,
  disabled
}: PlaybackControlsProps) {
  const isPlaying = playbackState === 'playing';

  return (
    <div className="playback-controls">
      <div className="controls-buttons">
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={disabled}
          className="control-button"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={onStop}
          disabled={disabled}
          className="control-button"
        >
          Stop
        </button>
      </div>

      <div className="time-display">
        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>

      <div className="volume-control">
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
    </div>
  );
}
