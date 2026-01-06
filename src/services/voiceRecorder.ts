import { Audio } from 'expo-av';

let recording: Audio.Recording | null = null;

// Groq API key
const GROQ_KEY = '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';

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
    
    const text = await transcribeAudio(uri);
    return text;
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

  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'audio.m4a',
  } as any);
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'vi');
  formData.append('response_format', 'text');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq Whisper error:', errorText);
    throw new Error(`Lỗi transcription: ${response.status}`);
  }

  const text = await response.text();
  console.log('✅ Transcribed:', text);
  return text.trim();
}
