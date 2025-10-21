// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD--JSzF4UUZqHqT-BKj5k9HyF27GbCsnE",
  authDomain: "nexabiz-69e8d.firebaseapp.com",
  projectId: "nexabiz-69e8d",
  storageBucket: "nexabiz-69e8d.firebasestorage.app",
  messagingSenderId: "593666570816",
  appId: "1:593666570816:web:2d4b089b378f3da1957da5",
  measurementId: "G-S5G64D3WB7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // ✅ Add this line
const db = getFirestore(app)

export { auth, db };