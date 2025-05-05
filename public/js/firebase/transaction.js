import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCV7GHk-wK5bhDg2Inqm7vJqTYjl1TTTNw",
  authDomain: "dormies-b47b7.firebaseapp.com",
  projectId: "dormies-b47b7",
  storageBucket: "dormies-b47b7.appspot.com",
  messagingSenderId: "443577320462",
  appId: "1:443577320462:web:0a418fa107fbd01bd1285f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const ownerId = urlParams.get("ownerId");
  const listingId = urlParams.get("listingId");

  if (!ownerId || !listingId) {
    alert("Missing listing details. Cannot proceed with transaction.");
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("You must be logged in to make a transaction.");
      return;
    }

    const form = document.getElementById("transactionForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const transactionData = {
        renterId: user.uid,
        createdAt: new Date(),
        status: "pending",
        message: formData.get("message") || "",
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
      };

      try {
        const transactionRef = collection(
          db,
          "owners",
          ownerId,
          "listings",
          listingId,
          "transactions"
        );
        await addDoc(transactionRef, transactionData);
        alert("Transaction request submitted!");
        form.reset();
      } catch (error) {
        console.error("Error saving transaction:", error);
        alert("Something went wrong. Please try again.");
      }
    });
  });
});
