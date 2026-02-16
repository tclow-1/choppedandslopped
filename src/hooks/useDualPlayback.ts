import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { useAudioContext } from './useAudioContext';
import { createDualSources } from '../utils/audioNodes';
import type { ActivePosition } from '../types/audio';

interface UseDualPlaybackReturn {
  /** Start dual playback from a position */
  startDual: (startPosition: number) => void;
  /** Stop both sources and clean up */
  stopDual: () => void;
  /** Toggle crossfader between main and ahead (instant, click-free) */
  togglePosition: () => void;
  /** Seek to new position during dual playback (preserves crossfader state) */
  seekDual: (newPosition: number) => void;
  /** Update playback rate on both sources */
  updatePlaybackRate: (rate: number) => void;
  /** Update the offset value (ahead position = main + offset) */
  setOffset: (newOffset: number) => void;
  /** Current offset value */
  offset: number;
  /** Whether dual playback sources are currently active */
  isActive: boolean;
}

export function useDualPlayback(
  buffer: AudioBuffer | null,
  playbackRate: number,
  volume: number,
  onEnded?: () => void
): UseDualPlaybackReturn {
  const audioContext = useAudioContext();

  // Persistent GainNodes (created once, reused across play/stop/seek cycles)
  const mainGainRef = useRef<GainNode | null>(null);
  const aheadGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Single-use AudioBufferSourceNodes
  const mainSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const aheadSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Active position tracked via useRef (NOT useState) to prevent double-toggle bugs
  const activePositionRef = useRef<ActivePosition>('main');

  // Offset tracked via useState for reactivity (exposed in return object)
  // Also tracked in ref for immediate reads in callbacks
  const [offset, setOffsetState] = useState(0.5);
  const offsetRef = useRef(0.5);

  // Active state tracked via useState for reactivity (exposed in return object)
  // Also tracked in ref for immediate reads in callbacks
  const [isActive, setIsActiveState] = useState(false);
  const isActiveRef = useRef(false);

  // Store onEnded callback in ref to avoid stale closure issues
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  // Store buffer in ref for use in callbacks
  const bufferRef = useRef(buffer);
  bufferRef.current = buffer;

  // Store playbackRate in ref for use in callbacks
  const playbackRateRef = useRef(playbackRate);
  playbackRateRef.current = playbackRate;

  /** Initialize persistent GainNodes if not yet created */
  const ensureGainNodes = useCallback(() => {
    if (!audioContext) return;

    if (!masterGainRef.current) {
      masterGainRef.current = audioContext.createGain();
      masterGainRef.current.gain.value = volume;
      masterGainRef.current.connect(audioContext.destination);
    }

    if (!mainGainRef.current) {
      mainGainRef.current = audioContext.createGain();
      mainGainRef.current.gain.value = 1;  // Start at 1 (active)
      mainGainRef.current.connect(masterGainRef.current);
    }

    if (!aheadGainRef.current) {
      aheadGainRef.current = audioContext.createGain();
      aheadGainRef.current.gain.value = 0;  // Start at 0 (silent)
      aheadGainRef.current.connect(masterGainRef.current);
    }
  }, [audioContext]);

  /** Clean up existing source nodes (stop + disconnect + null) */
  const cleanupSources = useCallback(() => {
    if (mainSourceRef.current) {
      try { mainSourceRef.current.stop(); } catch (_e) { /* already stopped */ }
      mainSourceRef.current.disconnect();
      mainSourceRef.current = null;
    }
    if (aheadSourceRef.current) {
      try { aheadSourceRef.current.stop(); } catch (_e) { /* already stopped */ }
      aheadSourceRef.current.disconnect();
      aheadSourceRef.current = null;
    }
  }, []);

  /** Start dual playback from a position */
  const startDual = useCallback((startPosition: number) => {
    if (!audioContext) {
      console.error('[useDualPlayback] startDual failed: audioContext is null');
      return;
    }
    if (!bufferRef.current) {
      console.error('[useDualPlayback] startDual failed: buffer is null');
      return;
    }

    // Clean up any existing sources first
    cleanupSources();

    // Ensure GainNodes are initialized
    ensureGainNodes();

    const mainGain = mainGainRef.current!;
    const aheadGain = aheadGainRef.current!;

    // Set initial gain values based on activePositionRef.current
    // Use cancelScheduledValues to clear any pending automation from previous crossfades
    const now = audioContext.currentTime;
    mainGain.gain.cancelScheduledValues(now);
    aheadGain.gain.cancelScheduledValues(now);

    if (activePositionRef.current === 'main') {
      mainGain.gain.setValueAtTime(1.0, now);
      aheadGain.gain.setValueAtTime(0.0, now);
    } else {
      mainGain.gain.setValueAtTime(0.0, now);
      aheadGain.gain.setValueAtTime(1.0, now);
    }

    // Create dual sources via factory
    const dual = createDualSources(
      audioContext,
      bufferRef.current,
      playbackRateRef.current,
      mainGain,
      aheadGain
    );

    // CRITICAL: Start both with SAME 'when' value to prevent drift
    const when = audioContext.currentTime;
    dual.main.start(when, startPosition);
    dual.ahead.start(when, startPosition + offsetRef.current);

    // Store source refs
    mainSourceRef.current = dual.main;
    aheadSourceRef.current = dual.ahead;
    isActiveRef.current = true;
    setIsActiveState(true);

    // Handle onended on main source to detect natural end-of-file
    dual.main.onended = () => {
      // Only handle if this is still the active source (not replaced by seek)
      if (mainSourceRef.current === dual.main) {
        cleanupSources();
        isActiveRef.current = false;
        setIsActiveState(false);
        if (onEndedRef.current) {
          onEndedRef.current();
        }
      }
    };
  }, [audioContext, cleanupSources, ensureGainNodes]);

  /** Stop both sources and clean up */
  const stopDual = useCallback(() => {
    cleanupSources();
    isActiveRef.current = false;
    setIsActiveState(false);
    // Do NOT disconnect GainNodes (they persist)
    // Do NOT reset activePositionRef (preserve crossfader state across stop/start)
  }, [cleanupSources]);

  /** Toggle crossfader between main and ahead (instant, click-free) */
  const togglePosition = useCallback(() => {
    if (!audioContext) return;

    // Check if dual playback is actually active
    if (!isActiveRef.current) {
      console.warn('[useDualPlayback] togglePosition called but dual not active');
      return;
    }

    // Check if gain nodes exist
    const mainGain = mainGainRef.current;
    const aheadGain = aheadGainRef.current;
    if (!mainGain || !aheadGain) {
      console.error('[useDualPlayback] togglePosition failed: gain nodes missing');
      return;
    }

    // Read activePositionRef synchronously to prevent double-toggle bugs
    const current = activePositionRef.current;
    const newPosition: ActivePosition = current === 'main' ? 'ahead' : 'main';

    // Write new value immediately
    activePositionRef.current = newPosition;

    // Apply crossfade using setTargetAtTime with 0.015 time constant (15ms decay)
    const now = audioContext.currentTime;
    if (newPosition === 'ahead') {
      mainGain.gain.setTargetAtTime(0.0, now, 0.015);
      aheadGain.gain.setTargetAtTime(1.0, now, 0.015);
    } else {
      mainGain.gain.setTargetAtTime(1.0, now, 0.015);
      aheadGain.gain.setTargetAtTime(0.0, now, 0.015);
    }
  }, [audioContext]);

  /** Seek to new position during dual playback (preserves crossfader state) */
  const seekDual = useCallback((newPosition: number) => {
    // activePositionRef.current is preserved automatically across cleanup/startDual
    // (startDual reads it to set correct gain values)
    startDual(newPosition);
  }, [startDual]);

  /** Update playback rate on both sources (live, no recreation needed) */
  const updatePlaybackRate = useCallback((rate: number) => {
    if (mainSourceRef.current) {
      mainSourceRef.current.playbackRate.value = rate;
    }
    if (aheadSourceRef.current) {
      aheadSourceRef.current.playbackRate.value = rate;
    }
  }, []);

  /** Update the offset value */
  const setOffset = useCallback((newOffset: number) => {
    offsetRef.current = newOffset;
    setOffsetState(newOffset);
  }, []);

  // Volume sync: update masterGain when volume prop changes
  useEffect(() => {
    if (!masterGainRef.current || !audioContext) return;

    const now = audioContext.currentTime;
    masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
    masterGainRef.current.gain.linearRampToValueAtTime(volume, now + 0.05);
  }, [volume, audioContext]);

  // Initialize gain nodes when buffer is loaded
  useEffect(() => {
    if (buffer && audioContext) {
      ensureGainNodes();
    }
  }, [buffer, audioContext, ensureGainNodes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop both sources
      cleanupSources();

      // Disconnect all GainNodes
      if (mainGainRef.current) {
        mainGainRef.current.disconnect();
        mainGainRef.current = null;
      }
      if (aheadGainRef.current) {
        aheadGainRef.current.disconnect();
        aheadGainRef.current = null;
      }
      if (masterGainRef.current) {
        masterGainRef.current.disconnect();
        masterGainRef.current = null;
      }
    };
  }, [cleanupSources]);

  return useMemo(() => ({
    startDual,
    stopDual,
    togglePosition,
    seekDual,
    updatePlaybackRate,
    setOffset,
    offset,
    isActive,
  }), [startDual, stopDual, togglePosition, seekDual, updatePlaybackRate, setOffset, offset, isActive]);
}
