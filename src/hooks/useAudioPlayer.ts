import { useState, useRef, useCallback, useEffect } from 'react';
import { useAudioContext } from './useAudioContext';
import { loadAudioFile } from '../utils/audioLoader';
import { createSourceNode } from '../utils/audioNodes';
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

  // Mutable audio objects (refs)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef(0); // AudioContext.currentTime when playback started
  const startOffsetRef = useRef(0); // Position in buffer where playback started
  const animationFrameRef = useRef<number | null>(null);
  const audioUrlRef = useRef<string | null>(null); // Track Object URL for cleanup

  // Load audio file
  const loadFile = useCallback(async (file: File) => {
    if (!audioContext) return;

    try {
      const buffer = await loadAudioFile(file, audioContext);
      audioBufferRef.current = buffer;
      setDuration(buffer.duration);
      setFileName(file.name);
      setPlaybackState('idle');
      setCurrentTime(0);
      startOffsetRef.current = 0;

      // Revoke previous Object URL to prevent memory leak
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      // Create Object URL for Waveform visualization
      const url = URL.createObjectURL(file);
      audioUrlRef.current = url;
      setAudioUrl(url);
    } catch (err) {
      console.error('Failed to load audio file:', err);
      throw err;
    }
  }, [audioContext]);

  // Position tracking with requestAnimationFrame
  const updatePosition = useCallback(() => {
    if (!audioContext || playbackState !== 'playing') return;

    const elapsed = (audioContext.currentTime - startTimeRef.current) * playbackRate;
    const position = startOffsetRef.current + elapsed;

    if (position < duration) {
      setCurrentTime(position);
      animationFrameRef.current = requestAnimationFrame(updatePosition);
    }
  }, [audioContext, playbackState, playbackRate, duration]);

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

  // Play
  const play = useCallback(() => {
    if (!audioContext || !audioBufferRef.current) return;

    // Stop and cleanup previous source
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      sourceNodeRef.current.disconnect();
    }

    // Create GainNode if not exists
    if (!gainNodeRef.current) {
      gainNodeRef.current = audioContext.createGain();
      gainNodeRef.current.connect(audioContext.destination);
    }

    // Set gain to current volume using scheduled method
    const now = audioContext.currentTime;
    gainNodeRef.current.gain.setValueAtTime(volume, now);

    // Create new source node
    const source = createSourceNode(audioContext, audioBufferRef.current, playbackRate);
    source.connect(gainNodeRef.current);

    // Start at correct offset
    source.start(0, startOffsetRef.current);
    startTimeRef.current = audioContext.currentTime;

    sourceNodeRef.current = source;
    setPlaybackState('playing');

    // Handle onended for cleanup
    source.onended = () => {
      if (sourceNodeRef.current === source) {
        source.disconnect();
        sourceNodeRef.current = null;
        setPlaybackState('idle');
        setCurrentTime(0);
        startOffsetRef.current = 0;
        stopPositionTracking();
      }
    };

    // Start position tracking
    startPositionTracking();
  }, [audioContext, playbackRate, volume, startPositionTracking, stopPositionTracking]);

  // Pause
  const pause = useCallback(() => {
    if (!audioContext || !sourceNodeRef.current) return;

    // Calculate current position
    const elapsed = (audioContext.currentTime - startTimeRef.current) * playbackRate;
    const position = startOffsetRef.current + elapsed;
    startOffsetRef.current = Math.min(position, duration);
    setCurrentTime(startOffsetRef.current);

    // Stop and disconnect source
    try {
      sourceNodeRef.current.stop();
    } catch (e) {
      // Ignore if already stopped
    }
    sourceNodeRef.current.disconnect();
    sourceNodeRef.current = null;

    setPlaybackState('paused');
    stopPositionTracking();
  }, [audioContext, playbackRate, duration, stopPositionTracking]);

  // Stop
  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    startOffsetRef.current = 0;
    setCurrentTime(0);
    setPlaybackState('idle');
    stopPositionTracking();
  }, [stopPositionTracking]);

  // Seek
  const seek = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, duration));
    startOffsetRef.current = clampedTime;
    setCurrentTime(clampedTime);

    if (playbackState === 'playing') {
      // Restart playback at new position
      play();
    }
  }, [duration, playbackState, play]);

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
      // Calculate current position first
      const elapsed = (audioContext.currentTime - startTimeRef.current) * playbackRate;
      const position = startOffsetRef.current + elapsed;
      startOffsetRef.current = Math.min(position, duration);
      setCurrentTime(startOffsetRef.current);

      // Restart with new rate
      play();
    }
  }, [audioContext, playbackState, playbackRate, duration, play]);

  // Set volume (with smooth ramping)
  const setVolume = useCallback((vol: number) => {
    const clampedVolume = Math.max(0.0, Math.min(1.0, vol));
    setVolumeState(clampedVolume);

    if (gainNodeRef.current && audioContext) {
      const now = audioContext.currentTime;
      // Use linearRampToValueAtTime to support true silence at 0
      gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, now);
      gainNodeRef.current.gain.linearRampToValueAtTime(clampedVolume, now + 0.05);
    }
  }, [audioContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {
          // Ignore if already stopped
        }
        sourceNodeRef.current.disconnect();
      }
      stopPositionTracking();

      // Revoke Object URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [stopPositionTracking]);

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
  };
}
