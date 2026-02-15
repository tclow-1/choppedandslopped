import { useEffect, useRef, useState } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import './Waveform.css';

interface WaveformProps {
  audioUrl: string | null;       // Object URL for wavesurfer to render waveform from
  currentTime: number;           // Phase 1 playback position (seconds) -- drives cursor
  duration: number;              // Total duration from Phase 1
  onSeek?: (time: number) => void;  // Called when user clicks waveform to seek
  onWaveformReady?: () => void;     // Called when waveform finishes rendering
}

export function Waveform({
  audioUrl,
  currentTime,
  onSeek,
  onWaveformReady,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const lastSeekTimeRef = useRef<number>(0); // Track last seek time for debouncing
  const isUserSeekingRef = useRef(false); // Track if user is actively seeking

  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    waveColor: '#4F4A85',        // Purple waveform
    progressColor: '#383351',    // Darker purple for played portion
    cursorColor: '#ff4444',      // Red playback cursor - high visibility
    cursorWidth: 2,
    height: 128,
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    normalize: true,
    interact: true,              // Click-to-seek enabled
    dragToSeek: true,
    url: audioUrl || undefined,
  });

  // Mute wavesurfer audio output -- all sound comes from Phase 1 AudioBufferSourceNode
  useEffect(() => {
    if (!wavesurfer) return;

    const handleReady = () => {
      wavesurfer.setVolume(0); // Mute wavesurfer's internal audio element
      setIsReady(true);
      onWaveformReady?.();
    };

    wavesurfer.on('ready', handleReady);

    return () => {
      wavesurfer.un('ready', handleReady);
    };
  }, [wavesurfer, onWaveformReady]);

  // Sync cursor to Phase 1 playback position
  useEffect(() => {
    if (!wavesurfer || !isReady) return;

    const wsDuration = wavesurfer.getDuration();
    if (wsDuration <= 0) return;

    // Skip update if user is actively seeking to prevent feedback loop
    if (isUserSeekingRef.current) return;

    // Sync cursor position from Phase 1 currentTime
    wavesurfer.setTime(currentTime);
  }, [wavesurfer, isReady, currentTime]);

  // Handle click-to-seek (user clicks waveform)
  useEffect(() => {
    if (!wavesurfer) return;

    const handleSeeking = (seekTime: number) => {
      const now = Date.now();

      // Debounce: ignore seeks within 100ms to prevent rapid-fire calls
      if (now - lastSeekTimeRef.current < 100) return;
      lastSeekTimeRef.current = now;

      // Mark user as actively seeking
      isUserSeekingRef.current = true;

      // Call Phase 1 seek
      onSeek?.(seekTime);

      // Clear seeking flag after short delay to allow cursor sync to resume
      setTimeout(() => {
        isUserSeekingRef.current = false;
      }, 150);
    };

    wavesurfer.on('seeking', handleSeeking);

    return () => {
      wavesurfer.un('seeking', handleSeeking);
    };
  }, [wavesurfer, onSeek]);

  // Handle audioUrl changes
  useEffect(() => {
    if (!wavesurfer) return;

    if (audioUrl === null) {
      wavesurfer.empty();
      setIsReady(false);
    } else {
      // Load is handled by useWavesurfer hook via url prop
      setIsReady(false);
    }
  }, [wavesurfer, audioUrl]);

  return (
    <div className="waveform-wrapper">
      <div ref={containerRef} />
    </div>
  );
}
