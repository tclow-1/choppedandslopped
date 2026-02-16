import { useState } from 'react';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { AudioUpload } from './components/AudioUpload';
import { VinylDisc } from './components/VinylDisc';
import { Waveform } from './components/Waveform';
import { PlaybackControls } from './components/PlaybackControls';
import { SpeedSlider } from './components/SpeedSlider';
import { OffsetSlider } from './components/OffsetSlider';
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
    toggleChop,
    setChopOffset,
    chopOffset,
    isDualActive,
  } = useAudioPlayer();

  const hasFile = fileName !== null;

  // Chop markers state - populated during live performance
  const [chopMarkerTimes, setChopMarkerTimes] = useState<number[]>([]);

  // Wrap loadFile to clear markers and reset crossfader on new file load
  const handleFileLoad = async (file: File) => {
    setChopMarkerTimes([]); // Clear markers on new file
    await loadFile(file);
    // Per user decision: reset to main position on new file load
    // Offset slider value persists (not reset)
    // Note: useDualPlayback's activePositionRef defaults to 'main',
    // and loadFile triggers new buffer which reinitializes the hook
  };

  // Wrap stop to also clear chop markers
  const handleStop = () => {
    stop();
    setChopMarkerTimes([]);
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
        handleStop();
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
    'Shift': () => {
      // Per user decision: chop key only works while audio is playing
      if (hasFile && playbackState === 'playing') {
        toggleChop();
        // Record chop marker at current playback position
        setChopMarkerTimes(prev => [...prev, currentTime]);
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
        <VinylDisc playbackState={playbackState} isChopped={isDualActive} />
      )}

      <PlaybackControls
        playbackState={playbackState}
        onPlay={play}
        onPause={pause}
        onStop={handleStop}
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

      <OffsetSlider
        offset={chopOffset}
        onOffsetChange={setChopOffset}
        disabled={!hasFile}
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

      <KeyboardLegend />
    </div>
  );
}

export default App;
