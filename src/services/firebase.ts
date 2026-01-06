import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FIREBASE_CONFIG, isFirebaseConfigured } from '../config/keys';

let app: any = null;
let db: any = null;
let auth: any = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('✅ Firebase initialized');
  } catch (error) {
    console.error('❌ Firebase init error:', error);
  }
} else {
  console.log('⚠️ Firebase chưa được cấu hình. App sẽ chạy offline mode.');
}

export { db, auth, isFirebaseConfigured };
