// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "agentflow-ai-556ae.firebaseapp.com",
  projectId: "agentflow-ai-556ae",
  storageBucket: "agentflow-ai-556ae.firebasestorage.app",
  messagingSenderId: "1018983922408",
  appId: "1:1018983922408:web:fea64d1e76d25400a8675d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth=getAuth(app)
export const googleProvider=new GoogleAuthProvider()