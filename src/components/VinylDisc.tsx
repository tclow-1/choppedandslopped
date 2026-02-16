import type { PlaybackState } from '../types/audio';
import './VinylDisc.css';

interface VinylDiscProps {
  playbackState: PlaybackState;
}

export function VinylDisc({ playbackState }: VinylDiscProps) {
  const isSpinning = playbackState === 'playing';

  return (
    <div className="vinyl-disc-container">
      <svg
        className={`vinyl-disc ${isSpinning ? 'spinning' : ''}`}
        width="256"
        height="256"
        viewBox="0 0 256 256"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer black vinyl disc */}
        <circle cx="128" cy="128" r="120" fill="#1a1a1a" stroke="#0a0a0a" strokeWidth="2" />

        {/* Grooves (concentric circles) */}
        {[110, 100, 90, 80, 70, 60, 50].map((radius) => (
          <circle
            key={radius}
            cx="128"
            cy="128"
            r={radius}
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="0.5"
            opacity="0.3"
          />
        ))}

        {/* Purple center label */}
        <circle cx="128" cy="128" r="45" fill="url(#labelGradient)" />

        {/* Center hole */}
        <circle cx="128" cy="128" r="8" fill="#0a0a0a" />

        {/* Label text */}
        <text
          x="128"
          y="128"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize="12"
          fontWeight="700"
          letterSpacing="2"
        >
          CHOPPED
        </text>

        {/* Gradient definition */}
        <defs>
          <radialGradient id="labelGradient">
            <stop offset="0%" stopColor="#4F4A85" />
            <stop offset="100%" stopColor="#383351" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
