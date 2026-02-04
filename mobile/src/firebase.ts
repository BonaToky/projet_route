import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCWvgIshY4Abcr6BdlK_7YifhMi0amz9QA",
  authDomain: "cloud-mobile-c6ab2.firebaseapp.com",
  projectId: "cloud-mobile-c6ab2",
  storageBucket: "cloud-mobile-c6ab2.firebasestorage.app",
  messagingSenderId: "679668132102",
  appId: "1:679668132102:web:10c4f43b2988615f401687"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);