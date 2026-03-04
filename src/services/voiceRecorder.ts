import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

let recognizing = false;
let finalTranscript = '';
let interimCallback: ((text: string) => void) | null = null;
let volumeCallback: ((volume: number) => void) | null = null;
let resolveStop: ((text: string) => void) | null = null;
let rejectStop: ((err: Error) => void) | null = null;
let stopTimeoutId: ReturnType<typeof setTimeout> | null = null;

// Event listeners (kept as module-level so we can remove them)
let resultListener: { remove: () => void } | null = null;
let endListener: { remove: () => void } | null = null;
let errorListener: { remove: () => void } | null = null;
let volumeListener: { remove: () => void } | null = null;

function cleanupListeners() {
  resultListener?.remove();
  endListener?.remove();
  errorListener?.remove();
  volumeListener?.remove();
  resultListener = null;
  endListener = null;
  errorListener = null;
  volumeListener = null;
}

function fullReset() {
  recognizing = false;
  finalTranscript = '';
  resolveStop = null;
  rejectStop = null;
  if (stopTimeoutId) {
    clearTimeout(stopTimeoutId);
    stopTimeoutId = null;
  }
  cleanupListeners();
}

/**
 * Wait until the native recognizer is truly idle before proceeding.
 * On Android, calling start() while the previous session is still tearing
 * down causes a silent failure.
 */
async function waitForIdle(maxWaitMs = 2000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const state = await ExpoSpeechRecognitionModule.getStateAsync();
      // If state is 'starting', 'recognizing', or 'stopping', it's still active
      if (state !== 'starting' && state !== 'recognizing' && state !== 'stopping') return;
    } catch {
      // getStateAsync may not be available on all versions, just wait a bit
      await new Promise((r) => setTimeout(r, 300));
      return;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
}

export async function startRecording(): Promise<void> {
  // If previous session is still lingering, force-abort and wait
  if (recognizing) {
    try { ExpoSpeechRecognitionModule.abort(); } catch { }
    fullReset();
  }

  try {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      throw new Error('Cần cấp quyền microphone và nhận diện giọng nói');
    }

    // Wait for native recognizer to be ready
    await waitForIdle();

    // Reset state
    finalTranscript = '';
    recognizing = true;

    // Setup listeners before starting
    cleanupListeners();

    resultListener = ExpoSpeechRecognitionModule.addListener('result', (event) => {
      const transcript = event.results[0]?.transcript || '';
      if (event.isFinal) {
        finalTranscript = transcript;
      }
      // Send interim results to callback
      if (interimCallback) {
        interimCallback(transcript);
      }
    });

    endListener = ExpoSpeechRecognitionModule.addListener('end', () => {
      console.log('🎤 Speech recognition ended');
      const pending = resolveStop;
      const text = finalTranscript.trim();
      fullReset();
      // Resolve AFTER full reset so next startRecording() won't conflict
      if (pending) {
        pending(text);
      }
    });

    errorListener = ExpoSpeechRecognitionModule.addListener('error', (event) => {
      console.error('🎤 Speech recognition error:', event.error, event.message);
      const pending = rejectStop;
      fullReset();
      if (pending) {
        pending(new Error(event.message || `Lỗi nhận diện giọng nói: ${event.error}`));
      }
    });

    volumeListener = ExpoSpeechRecognitionModule.addListener('volumechange', (event) => {
      if (volumeCallback) {
        // Value ranges from roughly -2 (quiet) to 10 (loud)
        volumeCallback(event.value);
      }
    });

    // Start native speech recognition
    ExpoSpeechRecognitionModule.start({
      lang: 'vi-VN',
      interimResults: true,
      continuous: false,
      addsPunctuation: true,
      requiresOnDeviceRecognition: false,
      volumeChangeEventOptions: {
        enabled: true,
        intervalMillis: 50, // update volume every 50ms for smooth animation
      },
    });

    console.log('🎤 Speech recognition started (native)');
  } catch (error) {
    fullReset();
    console.error('Start recording error:', error);
    throw error;
  }
}

export async function stopRecording(): Promise<string> {
  if (!recognizing) {
    throw new Error('Không có recording nào đang chạy');
  }

  return new Promise<string>((resolve, reject) => {
    resolveStop = resolve;
    rejectStop = reject;

    // Tell the engine to stop — it will fire a final result then 'end'
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (e) {
      // If stop() throws, the recognizer may already be stopped
      fullReset();
      resolve(finalTranscript.trim());
      return;
    }

    // Safety timeout: if 'end' never fires, resolve with whatever we have
    stopTimeoutId = setTimeout(() => {
      if (resolveStop) {
        const text = finalTranscript.trim();
        fullReset();
        resolve(text);
      }
    }, 5000);
  });
}

export function cancelRecording(): void {
  if (recognizing) {
    try { ExpoSpeechRecognitionModule.abort(); } catch { }
    fullReset();
  }
}

export function isRecording(): boolean {
  return recognizing;
}

/**
 * Register a callback to receive interim (real-time) transcription results.
 * Call with `null` to unregister.
 */
export function onInterimResult(callback: ((text: string) => void) | null): void {
  interimCallback = callback;
}

/**
 * Register a callback to receive real-time volume updates.
 * Value typically ranges from -2 (quiet) to 10 (loud).
 * Call with `null` to unregister.
 */
export function onVolumeChange(callback: ((volume: number) => void) | null): void {
  volumeCallback = callback;
}
