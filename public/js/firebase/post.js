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
import fs from "fs";
import path from "path";
import multer from "multer"; // You will need to install multer to handle file uploads

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

// Multer for file handling and saving to Vercel's /tmp directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Temporary folder on Vercel's /tmp directory
    const tmpFolderPath = path.join("/tmp", "uploads");
    if (!fs.existsSync(tmpFolderPath)) {
      fs.mkdirSync(tmpFolderPath, { recursive: true });
    }
    cb(null, tmpFolderPath);
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}_${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

// Function to handle form submission
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

      // Disable the button to prevent multiple clicks
      const saveButton = document.getElementById("save-listing-btn");
      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';

      // Collect form data
      const title = document.getElementById("listing-title").value.trim();
      const street = document.getElementById("street").value.trim();
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

      if (!title) {
        alert("Please enter a title for your listing");
        saveButton.disabled = false;
        saveButton.innerHTML = '<i class="fa fa-check"></i> Done';
        return;
      }

      console.log("Preparing listing data...");

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
        status: "active", // Add a status field for easier filtering
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

      // Handle image uploads
      const fileInput = document.getElementById("upload-photos");
      const files = fileInput.files;
      const uploadedURLs = [];

      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          // Save the image to the temporary folder
          const tmpFilePath = path.join("/tmp", "uploads", file.name);
          fs.writeFileSync(tmpFilePath, file); // Save to /tmp

          // The image file is now in the temporary folder, you can save the file's URL or path in Firestore
          uploadedURLs.push(`/tmp/uploads/${file.name}`);
        }

        // Update the listing with image URLs
        if (uploadedURLs.length > 0) {
          await updateDoc(
            doc(db, "owners", ownerId, "listings", newListingRef.id),
            {
              imageUrls: uploadedURLs,
            }
          );
        }
      }

      console.log("Listing saved successfully with images!");
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

// Make the previewImages function accessible globally
window.previewImages = previewImages;
