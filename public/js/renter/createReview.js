// Fixed version of createReview.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  where,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded - initializing review system");
  
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

  // Check URL parameters for listing ID and owner ID
  const urlParams = new URLSearchParams(window.location.search);
  // FIX: Corrected parameter extraction - the parameters were swapped
  const listingId = urlParams.get('listingId');
  const ownerId = urlParams.get('ownerId');
  
  console.log("URL params:", { listingId, ownerId });

  // Also check for data from listing_deets.js module as fallback
  const listingDetailsModule = window.listingDetailsModule || {};

  // First try URL params, then fall back to module data
  if (listingId && ownerId) {
    console.log("Initializing reviews with URL params");
    initializeReviews(db, auth, listingId, ownerId);
  } else {
    console.log("Checking for listing data from module");
    const checkListingData = setInterval(() => {
      if (listingDetailsModule.listingData) {
        clearInterval(checkListingData);
        const { id: moduleListingId, ownerId: moduleOwnerId } = listingDetailsModule.listingData;

        if (moduleListingId && moduleOwnerId) {
          console.log("Initializing reviews with module data");
          initializeReviews(db, auth, moduleListingId, moduleOwnerId);
        } else {
          console.error("Missing listing ID or owner ID in module data");
        }
      }
    }, 500);
  }
});

function initializeReviews(db, auth, listingId, ownerId) {
  console.log(`Setting up reviews for listing: ${listingId}, owner: ${ownerId}`);
  
  // Debug DOM elements
  const writeReviewButton = document.getElementById("writeReviewButton");
  const reviewModal = document.getElementById("reviewModal");
  const reviewsList = document.getElementById("reviewsList");
  const closeReviewButton = document.getElementById("closeReview");
  const submitReviewButton = document.getElementById("submitReview");
  const reviewTextArea = document.getElementById("reviewText");
  const reviewForm = document.getElementById("reviewForm");
  
  console.log("DOM elements:", {
    writeReviewButton: !!writeReviewButton,
    reviewModal: !!reviewModal, 
    reviewsList: !!reviewsList,
    closeReviewButton: !!closeReviewButton,
    submitReviewButton: !!submitReviewButton,
    reviewTextArea: !!reviewTextArea,
    reviewForm: !!reviewForm
  });

  if (!writeReviewButton || !reviewModal || !reviewsList) {
    console.warn("Review elements not found on page");
    return;
  }

  const ratingInputs = document
    .getElementById("starRating")
    .querySelectorAll("input[type='radio']");

  async function saveReview(reviewText, rating) {
    const user = auth.currentUser;
    console.log("Current user:", user);

    if (!user) {
      showNotice("You must be logged in to leave a review");
      return false;
    }

    try {
      console.log("Saving review with data:", {
        reviewText: reviewText.substring(0, 20) + "...", // log partial content for privacy
        rating,
        listingId,
        ownerId
      });
      
      const reviewsRef = collection(db, "reviews");
      const reviewData = {
        reviewText,
        rating,
        createdAt: serverTimestamp(),
        timestamp: new Date().getTime(),
        date: new Date().toISOString(),
        listingId,
        ownerId,
        renterId: user.uid,
        renterName: user.displayName || "Anonymous Renter",
        renterEmail: user.email || "unknown@email.com",
        status: "active",
      };

      const docRef = await addDoc(reviewsRef, reviewData);
      console.log("Review saved with ID:", docRef.id);
      showNotice("Review submitted successfully!");
      return true;
    } catch (error) {
      console.error("Error saving review:", error);
      showNotice("Error saving review. Please try again.");
      return false;
    }
  }

  async function fetchReviews() {
    console.log("Fetching reviews for listing:", listingId);
    try {
      const q = query(
        collection(db, "reviews"),
        where("listingId", "==", listingId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const reviews = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.timestamp),
        });
      });
      
      console.log(`Fetched ${reviews.length} reviews`);
      return reviews;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      showNotice("Failed to load reviews.");
      return [];
    }
  }

  function showNotice(message, duration = 3000) {
    console.log("Notice:", message);
    const noticeBox = document.getElementById("noticeBox");
    const noticeText = document.getElementById("noticeText");
    if (!noticeBox || !noticeText) {
      alert(message);
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

  async function loadReviews() {
    console.log("Loading reviews into UI");
    reviewsList.innerHTML = `<div class="reviews-loading"><i class="fa fa-spinner fa-pulse"></i> Loading reviews...</div>`;
    const reviews = await fetchReviews();
    reviewsList.innerHTML = "";

    if (reviews.length === 0) {
      reviewsList.innerHTML = `<div class="no-reviews-message"><p>No reviews yet. Be the first to leave a review!</p></div>`;
      return;
    }

    const avgRating =
      reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;

    const summary = document.createElement("div");
    summary.classList.add("ratings-summary");
    summary.innerHTML = `
      <div class="average-rating">
        <span class="rating-value">${avgRating.toFixed(1)}</span>
        <div class="stars">${generateStarsHtml(avgRating)}</div>
        <span class="rating-count">(${reviews.length} ${
      reviews.length === 1 ? "review" : "reviews"
    })</span>
      </div>`;
    reviewsList.appendChild(summary);

    const container = document.createElement("div");
    container.classList.add("reviews-items");

    reviews.forEach((review) => {
      const date = review.createdAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      const el = document.createElement("div");
      el.classList.add("review");
      el.innerHTML = `
        <div class="review-header">
          <div class="reviewer-info">
            <strong>${review.renterName}</strong>
            <span class="review-date">${date}</span>
          </div>
          <div class="review-rating">${generateStarsHtml(
            review.rating || 0
          )}</div>
        </div>
        <div class="review-text">
          <p>${review.reviewText}</p>
        </div>`;
      container.appendChild(el);
    });

    reviewsList.appendChild(container);
    console.log("Reviews displayed successfully");
  }

  function generateStarsHtml(rating) {
    let html = "";
    const full = '<i class="fas fa-star"></i>';
    const half = '<i class="fas fa-star-half-alt"></i>';
    const empty = '<i class="far fa-star"></i>';
    const rounded = Math.round(rating * 2) / 2;

    for (let i = 1; i <= 5; i++) {
      html += i <= rounded ? full : i - 0.5 === rounded ? half : empty;
    }
    return html;
  }

  function getSelectedRating() {
    for (const input of ratingInputs) {
      if (input.checked) return parseInt(input.value, 10);
    }
    return 0;
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    console.log("Review form submitted");
    
    const reviewText = reviewTextArea.value.trim();
    const rating = getSelectedRating();
    
    console.log("Review data:", { reviewText: reviewText.substring(0, 20) + "...", rating });

    if (!reviewText || rating < 1 || rating > 5) {
      showNotice("Please enter review text and select a rating.");
      return;
    }

    const success = await saveReview(reviewText, rating);
    if (success) {
      console.log("Review saved successfully, reloading reviews");
      reviewForm.reset();
      
      // Try both class hide and display:none to ensure modal closes
      reviewModal.classList.add("hide");
      reviewModal.style.display = "none";
      
      // Make sure to reload the reviews
      await loadReviews();
    }
  }

  // Set up event listeners
  writeReviewButton.addEventListener("click", () => {
    console.log("Opening review modal");
    reviewModal.classList.remove("hide");
    reviewModal.style.display = "block";
  });

  closeReviewButton.addEventListener("click", () => {
    console.log("Closing review modal");
    reviewModal.classList.add("hide");
    reviewModal.style.display = "none";
  });

  // Ensure the form submission is properly handled
  if (reviewForm) {
    reviewForm.addEventListener("submit", (e) => {
      console.log("Form submission detected");
      handleReviewSubmit(e);
    });
  }

  // Handle direct submit button click as well
  if (submitReviewButton) {
    submitReviewButton.addEventListener("click", (e) => {
      console.log("Submit button clicked");
      handleReviewSubmit(e);
    });
  }

  // Check if the user is logged in
  onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user ? "logged in" : "logged out");
    if (user) {
      writeReviewButton.classList.remove("hidden");
    } else {
      writeReviewButton.classList.add("hidden");
    }
  });

  // Initial loading of reviews
  console.log("Initial loading of reviews");
  loadReviews();
}