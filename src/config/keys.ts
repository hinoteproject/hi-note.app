// ===========================================
// GROQ API - Lấy tại https://console.groq.com/keys
// ===========================================
export const GROQ_API_KEY: string = 'YOUR_GROQ_API_KEY';
export const isGroqConfigured: boolean = GROQ_API_KEY !== 'YOUR_GROQ_API_KEY';

// ===========================================
// FIREBASE - Lấy tại Firebase Console > Project Settings
// ===========================================
export const FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

export const isFirebaseConfigured: boolean = FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY';

// ===========================================
// LEGACY - Không dùng nữa
// ===========================================
export const GEMINI_API_KEY: string = '';
export const isGeminiConfigured: boolean = false;
