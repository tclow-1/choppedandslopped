// Promise-based audio file loading and decoding

export async function loadAudioFile(
  file: File,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    return audioBuffer;
  } catch (err) {
    // Handle encoding errors for unsupported formats
    if (err instanceof Error && err.name === 'EncodingError') {
      throw new Error('Unsupported audio format. Please use MP3, WAV, or OGG.');
    }
    throw new Error(`Failed to load audio: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}
