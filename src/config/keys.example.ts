// ===========================================
// GOOGLE GEMINI API - Lấy miễn phí tại https://aistudio.google.com/app/apikey
// ===========================================
export const GEMINI_API_KEY: string = 'YOUR_GEMINI_API_KEY';
export const isGeminiConfigured: boolean = GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY';

// ===========================================
// FIREBASE - Lấy tại Firebase Console > Project Settings
// ===========================================
export const FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

export const isFirebaseConfigured: boolean = FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY';
