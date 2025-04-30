import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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

document.addEventListener("DOMContentLoaded", () => {
  const titleInput = document.getElementById("listing-title");
  const listingNamePreview = document.getElementById("listing-name");

  if (titleInput && listingNamePreview) {
    titleInput.addEventListener("input", function () {
      listingNamePreview.textContent = this.value || "Not Yet Provided";
    });
  }

  const backBtn = document.getElementById("back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.history.back();
    });
  }

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      console.log("User not logged in");
      window.location.href = "/pages/login.html";
    }
  });
});

document
  .getElementById("save-listing-btn")
  .addEventListener("click", async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to save a listing");
        return;
      }

      const ownerId = user.uid;
      const saveButton = document.getElementById("save-listing-btn");
      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';

      const title = document.getElementById("listing-title").value.trim();
      if (!title) {
        alert("Please enter a title for your listing");
        saveButton.disabled = false;
        saveButton.innerHTML = '<i class="fa fa-check"></i> Done';
        return;
      }

      const listingData = {
        title,
        address: {
          street: document.getElementById("street").value,
          blkNo: document.getElementById("blk-no").value.trim(),
          landmark: document.getElementById("landmark").value.trim(),
        },
        description: document.getElementById("description").value.trim(),
        features: {
          bedrooms: document.getElementById("room-privacy").value,
          bathrooms: document.getElementById("bathroom").value,
          propertyType: document.getElementById("rental-space").value,
          unitCondition: document.getElementById("furnish-status").value,
          gender: document.getElementById("gender").value,
        },
        pricing: {
          rentAmount: parseFloat(document.getElementById("rent-amount").value),
        },
        contractTerms: {
          advanceAmount: parseFloat(
            document.getElementById("advance-payment").value
          ),
          depositAmount: parseFloat(
            document.getElementById("deposit-payment").value
          ),
          rentPeriod: document.getElementById("rent-period").value,
          rentMethod: document.getElementById("rent-method").value,
          contractTerm: document.getElementById("contract-term").value,
        },
        inclusions: {
          waterBill: document.getElementById("water-bill").value,
          electricBill: document.getElementById("electric-bill").value,
          wifiBill: document.getElementById("wifi-bill").value,
        },
        createdAt: new Date(),
        owner: { id: ownerId },
        status: "active",
      };

      const newListingRef = await addDoc(
        collection(db, "owners", ownerId, "listings"),
        listingData
      );
      console.log("Listing saved with ID:", newListingRef.id);

      alert("Listing saved successfully!");
      window.location.href = "/pages/owner/dashboard.html";
    } catch (error) {
      console.error("Error saving listing:", error);
      alert(
        "Failed to save listing. Please try again. Error: " + error.message
      );
      const saveButton = document.getElementById("save-listing-btn");
      saveButton.disabled = false;
      saveButton.innerHTML = '<i class="fa fa-check"></i> Done';
    }
  });
