import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import { GROQ_API_KEY, isGroqConfigured } from '../config/keys';

let recording: Audio.Recording | null = null;

// Use configured key from src/config/keys.ts
const GROQ_KEY = (isGroqConfigured ? GROQ_API_KEY : '');

export async function startRecording(): Promise<void> {
  try {
    const permission = await Audio.requestPermissionsAsync();
    if (permission.status !== 'granted') {
      throw new Error('Cần cấp quyền microphone để ghi âm');
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    recording = newRecording;
    console.log('🎤 Recording started');
  } catch (error) {
    console.error('Start recording error:', error);
    throw error;
  }
}

export async function stopRecording(): Promise<string> {
  if (!recording) {
    throw new Error('Không có recording nào đang chạy');
  }

  try {
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = recording.getURI();
    recording = null;

    if (!uri) {
      throw new Error('Không lấy được file audio');
    }

    console.log('🎤 Recording stopped, URI:', uri);

    try {
      const text = await transcribeAudio(uri);
      return text;
    } catch (err: any) {
      console.error('Transcription failed:', err);
      // notify user but don't throw so UI remains responsive
      try {
        Alert.alert('Lỗi ghi âm', err?.message || 'Không thể chuyển giọng nói thành văn bản');
      } catch (e) {
        // ignore alert errors in non-UI contexts
      }
      // Return special marker with audio URI so callers can fallback to play/retry
      return `AUDIO_URI::${uri}`;
    }
  } catch (error) {
    console.error('Stop recording error:', error);
    recording = null;
    throw error;
  }
}

export function cancelRecording(): void {
  if (recording) {
    recording.stopAndUnloadAsync();
    recording = null;
  }
}

export function isRecording(): boolean {
  return recording !== null;
}

async function transcribeAudio(audioUri: string): Promise<string> {
  console.log('📤 Sending to Groq Whisper...');

  if (!GROQ_KEY) {
    throw new Error('GROQ API key chưa được cấu hình. Vui lòng cập nhật src/config/keys.ts');
  }

  // Try RN-friendly upload first (append local uri object). This worked previously on many Expo setups.
  const tryLocalUpload = async () => {
    const formData = new FormData();
    try {

      // If the URI looks like a local file (file:// or absolute path), attach as RN file object
      // On some Android versions, file:// is required.
      let uriToUpload = audioUri;
      if (!uriToUpload.startsWith('file://') && !uriToUpload.startsWith('http')) {
        uriToUpload = `file://${uriToUpload}`;
      }

      if (uriToUpload.startsWith('file://') || uriToUpload.startsWith('/')) {
        formData.append('model', 'whisper-large-v3');
        formData.append('file', { uri: uriToUpload, type: 'audio/m4a', name: 'audio.m4a' } as any);
      } else {
        // remote url - fetch blob instead
        const fileResp = await fetch(audioUri);
        const blob = await fileResp.blob();
        formData.append('model', 'whisper-large-v3');
        formData.append('file', blob as any, 'audio.m4a');
      }

      formData.append('language', 'vi');
      formData.append('response_format', 'text');

      const makeRequest = async () => {
        return await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_KEY}`,
            // DO NOT set Content-Type for FormData - RN sets it automatically with boundary
          },
          body: formData,
        });
      };

      let response = await makeRequest();
      if (!response.ok) {
        // single retry
        response = await makeRequest();
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq Whisper error (local upload):', errorText);
        if (response.status === 401) {
          throw new Error('Invalid API Key (transcription service). Vui lòng kiểm tra cấu hình.');
        }
        throw new Error(`Lỗi transcription: ${response.status}`);
      }

      const text = await response.text();
      console.log('✅ Transcribed (local upload):', text);
      return text.trim();
    } catch (e) {
      console.warn('Local upload strategy failed, will try blob fallback:', e);
      throw e;
    }
  };

  // Blob fallback (if local upload fails on some platforms)
  const tryBlobFallback = async () => {
    try {
      const fileResp = await fetch(audioUri);
      const blob = await fileResp.blob();

      const formData = new FormData();
      formData.append('file', blob as any, 'audio.m4a');
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'vi');
      formData.append('response_format', 'text');

      const makeRequest = async () => {
        return await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_KEY}`,
          },
          body: formData,
        });
      };

      let response = await makeRequest();
      if (!response.ok) {
        response = await makeRequest();
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq Whisper error (blob fallback):', errorText);
        if (response.status === 401) {
          throw new Error('Invalid API Key (transcription service). Vui lòng kiểm tra cấu hình.');
        }
        throw new Error(`Lỗi transcription: ${response.status}`);
      }

      const text = await response.text();
      console.log('✅ Transcribed (blob fallback):', text);
      return text.trim();
    } catch (err) {
      console.error('Blob fallback failed:', err);
      throw err;
    }
  };

  try {
    return await tryLocalUpload();
  } catch (e) {
    // If the local upload failed with a network error (common on some Android/Expo setups), try blob fallback.
    try {
      return await tryBlobFallback();
    } catch (err) {
      console.error('transcribeAudio error (both strategies):', err);
      throw err;
    }
  }
}

// exported helper to retry transcription from outside (used by UI fallback)
export async function retryTranscribe(audioUri: string): Promise<string> {
  return await transcribeAudio(audioUri);
}
