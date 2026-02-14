import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { AudioUpload } from './components/AudioUpload';
import { PlaybackControls } from './components/PlaybackControls';
import { SpeedSlider } from './components/SpeedSlider';
import { KeyboardLegend } from './components/KeyboardLegend';
import './App.css';

function App() {
  const {
    playbackState,
    currentTime,
    duration,
    playbackRate,
    volume,
    fileName,
    loadFile,
    play,
    pause,
    stop,
    seekRelative,
    setPlaybackRate,
    setVolume,
  } = useAudioPlayer();

  const hasFile = fileName !== null;

  // Keyboard shortcuts
  useKeyboardShortcuts({
    ' ': () => {
      if (hasFile) {
        playbackState === 'playing' ? pause() : play();
      }
    },
    'Home': () => {
      if (hasFile) {
        stop();
      }
    },
    'ArrowLeft': () => {
      if (hasFile) {
        seekRelative(-5);
      }
    },
    'ArrowRight': () => {
      if (hasFile) {
        seekRelative(5);
      }
    },
  });

  return (
    <div className="app-container" tabIndex={0}>
      <h1>ChoppedApp</h1>

      <AudioUpload
        onFileLoad={loadFile}
        fileName={fileName}
      />

      <PlaybackControls
        playbackState={playbackState}
        onPlay={play}
        onPause={pause}
        onStop={stop}
        volume={volume}
        onVolumeChange={setVolume}
        currentTime={currentTime}
        duration={duration}
        disabled={!hasFile}
      />

      <SpeedSlider
        playbackRate={playbackRate}
        onPlaybackRateChange={setPlaybackRate}
        disabled={!hasFile}
      />

      <KeyboardLegend />
    </div>
  );
}

export default App;
