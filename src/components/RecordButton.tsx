import type { RecordingState } from '../types/audio';
import './RecordButton.css';

interface RecordButtonProps {
  recordingState: RecordingState;
  recordingDuration: number;
  downloadUrl: string | null;
  fileName: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearRecording: () => void;
  disabled: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function generateFilename(fileName: string | null): string {
  if (!fileName) return 'chopped-recording.mp3';
  const base = fileName.replace(/\.[^/.]+$/, ''); // strip extension
  return `${base}-chopped.mp3`;
}

export function RecordButton({
  recordingState,
  recordingDuration,
  downloadUrl,
  fileName,
  onStartRecording,
  onStopRecording,
  onClearRecording,
  disabled,
}: RecordButtonProps) {
  return (
    <div className="record-controls">
      {recordingState === 'idle' && !downloadUrl && (
        <>
          <button
            className="record-button"
            onClick={onStartRecording}
            disabled={disabled}
          >
            <span className="record-dot" />
            Record
          </button>
          <p className="record-hint">Press Record before Play to capture your mix</p>
        </>
      )}

      {recordingState === 'recording' && (
        <div className="recording-active">
          <span className="record-dot recording-pulse" />
          <span className="recording-time">{formatTime(recordingDuration)}</span>
          <button className="record-stop-button" onClick={onStopRecording}>
            Stop Recording
          </button>
        </div>
      )}

      {recordingState === 'idle' && downloadUrl && (
        <div className="recording-download">
          <a
            href={downloadUrl}
            download={generateFilename(fileName)}
            className="download-button"
          >
            Download MP3
          </a>
          <button className="record-clear-button" onClick={onClearRecording}>
            New Recording
          </button>
        </div>
      )}
    </div>
  );
}
