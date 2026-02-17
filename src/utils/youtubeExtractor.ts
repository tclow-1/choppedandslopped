// YouTube URL validation utilities

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
