import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";

// Use environment variables or dummy strings during build/prerender to prevent initialization crashes
const firebaseConfig = {
  apiKey: "AIzaSyDxUneLv6ML8RfHwSHHzmjs5lzR-9U1L6E",
  authDomain: "vegastracking.firebaseapp.com",
  projectId: "vegastracking",
  storageBucket: "vegastracking.firebasestorage.app",
  messagingSenderId: "863192239224",
  appId: "1:863192239224:web:014b24271d060dd7d9b18d"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore with persistent cache for offline support
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export { app, auth, db, googleProvider };
