import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// ✅ Replace with your actual Firebase config values from the Firebase Console
const firebaseConfig = {
 apiKey: "AIzaSyApS3_Mmq7gkNhDPjVAAU2oA9jwRu_9ctc",
  authDomain: "memory-of-journeys.firebaseapp.com",
  projectId: "memory-of-journeys",
  storageBucket: "memory-of-journeys.firebasestorage.app",
  messagingSenderId: "54369150551",
  appId: "1:54369150551:web:2b849a2d7c7251a1d1e512",
  measurementId: "G-J395DJLGCR"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Setup Firebase Authentication
const auth = getAuth(app);

// ✅ Setup Google Provider for Google Sign-In
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
