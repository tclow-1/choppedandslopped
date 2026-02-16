import { useState, useRef, useCallback, useEffect } from 'react';
import { useAudioContext } from './useAudioContext';
import { useDualPlayback } from './useDualPlayback';
import { loadAudioFile } from '../utils/audioLoader';
import { loadYoutubeAudio } from '../utils/youtubeExtractor';
import type { PlaybackState, AudioPlayerState, AudioPlayerControls } from '../types/audio';
import type { YoutubeLoadState } from '../types/youtube';

/**
 * Convert AudioBuffer to WAV Blob for Waveform visualization
 * Creates a WAV file in memory from the decoded AudioBuffer
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const bufferSize = 44 + dataSize; // WAV header (44 bytes) + data

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // Helper to write string as ASCII bytes
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true); // File size - 8
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write interleaved PCM samples
  const channelData: Float32Array[] = [];
  for (let channel = 0; channel < numberOfChannels; channel++) {
    channelData.push(buffer.getChannelData(channel));
  }

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      // Convert float [-1, 1] to 16-bit signed integer [-32768, 32767]
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export function useAudioPlayer(): AudioPlayerState & AudioPlayerControls {
  const audioContext = useAudioContext();

  // State management
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(0.75);
  const [volume, setVolumeState] = useState(1.0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [youtubeLoadState, setYoutubeLoadState] = useState<YoutubeLoadState>({ status: 'idle' });

  // AudioBuffer tracked in both ref (for synchronous access) and state (for useDualPlayback re-init)
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  // Mutable tracking refs
  const startTimeRef = useRef(0); // AudioContext.currentTime when playback started
  const startOffsetRef = useRef(0); // Position in buffer where playback started
  const animationFrameRef = useRef<number | null>(null);
  const audioUrlRef = useRef<string | null>(null); // Track Object URL for cleanup

  // Ref to track playbackRate for position calculation in callbacks
  const playbackRateRef = useRef(playbackRate);
  playbackRateRef.current = playbackRate;

  // Ref for animation frame cleanup to avoid circular dependency with handleDualEnded
  const stopTrackingRef = useRef<() => void>(() => {});

  // Ref to hold latest updatePosition callback (avoids stale closure in RAF loop)
  const updatePositionRef = useRef<(() => void) | null>(null);

  // onEnded callback for dual playback - signals natural end-of-file
  const handleDualEnded = useCallback(() => {
    setPlaybackState('idle');
    setCurrentTime(0);
    startOffsetRef.current = 0;
    stopTrackingRef.current();
  }, []);

  // Initialize dual playback engine
  const dual = useDualPlayback(audioBuffer, playbackRate, volume, handleDualEnded);

  // Load audio file
  const loadFile = useCallback(async (file: File) => {
    if (!audioContext) return;

    try {
      const buffer = await loadAudioFile(file, audioContext);
      audioBufferRef.current = buffer;
      setAudioBuffer(buffer);
      setDuration(buffer.duration);
      setFileName(file.name);
      setPlaybackState('idle');
      setCurrentTime(0);
      startOffsetRef.current = 0;

      console.log('[useAudioPlayer] File loaded:', {
        fileName: file.name,
        duration: buffer.duration,
        bufferSet: !!audioBufferRef.current
      });

      // Revoke previous Object URL to prevent memory leak
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      // Create Object URL for Waveform visualization
      const url = URL.createObjectURL(file);
      audioUrlRef.current = url;
      setAudioUrl(url);
    } catch (err) {
      console.error('[useAudioPlayer] Failed to load audio file:', err);
      throw err;
    }
  }, [audioContext]);

  // Load YouTube audio
  const loadYoutube = useCallback(async (youtubeUrl: string) => {
    if (!audioContext) return;

    try {
      setYoutubeLoadState({ status: 'loading', stage: 'Starting...' });

      const { audioBuffer: buffer, title } = await loadYoutubeAudio(
        youtubeUrl,
        audioContext,
        (stage) => setYoutubeLoadState({ status: 'loading', stage })
      );

      audioBufferRef.current = buffer;
      setAudioBuffer(buffer);
      setDuration(buffer.duration);
      setFileName(title);
      setPlaybackState('idle');
      setCurrentTime(0);
      startOffsetRef.current = 0;

      console.log('[useAudioPlayer] YouTube audio loaded:', {
        title,
        duration: buffer.duration,
        bufferSet: !!audioBufferRef.current
      });

      // Revoke previous Object URL to prevent memory leak
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      // Create WAV blob from AudioBuffer for Waveform visualization
      // Wavesurfer needs a URL to render waveform
      const wavBlob = audioBufferToWavBlob(buffer);
      const url = URL.createObjectURL(wavBlob);
      audioUrlRef.current = url;
      setAudioUrl(url);

      setYoutubeLoadState({ status: 'success', title });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error loading YouTube audio';
      setYoutubeLoadState({ status: 'error', error: message });
      console.error('[useAudioPlayer] YouTube load failed:', err);
    }
  }, [audioContext]);

  // Position tracking with requestAnimationFrame
  const updatePosition = useCallback(() => {
    if (!audioContext || playbackState !== 'playing') return;

    const elapsed = (audioContext.currentTime - startTimeRef.current) * playbackRateRef.current;
    const position = startOffsetRef.current + elapsed;

    if (position < duration) {
      setCurrentTime(position);
      // Call the ref version to get latest closure
      animationFrameRef.current = requestAnimationFrame(() => {
        updatePositionRef.current?.();
      });
    } else {
      // End of track
      dual.stopDual();
      setPlaybackState('idle');
      setCurrentTime(duration);
      startOffsetRef.current = 0;
    }
  }, [audioContext, playbackState, duration, dual]);

  // Keep ref in sync with latest callback
  updatePositionRef.current = updatePosition;

  // Start position tracking loop
  const startPositionTracking = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(updatePosition);
  }, [updatePosition]);

  // Stop position tracking loop
  const stopPositionTracking = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Keep stopTrackingRef in sync with latest stopPositionTracking
  stopTrackingRef.current = stopPositionTracking;

  // Play
  const play = useCallback(async () => {
    if (!audioContext || !audioBufferRef.current) return;

    // Resume AudioContext if suspended (autoplay policy)
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (err) {
        console.error('[useAudioPlayer] Failed to resume AudioContext:', err);
        return;
      }
    }

    // Start dual playback from current offset
    dual.startDual(startOffsetRef.current);

    // Track timing for position calculation
    startTimeRef.current = audioContext.currentTime;

    setPlaybackState('playing');
    startPositionTracking();
  }, [audioContext, dual, startPositionTracking, audioBuffer]);

  // Pause
  const pause = useCallback(() => {
    if (!audioContext) return;

    // Calculate current position
    const elapsed = (audioContext.currentTime - startTimeRef.current) * playbackRateRef.current;
    const position = startOffsetRef.current + elapsed;
    startOffsetRef.current = Math.min(position, duration);
    setCurrentTime(startOffsetRef.current);

    // Stop dual playback
    dual.stopDual();

    setPlaybackState('paused');
    stopPositionTracking();
  }, [audioContext, duration, dual, stopPositionTracking, audioBuffer]);

  // Stop
  const stop = useCallback(() => {
    // Stop dual playback
    dual.stopDual();

    startOffsetRef.current = 0;
    setCurrentTime(0);
    setPlaybackState('idle');
    stopPositionTracking();
  }, [dual, stopPositionTracking, audioBuffer]);

  // Seek
  const seek = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, duration));
    startOffsetRef.current = clampedTime;
    setCurrentTime(clampedTime);

    if (playbackState === 'playing' && audioContext) {
      // seekDual handles cleanup and restart, preserving crossfader state
      dual.seekDual(clampedTime);
      startTimeRef.current = audioContext.currentTime;
    }
  }, [duration, playbackState, audioContext, dual]);

  // Seek relative
  const seekRelative = useCallback((delta: number) => {
    const newPosition = currentTime + delta;
    seek(newPosition);
  }, [currentTime, seek]);

  // Set playback rate (snap to 5% increments)
  const setPlaybackRate = useCallback((rate: number) => {
    // Clamp to [0.5, 1.0]
    const clampedRate = Math.max(0.5, Math.min(1.0, rate));
    // Snap to nearest 0.05 increment
    const snappedRate = Math.round(clampedRate / 0.05) * 0.05;

    setPlaybackRateState(snappedRate);

    if (playbackState === 'playing' && audioContext) {
      // Calculate current position from elapsed time
      const elapsed = (audioContext.currentTime - startTimeRef.current) * playbackRateRef.current;
      const position = startOffsetRef.current + elapsed;
      startOffsetRef.current = Math.min(position, duration);
      setCurrentTime(startOffsetRef.current);

      // Update start time reference for new rate calculation
      startTimeRef.current = audioContext.currentTime;

      // Update rate on both sources live (no recreation needed)
      dual.updatePlaybackRate(snappedRate);
    }
  }, [audioContext, playbackState, duration, dual]);

  // Set volume (with smooth ramping handled by useDualPlayback via useEffect)
  const setVolume = useCallback((vol: number) => {
    const clampedVolume = Math.max(0.0, Math.min(1.0, vol));
    setVolumeState(clampedVolume);
    // Volume sync to masterGain is handled by useDualPlayback's volume useEffect
  }, []);

  // Cleanup audio sources on unmount only
  // Store refs for cleanup to avoid running on every dependency change
  const dualRef = useRef(dual);
  dualRef.current = dual;

  useEffect(() => {
    return () => {
      dualRef.current.stopDual();
      stopTrackingRef.current();
    };
  }, []); // Empty deps - only run on mount/unmount

  // Cleanup blob URL on unmount only (not when dual changes)
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []); // Empty deps - only run on unmount

  return {
    // State
    playbackState,
    currentTime,
    duration,
    playbackRate,
    volume,
    fileName,
    audioUrl,
    youtubeLoadState,
    // Controls
    loadFile,
    loadYoutube,
    play,
    pause,
    stop,
    seek,
    seekRelative,
    setPlaybackRate,
    setVolume,
    // Dual playback controls (for Phase 3 UI wiring)
    toggleChop: dual.togglePosition,
    setChopOffset: dual.setOffset,
    chopOffset: dual.offset,
    isDualActive: dual.isActive,
    chopPosition: dual.activePosition,
  };
}
