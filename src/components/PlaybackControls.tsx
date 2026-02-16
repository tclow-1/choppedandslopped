import type { PlaybackState } from '../types/audio';
import './PlaybackControls.css';

interface PlaybackControlsProps {
  playbackState: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onChop: () => void;
  disabled: boolean;
}

export function PlaybackControls({
  playbackState,
  onPlay,
  onPause,
  onStop,
  onChop,
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
        <button
          onClick={onChop}
          disabled={disabled || !isPlaying}
          className="control-button"
        >
          Chop
        </button>
      </div>
    </div>
  );
}
