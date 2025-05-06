// Import Firebase core and the needed services
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

  const listingDetailsModule = window.listingDetailsModule || {};

  const checkListingData = setInterval(() => {
    if (listingDetailsModule.listingData) {
      clearInterval(checkListingData);
      const { id: listingId, ownerId } = listingDetailsModule.listingData;

      if (listingId && ownerId) {
        initializeReviews(ownerId, listingId);
      } else {
        console.error("Missing listing ID or owner ID");
      }
    }
  }, 500);
});

function initializeReviews(ownerId, listingId) {
  const db = getFirestore();
  const auth = getAuth();

  const writeReviewButton = document.getElementById("writeReviewButton");
  const reviewModal = document.getElementById("reviewModal");
  const reviewsList = document.getElementById("reviewsList");

  if (!writeReviewButton || !reviewModal || !reviewsList) {
    console.warn("Review elements not found on page");
    return;
  }

  const closeReviewButton = document.getElementById("closeReview");
  const submitReviewButton = document.getElementById("submitReview");
  const reviewTextArea = document.getElementById("reviewText");
  const ratingInputs = document
    .getElementById("starRating")
    .querySelectorAll("input[type='radio']");
  const reviewForm = document.getElementById("reviewForm");

  async function saveReview(reviewText, rating) {
    const user = auth.currentUser;

    if (!user) {
      showNotice("You must be logged in to leave a review");
      return false;
    }

    try {
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
        if (data.listingId === listingId) {
          reviews.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(data.timestamp),
          });
        }
      });
      return reviews;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      showNotice("Failed to load reviews.");
      return [];
    }
  }

  function showNotice(message, duration = 3000) {
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
    const reviewText = reviewTextArea.value.trim();
    const rating = getSelectedRating();

    if (!reviewText || rating < 1 || rating > 5) {
      showNotice("Please enter review text and select a rating.");
      return;
    }

    const success = await saveReview(reviewText, rating);
    if (success) {
      reviewForm.reset();
      reviewModal.classList.add("hide");
      loadReviews();
    }
  }

  writeReviewButton.addEventListener("click", () => {
    reviewModal.classList.remove("hide");
  });

  closeReviewButton.addEventListener("click", () => {
    reviewModal.classList.add("hide");
  });

  reviewForm.addEventListener("submit", handleReviewSubmit);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      writeReviewButton.classList.remove("hidden");
    } else {
      writeReviewButton.classList.add("hidden");
    }
  });

  loadReviews();
}
