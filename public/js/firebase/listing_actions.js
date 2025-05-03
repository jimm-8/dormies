// listing_actions.js - Handles edit and delete functionality for owner listings

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  deleteDoc,
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

// Notification system
function showNotice(message, duration = 3000) {
  const noticeBox = document.getElementById("noticeBox");
  const noticeText = document.getElementById("noticeText");

  if (!noticeBox || !noticeText) {
    console.error("Notice elements not found in DOM");
    return;
  }

  noticeText.textContent = message;
  noticeBox.classList.remove("hide");
  noticeBox.classList.add("show");

  setTimeout(() => {
    noticeBox.classList.remove("show");
    noticeBox.classList.add("hide");
  }, duration);
}

/**
 * Handle edit button click
 * @param {string|HTMLElement} listingIdOrButton - Either the listing ID or the clicked button
 */
async function handleEditListing(listingIdOrButton) {
  try {
    const user = auth.currentUser;
    if (!user) {
      showNotice("You must be logged in to edit a listing.");
      return;
    }

    // Determine if we were passed a button or a listing ID
    let listingId;
    if (typeof listingIdOrButton === "string") {
      listingId = listingIdOrButton;
    } else {
      // Handle button click
      listingId =
        listingIdOrButton.dataset.id ||
        listingIdOrButton.getAttribute("data-listing-id");

      if (!listingId) {
        console.error("No listing ID found on edit button");
        return;
      }
    }

    // Get the listing data from Firestore
    const ownerId = user.uid;
    const listingRef = doc(db, "owners", ownerId, "listings", listingId);
    const listingSnap = await getDoc(listingRef);

    if (!listingSnap.exists()) {
      showNotice("Listing not found");
      return;
    }

    // Get the listing data
    const listingData = listingSnap.data();

    // Store the listing data and ID in sessionStorage
    sessionStorage.setItem("editListingId", listingId);
    sessionStorage.setItem("editListingData", JSON.stringify(listingData));

    // Redirect to the create listing page
    window.location.href = "/pages/owner/create_listing.html?edit=true";
  } catch (error) {
    console.error("Error handling edit listing:", error);
    showNotice("Failed to edit listing. Please try again.");
  }
}

/**
 * Handle delete button click
 * @param {HTMLElement} button - The clicked button
 */
function handleDeleteListing(button) {
  const listingId = button.dataset.id;
  if (!listingId) {
    console.error("Missing listing ID");
    return;
  }

  const listingCard = button.closest(".listing-card");
  if (!listingCard) {
    console.error("Could not find listing card element");
    return;
  }

  const ownerId = listingCard.dataset.ownerId;
  if (!ownerId) {
    console.error("Missing owner ID");
    return;
  }

  // Show confirmation dialog
  if (
    confirm(
      "Are you sure you want to delete this listing? This action cannot be undone."
    )
  ) {
    deleteListing(ownerId, listingId, listingCard);
  }
}

/**
 * Delete a listing from Firestore
 * @param {string} ownerId - The owner ID
 * @param {string} listingId - The listing ID
 * @param {HTMLElement} listingCard - The listing card element to remove on success
 */
async function deleteListing(ownerId, listingId, listingCard) {
  try {
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showNotice("You must be logged in to delete a listing.");
      return;
    }

    // Verify the current user is the owner
    if (currentUser.uid !== ownerId) {
      showNotice("You can only delete your own listings.");
      return;
    }

    // Show loading state
    const deleteButton = listingCard.querySelector(".delete-btn, .view-btn");
    if (deleteButton) {
      deleteButton.disabled = true;
      deleteButton.textContent = "Deleting...";
    }

    // Delete from Firestore
    const listingRef = doc(db, "owners", ownerId, "listings", listingId);
    await deleteDoc(listingRef);

    // Remove the card with animation
    listingCard.classList.add("fade-out");

    // After animation completes, remove the element
    setTimeout(() => {
      listingCard.remove();

      // Check if there are no more listings
      const remainingListings = document.querySelectorAll(
        ".listing-card:not(.no-listings)"
      );
      if (remainingListings.length === 0) {
        const listingsGrid = document.querySelector(".listings-grid");
        const noListingsCard = document.createElement("div");
        noListingsCard.className = "listing-card no-listings";
        noListingsCard.innerHTML = `
          <p>You don't have any active listings yet.</p>
        `;

        // Insert after the "Add New Listing" button
        const addButton = document.getElementById("create_btn");
        if (addButton && listingsGrid) {
          listingsGrid.insertBefore(noListingsCard, addButton.nextSibling);
        }
      }

      showNotice("Listing successfully deleted!");
    }, 300);
  } catch (error) {
    console.error("Error deleting listing:", error);
    showNotice("Failed to delete listing. Please try again.");

    // Reset button state
    const deleteButton = listingCard.querySelector(".delete-btn, .view-btn");
    if (deleteButton) {
      deleteButton.disabled = false;
      deleteButton.textContent = "Delete";
    }
  }
}

/**
 * Handle clicks on edit and delete buttons
 * @param {Event} event - The click event
 */
function handleListingAction(event) {
  const target = event.target;

  // Check for edit button - handle multiple possible class names
  if (
    target.classList.contains("edit-btn") ||
    target.classList.contains("edit-listing-btn")
  ) {
    event.preventDefault();
    event.stopPropagation();
    handleEditListing(target);
  }
  // Check for delete button - handle multiple possible class names
  else if (
    target.classList.contains("delete-btn") ||
    target.classList.contains("view-btn")
  ) {
    event.preventDefault();
    event.stopPropagation();
    handleDeleteListing(target);
  }
}

// Add styles for animations
function addStyles() {
  // Only add if they don't already exist
  if (!document.getElementById("listing-action-styles")) {
    const styleEl = document.createElement("style");
    styleEl.id = "listing-action-styles";
    styleEl.innerHTML = `
      .fade-out {
        opacity: 0;
        transform: scale(0.9);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      .listing-card {
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
    `;
    document.head.appendChild(styleEl);
  }
}

// Initialize everything when the DOM loads
document.addEventListener("DOMContentLoaded", () => {
  // Check authentication
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      console.log("User not logged in");
      window.location.href = "/pages/login.html";
      return;
    }
  });

  // Add event delegation for all listing action buttons
  const listingsGrid = document.querySelector(".listings-grid");
  if (listingsGrid) {
    listingsGrid.addEventListener("click", handleListingAction);
  }

  // Add animation styles
  addStyles();
});

// Export functions for use in other files if needed
export { handleEditListing, handleDeleteListing, deleteListing };
