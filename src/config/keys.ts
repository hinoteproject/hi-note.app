// ===========================================
// GROQ API - Lấy tại https://console.groq.com/keys
// ===========================================
export const GROQ_API_KEY: string = 'YOUR_GROQ_API_KEY';
export const isGroqConfigured: boolean = GROQ_API_KEY !== 'YOUR_GROQ_API_KEY';

// ===========================================
// FIREBASE - Lấy tại Firebase Console > Project Settings
// ===========================================
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAqxvckOL30q95zxN87vVm3ylELUTVoFCQ",
  authDomain: "hi-note-98ff7.firebaseapp.com",
  projectId: "hi-note-98ff7",
  storageBucket: "hi-note-98ff7.firebasestorage.app",
  messagingSenderId: "410025708786",
  appId: "1:410025708786:web:7a5699a0971e14d117d46b",
};

export const isFirebaseConfigured: boolean = FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY';

// ===========================================
// LEGACY - Không dùng nữa
// ===========================================
export const GEMINI_API_KEY: string = '';
export const isGeminiConfigured: boolean = false;
