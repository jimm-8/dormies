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

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: "public_4etKUvIw7NzEO6bFb0WfzecVFKo=",
  urlEndpoint: "https://ik.imagekit.io/jamnwgicn",
  authenticationEndpoint:
    "https://imagekit-auth-serverless-b5cwnfygq-jims-projects-154aa221.vercel.app/api/auth", // This is your new endpoint
});

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

// Function to upload images to ImageKit
function uploadToImageKit(file, folderPath) {
  return new Promise((resolve, reject) => {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

    imagekit.upload(
      {
        file: file,
        fileName: fileName,
        folder: folderPath,
        tags: ["dormies", "listing"],
      },
      function (err, result) {
        if (err) {
          console.error("ImageKit upload error:", err);
          reject(err);
        } else {
          console.log("ImageKit upload success:", result);
          resolve(result.url); // Return the URL of the uploaded image
        }
      }
    );
  });
}

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
      if (!title) {
        alert("Please enter a title for your listing");
        saveButton.disabled = false;
        saveButton.innerHTML = '<i class="fa fa-check"></i> Done';
        return;
      }

      const listingData = {
        title,
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

          // Upload the image from /tmp to ImageKit
          const folderPath = `dormies/owners/${ownerId}/listings/${newListingRef.id}`;
          const imageUrl = await uploadToImageKit(tmpFilePath, folderPath);
          uploadedURLs.push(imageUrl);
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
