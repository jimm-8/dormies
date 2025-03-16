import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCV7GHk-wK5bhDg2Inqm7vJqTYjl1TTTNw",
  authDomain: "dormies-b47b7.firebaseapp.com",
  projectId: "dormies-b47b7",
  storageBucket: "dormies-b47b7.appspot.com",
  messagingSenderId: "443577320462",
  appId: "1:443577320462:web:0a418fa107fbd01bd1285f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Wait for user authentication
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User signed in:", user.uid);
    fetchOwnerData(user.uid);
  } else {
    console.log("No user is signed in.");
  }
});

// Function to fetch owner data from Firestore
async function fetchOwnerData(userId) {
  try {
    const docRef = doc(db, "owners", userId); // Using userId as the document ID
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const ownerData = docSnap.data();
      console.log("Fetched Owner Data:", ownerData);

      // Set the name in the HTML
      document.getElementById("owner_name").textContent = ownerData.name;
    } else {
      console.log("No such document found!");
    }
  } catch (error) {
    console.error("Error fetching owner data:", error);
  }
}
