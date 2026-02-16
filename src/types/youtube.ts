// TypeScript type definitions for YouTube audio loading

export type YoutubeLoadState =
  | { status: 'idle' }
  | { status: 'loading'; stage: string }
  | { status: 'success'; title: string }
  | { status: 'error'; error: string };

export interface InvidiousAudioFormat {
  url: string;
  type: string;
  audioQuality: string;
  audioSampleRate: string;
  audioChannels: number;
  bitrate: number;
}

export interface InvidiousVideoResponse {
  title: string;
  adaptiveFormats: InvidiousAudioFormat[];
  formatStreams: Array<{ url: string; type: string }>;
}
