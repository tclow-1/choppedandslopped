import { useState, useRef, useCallback, useEffect } from 'react';
import { useAudioContext } from './useAudioContext';
import { useDualPlayback } from './useDualPlayback';
import { loadAudioFile } from '../utils/audioLoader';
import type { PlaybackState, AudioPlayerState, AudioPlayerControls } from '../types/audio';

export function useAudioPlayer(): AudioPlayerState & AudioPlayerControls {
  const audioContext = useAudioContext();

  // State management
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1.0);
  const [volume, setVolumeState] = useState(1.0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

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

  // Position tracking with requestAnimationFrame
  const updatePosition = useCallback(() => {
    if (!audioContext || playbackState !== 'playing') return;

    const elapsed = (audioContext.currentTime - startTimeRef.current) * playbackRateRef.current;
    const position = startOffsetRef.current + elapsed;

    if (position < duration) {
      setCurrentTime(position);
      animationFrameRef.current = requestAnimationFrame(updatePosition);
    }
  }, [audioContext, playbackState, duration]);

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
  const play = useCallback(() => {
    if (!audioContext || !audioBufferRef.current) return;

    // Resume AudioContext if suspended (autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(err => {
        console.error('[useAudioPlayer] Failed to resume AudioContext:', err);
      });
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

  // Cleanup audio sources when dual playback changes
  useEffect(() => {
    return () => {
      dual.stopDual();
      stopPositionTracking();
    };
  }, [dual, stopPositionTracking]);

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
    // Controls
    loadFile,
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
  };
}
