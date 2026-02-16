// YouTube audio extraction via Invidious API

import { proxiedUrl } from './corsProxy';
import type { InvidiousVideoResponse, InvidiousAudioFormat } from '../types/youtube';

const INVIDIOUS_INSTANCES = ['inv.nadeko.net', 'yewtu.be', 'invidious.nerdvpn.de'];

/**
 * Extract YouTube video ID from various URL formats
 * Supports: watch, youtu.be, embed, shorts, live
 */
export function extractYoutubeId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Handle youtu.be short URLs
    if (urlObj.hostname === 'youtu.be') {
      const id = urlObj.pathname.slice(1).split('?')[0];
      // Validate ID is exactly 11 chars matching [A-Za-z0-9_-]{11}
      if (id.length === 11 && /^[A-Za-z0-9_-]{11}$/.test(id)) {
        return id;
      }
      return null;
    }

    // Handle youtube.com URLs (including www.youtube.com, m.youtube.com)
    if (urlObj.hostname.includes('youtube.com')) {
      // Check for watch?v= parameter first
      const vParam = urlObj.searchParams.get('v');
      if (vParam && vParam.length === 11 && /^[A-Za-z0-9_-]{11}$/.test(vParam)) {
        return vParam;
      }

      // Check pathname for /embed/, /v/, /shorts/, /live/ patterns
      const pathMatch = urlObj.pathname.match(/\/(embed|v|shorts|live)\/([\w-]{11})/);
      if (pathMatch && pathMatch[2]) {
        const id = pathMatch[2];
        if (id.length === 11 && /^[A-Za-z0-9_-]{11}$/.test(id)) {
          return id;
        }
      }
    }

    return null;
  } catch {
    return null; // Invalid URL
  }
}

/**
 * Validate YouTube URL and provide user-friendly error messages
 */
export function validateYoutubeUrl(url: string): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: 'URL required' };
  }

  try {
    const urlObj = new URL(url);
    const isYoutube = urlObj.hostname === 'youtu.be' || urlObj.hostname.includes('youtube.com');

    if (!isYoutube) {
      return { valid: false, error: 'Must be a YouTube URL' };
    }

    const videoId = extractYoutubeId(url);
    if (!videoId) {
      return { valid: false, error: 'Could not find video ID in URL' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Load YouTube audio: URL -> video ID -> Invidious API -> audio stream -> AudioBuffer
 */
export async function loadYoutubeAudio(
  youtubeUrl: string,
  audioContext: AudioContext,
  onProgress?: (stage: string) => void
): Promise<{ audioBuffer: AudioBuffer; title: string }> {
  // Stage 1: Extract video ID
  const videoId = extractYoutubeId(youtubeUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  // Stage 2: Query Invidious API with instance rotation
  onProgress?.('Fetching audio info...');

  let audioStreamUrl: string | null = null;
  let title: string | null = null;

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const apiUrl = `https://${instance}/api/v1/videos/${videoId}`;
      const response = await fetch(proxiedUrl(apiUrl));

      if (!response.ok) {
        console.warn(`Invidious instance ${instance} returned HTTP ${response.status}`);
        continue; // Try next instance
      }

      const data: InvidiousVideoResponse = await response.json();
      title = data.title;

      // Find best quality audio stream from adaptiveFormats
      const audioFormats = data.adaptiveFormats.filter(
        (format: InvidiousAudioFormat) => format.type.startsWith('audio/')
      );

      if (audioFormats.length > 0) {
        // Sort by bitrate descending, select highest quality
        audioFormats.sort((a, b) => b.bitrate - a.bitrate);
        audioStreamUrl = audioFormats[0].url;
        break; // Success, exit loop
      }

      // Fallback to formatStreams if no audio-only streams
      if (data.formatStreams && data.formatStreams.length > 0) {
        console.warn('No audio-only streams found, using combined audio/video stream');
        audioStreamUrl = data.formatStreams[0].url;
        break;
      }

      throw new Error('No audio streams found in video');
    } catch (err) {
      console.warn(`Instance ${instance} failed:`, err);
      continue; // Try next instance
    }
  }

  if (!audioStreamUrl || !title) {
    throw new Error('All Invidious instances failed. YouTube may be unavailable.');
  }

  // Stage 3: Download audio stream
  // Try direct fetch first (Google CDN may have CORS headers)
  onProgress?.('Downloading audio...');
  let audioResponse = await fetch(audioStreamUrl);

  // If direct fetch fails with CORS, try with proxy
  if (!audioResponse.ok && audioResponse.status === 0) {
    console.log('Direct audio fetch failed, trying with CORS proxy...');
    audioResponse = await fetch(proxiedUrl(audioStreamUrl));
  }

  if (!audioResponse.ok) {
    throw new Error(`Failed to download audio: HTTP ${audioResponse.status}`);
  }

  // Stage 4: Convert to AudioBuffer
  onProgress?.('Processing audio...');
  const arrayBuffer = await audioResponse.arrayBuffer();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return { audioBuffer, title };
  } catch (err) {
    if (err instanceof Error && err.name === 'EncodingError') {
      throw new Error('Unsupported audio format from YouTube');
    }
    throw err;
  }
}
