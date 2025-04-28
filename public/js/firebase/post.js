// File: /js/owner/create_listing.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { put } from "@vercel/blob";

// Firebase configuration
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

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Check authentication state
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      console.log("User not logged in. Redirecting to login page.");
      window.location.href = "/pages/auth/login.html";
    } else {
      console.log("User is logged in:", user.uid);
      // DOM is now ready, set up the event listener
      setupEventListeners();
    }
  });
});

function setupEventListeners() {
  const saveButton = document.getElementById("save-listing-btn");
  if (saveButton) {
    saveButton.addEventListener("click", handleSaveListingClick);
  } else {
    console.error("Save button not found in the DOM");
  }
}

async function handleSaveListingClick() {
  try {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to save a listing");
      return;
    }

    const ownerId = user.uid;

    // Disable the button to prevent multiple clicks
    const saveButton = document.getElementById("save-listing-btn");
    saveButton.disabled = true;
    saveButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';

    // Collect form data
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

    // Validation
    if (!title) {
      alert("Please enter a title for your listing");
      saveButton.disabled = false;
      saveButton.innerHTML = '<i class="fa fa-check"></i> Done';
      return;
    }

    // Prepare listing data
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
      status: "active",
      owner: {
        id: ownerId,
      },
    };

    // Save listing data to Firestore
    const newListingRef = await addDoc(
      collection(db, "owners", ownerId, "listings"),
      listingData
    );
    console.log("Listing saved with ID:", newListingRef.id);

    // Handle image uploads using Vercel Blob
    const fileInput = document.getElementById("upload-photos");
    const files = fileInput.files;
    const uploadedURLs = [];

    if (files && files.length > 0) {
      console.log(`Processing ${files.length} images...`);

      // Validate image files before uploading
      const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
      for (let i = 0; i < files.length; i++) {
        if (!validImageTypes.includes(files[i].type)) {
          alert(
            `Invalid file type: ${files[i].type}. Only images are allowed.`
          );
          return;
        }
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          const filename = `listings/${ownerId}/${
            newListingRef.id
          }/${Date.now()}-${file.name}`;

          const formData = new FormData();
          formData.append("file", file);
          formData.append("filename", filename);

          const response = await fetch("/api/upload-blob", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to upload image");
          }

          const data = await response.json();
          console.log(`Upload successful: ${data.url}`);
          uploadedURLs.push(data.url);
        } catch (error) {
          console.error(`Error uploading image ${i + 1}:`, error);
          alert(`Error uploading image ${i + 1}: ${error.message}`);
        }
      }

      if (uploadedURLs.length > 0) {
        await updateDoc(
          doc(db, "owners", ownerId, "listings", newListingRef.id),
          {
            imageUrls: uploadedURLs,
          }
        );
        console.log("Listing updated with image URLs");
      }
    }

    console.log("Listing saved successfully with images!");
    alert("Listing saved successfully!");
    window.location.href = "/pages/owner/dashboard.html";
  } catch (error) {
    console.error("Error saving listing:", error);
    alert("Failed to save listing. Please try again. Error: " + error.message);

    // Re-enable the button in case of error
    const saveButton = document.getElementById("save-listing-btn");
    saveButton.disabled = false;
    saveButton.innerHTML = '<i class="fa fa-check"></i> Done';
  }
}

// Expose the previewImages function to the global scope
window.previewImages = previewImages;

function previewImages(event) {
  const preview = document.getElementById("image-preview");
  const files = event.target.files;

  // Clear existing previews
  preview.innerHTML = "";

  if (files && files.length > 0) {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();

      reader.onload = function (e) {
        const imgContainer = document.createElement("div");
        imgContainer.className = "preview-image-container";

        const img = document.createElement("img");
        img.src = e.target.result;
        img.className = "preview-image";

        imgContainer.appendChild(img);
        preview.appendChild(imgContainer);
      };

      reader.readAsDataURL(file);
    });
  }
}
