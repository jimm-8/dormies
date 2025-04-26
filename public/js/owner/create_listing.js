// Loader
setTimeout(() => {
  const loader = document.querySelector(".loader");
  const main = document.getElementById("main");

  loader.style.opacity = "0";
  loader.style.transition = "opacity 0.8s ease-out";

  setTimeout(() => {
    loader.style.display = "none";
    main.style.display = "block";
    main.style.opacity = "1";
    main.style.transition = "opacity 0.8s ease-in";
  }, 800);
}, 3000);

// Back Button
const back = document.getElementById("back-btn");
back.addEventListener("click", () => {
  location.href = "/pages/owner/dashboard.html";
});

import {
  getFirestore,
  doc,
  collection,
  addDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { app } from "/js/firebaseConfig.js"; // adjust if different

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

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

      // Handle image uploads
      const fileInput = document.getElementById("upload-photos");
      const files = fileInput.files;
      const uploadedURLs = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageRef = ref(
          storage,
          `owners/${ownerId}/listings/${newListingRef.id}/photo_${i + 1}.jpg`
        );
        await uploadBytes(imageRef, file);
        const downloadURL = await getDownloadURL(imageRef);
        uploadedURLs.push(downloadURL);
      }

      // Update Firestore document to include image URLs
      await setDoc(newListingRef, { ...listingData, imageUrls: uploadedURLs });

      alert("Listing saved successfully!");
      window.location.href = "/pages/owner/dashboard.html"; // Optional redirect
    } catch (error) {
      console.error("Error saving listing:", error);
      alert("Failed to save listing. Please try again.");
    }
  });
