// TypeScript type definitions for the audio system

export type PlaybackState = 'idle' | 'playing' | 'paused';

export interface AudioPlayerState {
  playbackState: PlaybackState;
  currentTime: number; // Position in seconds
  duration: number; // Total duration in seconds
  playbackRate: number; // 0.5 to 1.0
  volume: number; // 0.0 to 1.0
  fileName: string | null;
  audioUrl: string | null; // Object URL for Waveform visualization
  tapeEffectEnabled: boolean; // Cassette tape effect toggle
  tapeEffectIntensity: number; // 0.0 to 1.0
}

export interface ChopMarker {
  time: number;  // Timestamp in seconds where chop was triggered
}

export interface AudioPlayerControls {
  loadFile: (file: File) => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  seekRelative: (delta: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleChop: () => void;
  setChopOffset: (offset: number) => void;
  chopOffset: number;
  isDualActive: boolean;
  toggleTapeEffect: () => void;
  setTapeEffectIntensity: (intensity: number) => void;
}

export interface DualSources {
  main: AudioBufferSourceNode;
  ahead: AudioBufferSourceNode;
  mainGain: GainNode;
  aheadGain: GainNode;
}

export type ActivePosition = 'main' | 'ahead';
