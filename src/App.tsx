import { useState } from 'react';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { AudioUpload } from './components/AudioUpload';
import { Waveform } from './components/Waveform';
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
    audioUrl,
    loadFile,
    play,
    pause,
    stop,
    seek,
    seekRelative,
    setPlaybackRate,
    setVolume,
  } = useAudioPlayer();

  const hasFile = fileName !== null;

  // Chop markers state - Phase 3 will populate this array
  const [chopMarkerTimes, setChopMarkerTimes] = useState<number[]>([]);

  // Wrap loadFile to clear markers on new file load
  const handleFileLoad = async (file: File) => {
    setChopMarkerTimes([]); // Clear markers on new file
    await loadFile(file);

    // DEV TEST: Add test markers for checkpoint verification
    // Phase 3 will populate this array during live performance
    setTimeout(() => {
      setChopMarkerTimes([2, 5, 10]); // Add markers at 2s, 5s, 10s for testing
    }, 500);
  };

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
        onFileLoad={handleFileLoad}
        fileName={fileName}
      />

      {hasFile && (
        <Waveform
          audioUrl={audioUrl}
          currentTime={currentTime}
          duration={duration}
          onSeek={seek}
          chopMarkerTimes={chopMarkerTimes}
        />
      )}

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
