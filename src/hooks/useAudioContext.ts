import { useEffect, useState } from 'react';

// Singleton AudioContext - created once per application
let globalAudioContext: AudioContext | null = null;

function getOrCreateAudioContext(): AudioContext {
  if (!globalAudioContext || globalAudioContext.state === 'closed') {
    globalAudioContext = new AudioContext();
  }
  return globalAudioContext;
}

export function useAudioContext(): AudioContext | null {
  const [audioContext] = useState<AudioContext>(() => getOrCreateAudioContext());

  useEffect(() => {
    // Resume on user interaction (autoplay policy)
    const resumeContext = async () => {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
    };

    // Attach to user interaction events
    document.addEventListener('click', resumeContext, { once: true });
    document.addEventListener('keydown', resumeContext, { once: true });

    // NO cleanup - singleton context persists for app lifetime
  }, [audioContext]);

  return audioContext;
}
