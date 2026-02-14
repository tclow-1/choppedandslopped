// AudioNode factory functions

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
