// Tape effect utilities for simulating cassette tape sound

/**
 * Creates a waveshaper node for tape saturation effect
 * @param audioContext - The Web Audio API context
 * @param intensity - 0.0 to 1.0, controls saturation amount
 */
export function createTapeSaturation(
  audioContext: AudioContext,
  intensity: number
): WaveShaperNode {
  const shaper = audioContext.createWaveShaper();

  // Soft clipping curve based on intensity
  const curve = new Float32Array(256);
  const amount = intensity * 2; // Scale intensity to saturation amount

  for (let i = 0; i < 256; i++) {
    const x = (i - 128) / 128; // -1 to 1
    // Soft clipping formula: x / (1 + amount * |x|)
    curve[i] = x / (1 + amount * Math.abs(x));
  }

  shaper.curve = curve;
  shaper.oversample = '4x'; // Higher quality

  return shaper;
}

/**
 * Creates low-pass and high-pass filters for tape frequency response
 * @param audioContext - The Web Audio API context
 * @param intensity - 0.0 to 1.0, controls how much filtering is applied
 */
export function createTapeFilters(
  audioContext: AudioContext,
  intensity: number
): { lowPass: BiquadFilterNode; highPass: BiquadFilterNode } {
  const lowPass = audioContext.createBiquadFilter();
  lowPass.type = 'lowpass';
  // Intensity 0 = 22050Hz (Nyquist, fully transparent), Intensity 1 = 4kHz (heavy muffling)
  lowPass.frequency.value = 22050 - (18050 * intensity);
  lowPass.Q.value = 0.707; // Butterworth response

  const highPass = audioContext.createBiquadFilter();
  highPass.type = 'highpass';
  // Intensity 0 = 1Hz (fully transparent), Intensity 1 = 200Hz (remove bass rumble)
  highPass.frequency.value = 1 + (199 * intensity);
  highPass.Q.value = 0.707;

  return { lowPass, highPass };
}

/**
 * Creates tape hiss noise generator
 * @param audioContext - The Web Audio API context
 * @param intensity - 0.0 to 1.0, controls hiss volume
 */
export function createTapeHiss(
  audioContext: AudioContext,
  intensity: number
): { noiseSource: AudioBufferSourceNode; noiseGain: GainNode } {
  // Generate pink noise buffer (more realistic than white noise)
  const bufferSize = audioContext.sampleRate * 2; // 2 seconds of noise
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const output = buffer.getChannelData(0);

  // Pink noise generation (1/f spectrum, more natural than white noise)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    output[i] *= 0.11; // Reduce volume
    b6 = white * 0.115926;
  }

  const noiseSource = audioContext.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  const noiseGain = audioContext.createGain();
  // Intensity 0 = completely silent, Intensity 1 = subtle hiss
  noiseGain.gain.value = intensity * 0.006;

  noiseSource.connect(noiseGain);

  return { noiseSource, noiseGain };
}

/**
 * Interface for complete tape effect chain
 */
export interface TapeEffectChain {
  input: AudioNode;
  output: AudioNode;
  saturation: WaveShaperNode;
  lowPass: BiquadFilterNode;
  highPass: BiquadFilterNode;
  noiseSource: AudioBufferSourceNode;
  noiseGain: GainNode;
  updateIntensity: (intensity: number) => void;
}

/**
 * Creates complete tape effect chain
 * @param audioContext - The Web Audio API context
 * @param intensity - 0.0 to 1.0, controls overall effect strength
 */
export function createTapeEffect(
  audioContext: AudioContext,
  intensity: number
): TapeEffectChain {
  const saturation = createTapeSaturation(audioContext, intensity);
  const { lowPass, highPass } = createTapeFilters(audioContext, intensity);
  const { noiseSource, noiseGain } = createTapeHiss(audioContext, intensity);

  // Chain: input → highPass → lowPass → saturation → output
  highPass.connect(lowPass);
  lowPass.connect(saturation);

  // Noise merges at the output (after saturation)
  const outputMixer = audioContext.createGain();
  outputMixer.gain.value = 1.0;
  saturation.connect(outputMixer);
  noiseGain.connect(outputMixer);

  // Start noise immediately
  noiseSource.start(0);

  return {
    input: highPass,
    output: outputMixer,
    saturation,
    lowPass,
    highPass,
    noiseSource,
    noiseGain,
    updateIntensity: (newIntensity: number) => {
      // Update all parameters based on new intensity
      const now = audioContext.currentTime;

      // Update filters with smooth ramping (0% = fully transparent)
      lowPass.frequency.setTargetAtTime(22050 - (18050 * newIntensity), now, 0.05);
      highPass.frequency.setTargetAtTime(1 + (199 * newIntensity), now, 0.05);

      // Update noise gain
      noiseGain.gain.setTargetAtTime(newIntensity * 0.006, now, 0.05);

      // Update saturation curve
      const curve = new Float32Array(256);
      const amount = newIntensity * 2;
      for (let i = 0; i < 256; i++) {
        const x = (i - 128) / 128;
        curve[i] = x / (1 + amount * Math.abs(x));
      }
      saturation.curve = curve;
    }
  };
}
