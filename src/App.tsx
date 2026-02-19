import { useState } from 'react';
import logo from './assets/choppedandslopped.png';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { AudioUpload } from './components/AudioUpload';
import { YoutubeInput } from './components/YoutubeInput';
import { VinylDisc } from './components/VinylDisc';
import { Waveform } from './components/Waveform';
import { PlaybackControls } from './components/PlaybackControls';
import { SpeedSlider } from './components/SpeedSlider';
import { VolumeSlider } from './components/VolumeSlider';
import { OffsetSlider } from './components/OffsetSlider';
import { TapeSlider } from './components/TapeSlider';
import { RecordButton } from './components/RecordButton';
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
    chopPosition,
    tapeEffectIntensity,
    setTapeEffectIntensity,
    recordingState,
    recordingDownloadUrl,
    recordingDuration,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioPlayer();

  const hasFile = fileName !== null;

  // Chop markers state - populated during live performance
  const [chopMarkerTimes, setChopMarkerTimes] = useState<number[]>([]);

  // Wrap loadFile to clear markers and reset crossfader on new file load
  const handleFileLoad = async (file: File) => {
    setChopMarkerTimes([]); // Clear markers on new file
    clearRecording(); // Clear any previous recording
    await loadFile(file);
    // Per user decision: reset to main position on new file load
    // Offset slider value persists (not reset)
    // Note: useDualPlayback's activePositionRef defaults to 'main',
    // and loadFile triggers new buffer which reinitializes the hook
  };

  // Wrap stop to also clear chop markers and stop recording
  const handleStop = () => {
    if (recordingState === 'recording') {
      stopRecording();
    }
    stop();
    setChopMarkerTimes([]);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'Enter': () => {
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
    ' ': () => {
      // Chop key only works while audio is playing
      if (hasFile && playbackState === 'playing') {
        toggleChop();
        // Record chop marker at current playback position
        setChopMarkerTimes(prev => [...prev, currentTime]);
      }
    },
    'r': () => {
      if (hasFile) {
        if (recordingState === 'recording') {
          stopRecording();
        } else {
          startRecording();
        }
      }
    },
  });

  return (
    <div className="app-container" tabIndex={0}>
      <a href="https://screweduprecords.com/" target="_blank" rel="noopener noreferrer">
        <img src={logo} alt="Chopped & Slopped App" className="app-logo" />
      </a>

      <AudioUpload
        onFileLoad={handleFileLoad}
        fileName={fileName}
      />

      {hasFile && (
        <VinylDisc playbackState={playbackState} isChopped={chopPosition === 'ahead'} />
      )}

      <PlaybackControls
        playbackState={playbackState}
        onPlay={play}
        onPause={pause}
        onStop={handleStop}
        onChop={() => {
          if (playbackState === 'playing') {
            toggleChop();
            setChopMarkerTimes(prev => [...prev, currentTime]);
          }
        }}
        disabled={!hasFile}
      />

      <RecordButton
        recordingState={recordingState}
        recordingDuration={recordingDuration}
        downloadUrl={recordingDownloadUrl}
        fileName={fileName}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onClearRecording={clearRecording}
        disabled={!hasFile}
      />

      <VolumeSlider
        volume={volume}
        onVolumeChange={setVolume}
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

      <TapeSlider
        intensity={tapeEffectIntensity}
        onIntensityChange={setTapeEffectIntensity}
        disabled={!hasFile}
      />

      {hasFile && (
        <p className="waveform-hint">Click anywhere on the waveform below to seek</p>
      )}

      {hasFile && (
        <Waveform
          audioUrl={audioUrl}
          currentTime={currentTime}
          duration={duration}
          onSeek={seek}
          chopMarkerTimes={chopMarkerTimes}
        />
      )}

      <YoutubeInput
        disabled={playbackState === 'playing'}
      />

      <KeyboardLegend />
    </div>
  );
}

export default App;
