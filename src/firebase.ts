import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAWR2x5wKhT8aPqou094XWZKBr1Mqk-nFo",
  authDomain: "liquidash000.firebaseapp.com",
  projectId: "liquidash000",
  storageBucket: "liquidash000.firebasestorage.app",
  messagingSenderId: "608155532434",
  appId: "1:608155532434:web:2e3140a54fb03188853a4b"
};

// Debug: Check if environment variables are loaded
console.log('Firebase Config Check:', {
  apiKey: !!firebaseConfig.apiKey,
  authDomain: !!firebaseConfig.authDomain,
  projectId: !!firebaseConfig.projectId,
  hasAllKeys: Object.values(firebaseConfig).every(value => !!value)
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
