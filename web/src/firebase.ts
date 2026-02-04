import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC5z9w7w7w7w7w7w7w7w7w7w7w7w7w7w7w",
  authDomain: "cloud-mobile-c6ab2.firebaseapp.com",
  projectId: "cloud-mobile-c6ab2",
  storageBucket: "cloud-mobile-c6ab2.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);