import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
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

// Initialize ImageKit with your provided details
const imagekit = new ImageKit({
  publicKey: "public_4etKUvIw7NzEO6bFb0WfzecVFKo=",
  urlEndpoint: "https://ik.imagekit.io/jamnwgicn",
  authenticationEndpoint: "http://www.yourserver.com/auth", // Replace with your actual auth endpoint
});

// Function to preview images before upload
function previewImages(event) {
  const previewContainer = document.getElementById("image-preview"); // Updated to match your HTML
  // Clear any existing previews
  previewContainer.innerHTML = "";

  const files = event.target.files;

  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Only process image files
      if (!file.type.match("image.*")) {
        continue;
      }

      const reader = new FileReader();

      reader.onload = function (e) {
        const previewDiv = document.createElement("div");
        previewDiv.className = "preview-image-container";

        const img = document.createElement("img");
        img.src = e.target.result;
        img.className = "preview-image";
        img.style.width = "100px";
        img.style.height = "100px";
        img.style.objectFit = "cover";
        img.style.margin = "5px";

        previewDiv.appendChild(img);
        previewContainer.appendChild(previewDiv);
      };

      reader.readAsDataURL(file);
    }

    console.log(`${files.length} images ready for upload`);
  }
}

// Update preview listing name when title is typed
document.addEventListener("DOMContentLoaded", () => {
  // Set up the listing name preview
  const titleInput = document.getElementById("listing-title");
  const listingNamePreview = document.getElementById("listing-name");

  if (titleInput && listingNamePreview) {
    titleInput.addEventListener("input", function () {
      listingNamePreview.textContent = this.value || "Not Yet Provided";
    });
  }

  // Set up back button
  const backBtn = document.getElementById("back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.history.back();
    });
  }

  // Check authentication status
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      console.log("User not logged in");
      // Redirect to login page if needed
      // window.location.href = "/pages/login.html";
    }
  });
});

// Function to upload an image to ImageKit.io using the SDK
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

document
  .getElementById("save-listing-btn")
  .addEventListener("click", async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to save a listing");
        // Redirect to login page
        // window.location.href = "/pages/login.html";
        return;
      }

      const ownerId = user.uid;

      // Add a loading state to the button to prevent multiple clicks
      const saveButton = document.getElementById("save-listing-btn");
      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';

      // Validate required fields
      const title = document.getElementById("listing-title").value.trim();
      if (!title) {
        alert("Please enter a title for your listing");
        saveButton.disabled = false;
        saveButton.innerHTML = '<i class="fa fa-check"></i> Done';
        return;
      }

      // Collect input values
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
          // Add other owner details if needed
        },
      };

      console.log("Saving listing data to Firestore...");

      // Save listing document first to get its ID
      const newListingRef = await addDoc(
        collection(db, "owners", ownerId, "listings"),
        listingData
      );

      console.log("Listing saved with ID:", newListingRef.id);

      // Handle image uploads
      const fileInput = document.getElementById("upload-photos");
      const files = fileInput.files;
      const uploadedURLs = [];

      // Add validation and better error handling
      if (!files || files.length === 0) {
        console.log("No images selected for upload");
        // Continue without images
      } else {
        console.log(`Starting upload of ${files.length} images to ImageKit.io`);

        try {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Add size validation (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
              console.warn(
                `File ${file.name} exceeds 5MB size limit, skipping`
              );
              continue;
            }

            // Define folder path for better organization in ImageKit
            const folderPath = `dormies/owners/${ownerId}/listings/${newListingRef.id}`;

            console.log(
              `Uploading file ${i + 1}/${files.length}: ${
                file.name
              } to ImageKit.io`
            );

            // Upload the file to ImageKit
            const imageUrl = await uploadToImageKit(file, folderPath);
            console.log(`File ${i + 1} uploaded successfully: ${imageUrl}`);
            uploadedURLs.push(imageUrl);
          }

          // Update the listing with image URLs if any were uploaded
          if (uploadedURLs.length > 0) {
            console.log(
              `Updating listing with ${uploadedURLs.length} image URLs`
            );
            await updateDoc(
              doc(db, "owners", ownerId, "listings", newListingRef.id),
              {
                imageUrls: uploadedURLs,
              }
            );
            console.log("Image URLs saved to document");
          }
        } catch (error) {
          console.error("Error in image upload process:", error);
          alert(
            "Your listing was saved, but there was an issue with image uploads: " +
              error.message
          );
          saveButton.disabled = false;
          saveButton.innerHTML = '<i class="fa fa-check"></i> Done';
          // Still redirect since the basic listing was saved
          window.location.href = "/pages/owner/dashboard.html";
          return;
        }
      }

      console.log("Listing process complete");
      alert("Listing saved successfully!");
      window.location.href = "/pages/owner/dashboard.html";
    } catch (error) {
      console.error("Error saving listing:", error);
      alert(
        "Failed to save listing. Please try again. Error: " + error.message
      );

      // Reset button state
      const saveButton = document.getElementById("save-listing-btn");
      saveButton.disabled = false;
      saveButton.innerHTML = '<i class="fa fa-check"></i> Done';
    }
  });

// Make the previewImages function accessible globally
window.previewImages = previewImages;
