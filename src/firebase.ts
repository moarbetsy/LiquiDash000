import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAWR2x5wKhT8aPqou094XWZKBr1Mqk-nFo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "liquidash000.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "liquidash000",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "liquidash000.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "608155532434",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:608155532434:web:2e3140a54fb03188853a4b"
};

// Debug: Check if environment variables are loaded
console.log('Firebase Config Check:', {
  apiKey: !!firebaseConfig.apiKey,
  authDomain: !!firebaseConfig.authDomain,
  projectId: !!firebaseConfig.projectId,
  hasAllKeys: Object.values(firebaseConfig).every(value => !!value),
  usingEnvVars: !!(import.meta.env.VITE_FIREBASE_API_KEY)
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
