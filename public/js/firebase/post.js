import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCV7GHk-wK5bhDg2Inqm7vJqTYjl1TTTNw",
  authDomain: "dormies-b47b7.firebaseapp.com",
  projectId: "dormies-b47b7",
  messagingSenderId: "443577320462",
  appId: "1:443577320462:web:0a418fa107fbd01bd1285f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document
  .getElementById("save-listing-btn")
  .addEventListener("click", async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not logged in");

      const ownerId = user.uid;

      // Collect input values
      const title = document.getElementById("listing-title").value.trim();
      const street = document.getElementById("street").value;
      const blkNo = document.getElementById("blk-no").value.trim();
      const landmark = document.getElementById("landmark").value.trim();
      const description = document.getElementById("description").value.trim();
      const rentalSpace = document.getElementById("rental-space").value;
      const furnishStatus = document.getElementById("furnish-status").value;
      const roomType = document.getElementById("room-type").value;
      const roomPrivacy = document.getElementById("room-privacy").value;
      const bathroomPrivacy = document.getElementById("bathroom").value;
      const allowedGender = document.getElementById("gender").value;
      const rentAmount = document.getElementById("rent-amount").value;
      const rentPeriod = document.getElementById("rent-period").value;
      const waterBill = document.getElementById("water-bill").value;
      const electricBill = document.getElementById("electric-bill").value;
      const wifiBill = document.getElementById("wifi-bill").value;

      const listingData = {
        title,
        address: {
          street,
          blkNo,
          landmark,
        },
        description,
        rentalSpace,
        furnishStatus,
        roomType,
        roomPrivacy,
        bathroomPrivacy,
        allowedGender,
        pricing: {
          rentAmount: parseFloat(rentAmount),
          rentPeriod,
        },
        inclusions: {
          waterBill,
          electricBill,
          wifiBill,
        },
        createdAt: new Date(),
      };

      // Save listing document first to get its ID
      const newListingRef = await addDoc(
        collection(db, "owners", ownerId, "listings"),
        listingData
      );

      // No image upload handling, just save listing
      await setDoc(newListingRef, listingData);

      alert("Listing saved successfully!");
      window.location.href = "/dormies/pages/owner/dashboard.html"; // Optional redirect
    } catch (error) {
      console.error("Error saving listing:", error);
      alert("Failed to save listing. Please try again.");
    }
  });
