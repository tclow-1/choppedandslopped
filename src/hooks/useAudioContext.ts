import { useRef, useEffect } from 'react';

export function useAudioContext(): AudioContext | null {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Lazy creation - create on first call, return existing on subsequent
  const getOrCreateContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  };

  useEffect(() => {
    const ctx = getOrCreateContext();

    // Resume on user interaction (autoplay policy)
    const resumeContext = async () => {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
    };

    // Attach to user interaction events
    document.addEventListener('click', resumeContext, { once: true });
    document.addEventListener('keydown', resumeContext, { once: true });

    return () => {
      // Cleanup on unmount
      if (ctx.state !== 'closed') {
        ctx.close();
      }
    };
  }, []);

  return getOrCreateContext();
}
