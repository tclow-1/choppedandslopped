// AudioNode factory functions

import type { DualSources } from '../types/audio';

export function createSourceNode(
  audioContext: AudioContext,
  buffer: AudioBuffer,
  playbackRate: number = 1.0
): AudioBufferSourceNode {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = playbackRate;
  return source;
}

export function createDualSources(
  audioContext: AudioContext,
  buffer: AudioBuffer,
  playbackRate: number,
  mainGain: GainNode,
  aheadGain: GainNode
): DualSources {
  const main = audioContext.createBufferSource();
  main.buffer = buffer;
  main.playbackRate.value = playbackRate;
  main.connect(mainGain);

  const ahead = audioContext.createBufferSource();
  ahead.buffer = buffer;
  ahead.playbackRate.value = playbackRate;
  ahead.connect(aheadGain);

  return { main, ahead, mainGain, aheadGain };
}
