import { useEffect, useRef, useMemo } from 'react';
import { getAccessibleMarkerColor } from '../utils/colorContrast';

interface ChopMarkerOverlayProps {
  markerTimes: number[];    // Array of chop timestamps in seconds
  duration: number;         // Total audio duration in seconds
  waveformColor: string;    // Waveform background color for contrast calculation
}

export function ChopMarkerOverlay({
  markerTimes,
  duration,
  waveformColor,
}: ChopMarkerOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate marker color once when waveform color changes
  const markerColor = useMemo(
    () => getAccessibleMarkerColor(waveformColor),
    [waveformColor]
  );

  // Draw markers whenever markerTimes, duration, or canvas size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawMarkers = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Handle high-DPI displays
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);

      // Clear canvas
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Early return if nothing to draw
      if (markerTimes.length === 0 || duration <= 0) return;

      // Configure line style per user decision
      ctx.strokeStyle = markerColor;
      ctx.lineWidth = 2; // Medium thickness
      ctx.setLineDash([8, 6]); // Medium dashed: 8px dash, 6px gap

      // Draw vertical line at each marker time
      markerTimes.forEach((time) => {
        const x = (time / duration) * rect.width;

        ctx.beginPath();
        ctx.moveTo(x, 0); // Top of waveform
        ctx.lineTo(x, rect.height); // Bottom of waveform (full height)
        ctx.stroke();
      });
    };

    drawMarkers();

    // Redraw on window resize
    const resizeObserver = new ResizeObserver(() => {
      drawMarkers();
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, [markerTimes, duration, markerColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // CRITICAL: let clicks pass through to waveform
        zIndex: 10, // Above waveform, below playback cursor
      }}
    />
  );
}
