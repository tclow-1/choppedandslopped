import type { PlaybackState } from '../types/audio';
import './VinylDisc.css';

interface VinylDiscProps {
  playbackState: PlaybackState;
  isChopped: boolean; // true when ahead source is active (chopped)
}

export function VinylDisc({ playbackState, isChopped }: VinylDiscProps) {
  const isSpinning = playbackState === 'playing';

  console.log('[VinylDisc] isChopped:', isChopped, 'playbackState:', playbackState);

  const renderDisc = (cx: number, isHighlighted: boolean, topLabel: string, bottomLabel: string) => (
    <g>
      {/* Glow effect when highlighted (non-spinning) */}
      {isHighlighted && (
        <circle
          cx={cx}
          cy="128"
          r="125"
          fill="none"
          stroke="#4F4A85"
          strokeWidth="6"
          opacity="0.6"
          className="disc-glow"
        />
      )}

      {/* Spinning disc group */}
      <g className={isSpinning ? 'disc-spinning' : ''} style={{ transformOrigin: `${cx}px 128px` }}>
        {/* Outer black vinyl disc */}
        <circle cx={cx} cy="128" r="120" fill="#1a1a1a" stroke="#0a0a0a" strokeWidth="2" />

        {/* Grooves (concentric circles) */}
        {[110, 100, 90, 80, 70, 60, 50].map((radius) => (
          <circle
            key={radius}
            cx={cx}
            cy="128"
            r={radius}
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="0.5"
            opacity="0.3"
          />
        ))}

        {/* Purple center label */}
        <circle cx={cx} cy="128" r="45" fill="url(#labelGradient)" />

        {/* Center hole */}
        <circle cx={cx} cy="128" r="8" fill="#0a0a0a" />

        {/* Label text - top */}
        <text
          x={cx}
          y="108"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize="10"
          fontWeight="700"
          letterSpacing="1.5"
        >
          {topLabel}
        </text>

        {/* Label text - bottom */}
        <text
          x={cx}
          y="148"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize="10"
          fontWeight="700"
          letterSpacing="1.5"
        >
          {bottomLabel}
        </text>
      </g>
    </g>
  );

  return (
    <div className="vinyl-disc-container-dual">
      <svg
        className="vinyl-disc-dual"
        width="560"
        height="256"
        viewBox="0 0 560 256"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left disc - MAIN (active when not chopped) */}
        {renderDisc(140, !isChopped, 'CHOPPED', 'UP')}

        {/* Right disc - AHEAD (active when chopped) */}
        {renderDisc(420, isChopped, 'SLOPPED', 'UP')}

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
