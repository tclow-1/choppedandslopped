import { useState, useRef, useCallback, useEffect } from 'react';
import { Mp3MediaRecorder } from 'mp3-mediarecorder';
import type { RecordingState } from '../types/audio';

interface UseRecorderReturn {
  recordingState: RecordingState;
  downloadUrl: string | null;
  recordingDuration: number;
  startRecording: () => void;
  stopRecording: () => void;
  clearRecording: () => void;
}

export function useRecorder(
  audioContext: AudioContext | null,
  masterGainNode: GainNode | null
): UseRecorderReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Refs for recording internals
  const mediaStreamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recorderRef = useRef<Mp3MediaRecorder | MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const downloadUrlRef = useRef<string | null>(null);
  const masterGainNodeRef = useRef<GainNode | null>(null);

  // Keep masterGainNode ref in sync
  masterGainNodeRef.current = masterGainNode;

  // Duration tracking RAF loop
  const updateDuration = useCallback(() => {
    if (!audioContext) return;
    const elapsed = audioContext.currentTime - startTimeRef.current;
    setRecordingDuration(elapsed);
    animationFrameRef.current = requestAnimationFrame(updateDuration);
  }, [audioContext]);

  const stopDurationTracking = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!audioContext || !masterGainNodeRef.current) {
      console.warn('[useRecorder] Cannot start: audioContext or masterGainNode not ready');
      return;
    }

    // Resume AudioContext if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Create MediaStreamDestination if needed
    if (!mediaStreamDestRef.current) {
      mediaStreamDestRef.current = audioContext.createMediaStreamDestination();
    }

    // Connect masterGain → mediaStreamDest (additive, doesn't affect speaker output)
    try {
      masterGainNodeRef.current.connect(mediaStreamDestRef.current);
    } catch {
      // Already connected, that's fine
    }

    // Reset chunks
    chunksRef.current = [];

    // Try MP3 recording via mp3-mediarecorder, fall back to native
    let recorder: Mp3MediaRecorder | MediaRecorder;
    try {
      // Create worker for WASM encoder
      if (!workerRef.current) {
        workerRef.current = new Worker(
          new URL('../workers/mp3-recorder-worker.ts', import.meta.url),
          { type: 'module' }
        );
      }

      recorder = new Mp3MediaRecorder(mediaStreamDestRef.current.stream, {
        worker: workerRef.current,
        audioContext: audioContext,
      });

      console.log('[useRecorder] Using MP3 MediaRecorder (WASM)');
    } catch (err) {
      console.warn('[useRecorder] MP3 recorder failed, falling back to native:', err);
      recorder = new MediaRecorder(mediaStreamDestRef.current.stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
    }

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const isMp3 = recorder instanceof Mp3MediaRecorder;
      const mimeType = isMp3 ? 'audio/mpeg' : 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });

      // Revoke previous URL if any
      if (downloadUrlRef.current) {
        URL.revokeObjectURL(downloadUrlRef.current);
      }

      const url = URL.createObjectURL(blob);
      downloadUrlRef.current = url;
      setDownloadUrl(url);

      console.log('[useRecorder] Recording complete:', {
        format: isMp3 ? 'MP3' : 'WebM',
        size: `${(blob.size / 1024).toFixed(1)}kB`,
      });
    };

    recorderRef.current = recorder;
    recorder.start();

    // Track duration
    startTimeRef.current = audioContext.currentTime;
    setRecordingDuration(0);
    animationFrameRef.current = requestAnimationFrame(updateDuration);

    setRecordingState('recording');
  }, [audioContext, updateDuration]);

  const stopRecording = useCallback(() => {
    if (!recorderRef.current || recordingState !== 'recording') return;

    recorderRef.current.stop();
    recorderRef.current = null;

    // Disconnect masterGain from mediaStreamDest
    if (masterGainNodeRef.current && mediaStreamDestRef.current) {
      try {
        masterGainNodeRef.current.disconnect(mediaStreamDestRef.current);
      } catch {
        // Already disconnected, that's fine
      }
    }

    stopDurationTracking();
    setRecordingState('idle');
  }, [recordingState, stopDurationTracking]);

  const clearRecording = useCallback(() => {
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
    setDownloadUrl(null);
    setRecordingDuration(0);
    chunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop recording if active
      if (recorderRef.current) {
        try {
          recorderRef.current.stop();
        } catch {
          // Ignore errors during cleanup
        }
        recorderRef.current = null;
      }

      // Revoke object URL
      if (downloadUrlRef.current) {
        URL.revokeObjectURL(downloadUrlRef.current);
      }

      // Stop duration tracking
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Terminate worker
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return {
    recordingState,
    downloadUrl,
    recordingDuration,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
