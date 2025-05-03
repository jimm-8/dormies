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

// Global variables to track edit mode
let isEditMode = false;
let editListingId = null;
let editListingData = null;

document.addEventListener("DOMContentLoaded", () => {
  // Check if we're in edit mode
  const urlParams = new URLSearchParams(window.location.search);
  isEditMode = urlParams.get("edit") === "true";

  // Get edit data from sessionStorage if available
  if (isEditMode) {
    editListingId = sessionStorage.getItem("editListingId");
    const editDataString = sessionStorage.getItem("editListingData");

    if (editListingId && editDataString) {
      editListingData = JSON.parse(editDataString);

      // Update page title and button text
      document.querySelector(".nav-container h6").innerHTML =
        '<span><i id="back-btn" class="fa fa-arrow-left"></i></span> Edit Listing';

      const saveButton = document.getElementById("save-listing-btn");
      if (saveButton) {
        saveButton.innerHTML = '<i class="fa fa-check"></i> Update';
      }

      // Populate the form with existing data
      populateFormWithData(editListingData);
    } else {
      console.error("Edit mode activated but no listing data found");
      isEditMode = false;
    }
  }

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

function populateFormWithData(data) {
  try {
    // Basic Information
    document.getElementById("listing-title").value = data.title || "";

    // Address
    if (data.address) {
      document.getElementById("street").value = data.address.street || "";
      document.getElementById("blk-no").value = data.address.blkNo || "";
      document.getElementById("landmark").value = data.address.landmark || "";
    }

    // Description
    document.getElementById("description").value = data.description || "";

    // Features
    if (data.features) {
      document.getElementById("room-privacy").value =
        data.features.bedrooms || "";
      document.getElementById("bathroom").value = data.features.bathrooms || "";
      document.getElementById("rental-space").value =
        data.features.propertyType || "";
      document.getElementById("furnish-status").value =
        data.features.unitCondition || "";
      document.getElementById("gender").value = data.features.gender || "";
    }

    // Pricing
    if (data.pricing) {
      document.getElementById("rent-amount").value =
        data.pricing.rentAmount || "";
    }

    // Contract Terms
    if (data.contractTerms) {
      document.getElementById("advance-payment").value =
        data.contractTerms.advanceAmount || "";
      document.getElementById("deposit-payment").value =
        data.contractTerms.depositAmount || "";
      document.getElementById("rent-period").value =
        data.contractTerms.rentPeriod || "";
      document.getElementById("rent-method").value =
        data.contractTerms.rentMethod || "";
      document.getElementById("contract-term").value =
        data.contractTerms.contractTerm || "";
    }

    // Inclusions
    if (data.inclusions) {
      document.getElementById("water-bill").value =
        data.inclusions.waterBill || "";
      document.getElementById("electric-bill").value =
        data.inclusions.electricBill || "";
      document.getElementById("wifi-bill").value =
        data.inclusions.wifiBill || "";
    }

    console.log("Form populated with existing data");
  } catch (error) {
    console.error("Error populating form:", error);
    showNotice("Error loading listing data");
  }
}

function showNotice(message, duration = 4000) {
  const noticeBox = document.getElementById("noticeBox");
  if (!noticeBox) return;

  noticeBox.textContent = message;
  noticeBox.classList.remove("hidden");
  noticeBox.classList.add("show");

  setTimeout(() => {
    noticeBox.classList.remove("show");
    noticeBox.classList.add("hidden");
  }, duration);
}

document
  .getElementById("save-listing-btn")
  .addEventListener("click", async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        showNotice("You must be logged in to save a listing");
        return;
      }

      const ownerId = user.uid;
      const saveButton = document.getElementById("save-listing-btn");
      saveButton.disabled = true;

      // Change button text based on mode
      if (isEditMode) {
        saveButton.innerHTML =
          '<i class="fa fa-spinner fa-spin"></i> Updating...';
      } else {
        saveButton.innerHTML =
          '<i class="fa fa-spinner fa-spin"></i> Saving...';
      }

      const title = document.getElementById("listing-title").value.trim();
      if (!title) {
        showNotice("Please enter a title for your listing");
        saveButton.disabled = false;
        saveButton.innerHTML = isEditMode
          ? '<i class="fa fa-check"></i> Update'
          : '<i class="fa fa-check"></i> Done';
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
          rentAmount:
            parseFloat(document.getElementById("rent-amount").value) || 0,
        },
        contractTerms: {
          advanceAmount:
            parseFloat(document.getElementById("advance-payment").value) || 0,
          depositAmount:
            parseFloat(document.getElementById("deposit-payment").value) || 0,
          rentPeriod: document.getElementById("rent-period").value,
          rentMethod: document.getElementById("rent-method").value,
          contractTerm: document.getElementById("contract-term").value,
        },
        inclusions: {
          waterBill: document.getElementById("water-bill").value,
          electricBill: document.getElementById("electric-bill").value,
          wifiBill: document.getElementById("wifi-bill").value,
        },
        updatedAt: new Date(),
        owner: { id: ownerId },
        status: "active",
      };

      // If editing, update the existing document
      if (isEditMode && editListingId) {
        // Keep the original creation date
        if (editListingData && editListingData.createdAt) {
          listingData.createdAt = editListingData.createdAt;
        } else {
          listingData.createdAt = new Date();
        }

        const listingRef = doc(
          db,
          "owners",
          ownerId,
          "listings",
          editListingId
        );
        await updateDoc(listingRef, listingData);
        console.log("Listing updated with ID:", editListingId);
        showNotice("Listing updated successfully!");
      } else {
        // For new listings, add creation date
        listingData.createdAt = new Date();

        const newListingRef = await addDoc(
          collection(db, "owners", ownerId, "listings"),
          listingData
        );
        console.log("Listing saved with ID:", newListingRef.id);
        showNotice("Listing saved successfully!");
      }

      // Clear session storage
      sessionStorage.removeItem("editListingId");
      sessionStorage.removeItem("editListingData");

      // Redirect back to dashboard
      window.location.href = "/pages/owner/dashboard.html";
    } catch (error) {
      console.error("Error saving listing:", error);
      showNotice("Failed to save listing. Error: " + error.message);
      const saveButton = document.getElementById("save-listing-btn");
      saveButton.disabled = false;
      saveButton.innerHTML = isEditMode
        ? '<i class="fa fa-check"></i> Update'
        : '<i class="fa fa-check"></i> Done';
    }
  });
