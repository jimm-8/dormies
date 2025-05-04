// Firebase App and Firestore SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC6lQdR4Hzwt5hel76LvLuXWtMVILC1zCE",
    authDomain: "dormiesdb.firebaseapp.com",
    databaseURL: "https://dormiesdb-default-rtdb.firebaseio.com",
    projectId: "dormiesdb",
    storageBucket: "dormiesdb.firebasestorage.app",
    messagingSenderId: "944183752845",
    appId: "1:944183752845:web:6a71a1f6cad348991acac4",
    measurementId: "G-8W4Y49K5XR"
  };

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export db to use in other files
export { db, collection, addDoc, serverTimestamp };
