import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

/**
 * Initialize the reviews module
 * @param {string} ownerId - The owner ID from the listing
 * @param {string} listingId - The listing ID being reviewed
 */
export function initializeReviews(ownerId, listingId) {
  // Get Firestore and Auth instance
  const db = getFirestore();
  const auth = getAuth();

  // Get elements for modal and review button
  const writeReviewButton = document.getElementById("writeReviewButton");
  const reviewModal = document.getElementById("reviewModal");

  if (!writeReviewButton || !reviewModal) {
    console.warn("Review elements not found on page");
    return;
  }

  const closeReviewButton = document.getElementById("closeReview");
  const submitReviewButton = reviewModal.querySelector("button[type='submit']");
  const reviewTextArea = reviewModal.querySelector("textarea");
  const ratingInputs = reviewModal.querySelectorAll("input[name='rating']");
  const reviewForm = reviewModal.querySelector("form");

  /**
   * Save a review to Firestore
   * @param {string} reviewText - The review text content
   * @param {number} rating - The star rating (1-5)
   */
  async function saveReview(reviewText, rating) {
    const user = auth.currentUser;

    if (!user) {
      showNotice("You must be logged in to leave a review");
      return;
    }

    try {
      // Create a reference to the reviews collection for this listing
      const reviewsRef = collection(
        db,
        "owners",
        ownerId,
        "listings",
        listingId,
        "reviews"
      );

      // Create a new review document
      await addDoc(reviewsRef, {
        reviewText: reviewText,
        rating: rating,
        createdAt: serverTimestamp(),
        userId: user.uid,
        userName: user.displayName || "Anonymous User",
        userEmail: user.email,
      });

      showNotice("Review submitted successfully!");
      return true;
    } catch (error) {
      console.error("Error saving review:", error);
      showNotice("Error saving review. Please try again.");
      return false;
    }
  }

  /**
   * Fetch reviews for the current listing
   */
  async function fetchReviews() {
    try {
      // Reference to the "reviews" subcollection for this listing
      const reviewsRef = collection(
        db,
        "owners",
        ownerId,
        "listings",
        listingId,
        "reviews"
      );

      // Query to fetch reviews sorted by "createdAt" in descending order
      const reviewsQuery = query(reviewsRef, orderBy("createdAt", "desc"));

      // Get the reviews
      const querySnapshot = await getDocs(reviewsQuery);

      if (querySnapshot.empty) {
        console.log("No reviews yet for this listing.");
        return [];
      }

      // Parse the reviews data
      const reviews = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Handle Firebase timestamp
          createdAt: data.createdAt?.toDate?.() || new Date(),
        };
      });

      return reviews;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      showNotice("Error loading reviews. Please try refreshing the page.");
      return [];
    }
  }

  /**
   * Display a notice to the user
   * @param {string} message - The message to display
   * @param {number} duration - How long to show the message
   */
  function showNotice(message, duration = 3000) {
    const noticeBox = document.getElementById("noticeBox");
    const noticeText = document.getElementById("noticeText");

    if (!noticeBox || !noticeText) {
      console.warn("Notice box elements not found");
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

  /**
   * Load and display reviews for the current listing
   */
  async function loadReviews() {
    const reviews = await fetchReviews();
    const reviewsList = document.querySelector(".reviews-list");

    if (!reviewsList) {
      console.warn("Reviews list element not found");
      return;
    }

    reviewsList.innerHTML = ""; // Clear previous reviews

    if (reviews.length === 0) {
      reviewsList.innerHTML = `
        <div class="no-reviews-message">
          <p>No reviews yet. Be the first to leave a review!</p>
        </div>
      `;
      return;
    }

    // Create and append each review to the list
    reviews.forEach((review) => {
      const reviewElement = document.createElement("div");
      reviewElement.classList.add("review");

      // Generate stars HTML based on rating
      const starsHtml = generateStarsHtml(review.rating || 0);

      reviewElement.innerHTML = `
        <div class="review-header">
          <strong>${review.userName || "Anonymous"}</strong>
          <span class="review-date">${review.createdAt.toLocaleDateString()}</span>
        </div>
        <div class="review-rating">
          ${starsHtml}
        </div>
        <div class="review-text">
          <p>${review.reviewText}</p>
        </div>
      `;

      reviewsList.appendChild(reviewElement);
    });
  }

  /**
   * Generate HTML for displaying star ratings
   * @param {number} rating - The rating value (1-5)
   * @returns {string} HTML for displaying stars
   */
  function generateStarsHtml(rating) {
    let starsHtml = "";
    const fullStar = '<i class="fas fa-star"></i>';
    const emptyStar = '<i class="far fa-star"></i>';
    const halfStar = '<i class="fas fa-star-half-alt"></i>';

    // Round to nearest 0.5
    const roundedRating = Math.round(rating * 2) / 2;

    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        starsHtml += fullStar;
      } else if (i - 0.5 === roundedRating) {
        starsHtml += halfStar;
      } else {
        starsHtml += emptyStar;
      }
    }

    return `<div class="stars">${starsHtml}</div>`;
  }

  /**
   * Get the currently selected rating value
   * @returns {number} The selected rating (1-5)
   */
  function getSelectedRating() {
    for (const input of ratingInputs) {
      if (input.checked) {
        return parseInt(input.value, 10);
      }
    }
    return 0; // No rating selected
  }

  /**
   * Handle review form submission
   * @param {Event} e - Form submission event
   */
  async function handleReviewSubmit(e) {
    e.preventDefault();

    const reviewText = reviewTextArea.value.trim();
    const rating = getSelectedRating();

    if (!reviewText) {
      showNotice("Please write a review.");
      return;
    }

    if (rating === 0) {
      showNotice("Please select a rating.");
      return;
    }

    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
      showNotice("Please log in to submit a review.");
      reviewModal.style.display = "none";
      window.location.href = `/pages/login.html?redirect=${encodeURIComponent(
        window.location.href
      )}`;
      return;
    }

    // Save the review
    const success = await saveReview(reviewText, rating);

    if (success) {
      // Clear form
      reviewTextArea.value = "";
      ratingInputs.forEach((input) => (input.checked = false));

      // Close the modal after submission
      reviewModal.style.display = "none";

      // Refresh the reviews list
      await loadReviews();
    }
  }

  // Setup event listeners only if elements exist
  if (writeReviewButton) {
    // Check auth state and setup review button
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        writeReviewButton.disabled = true;
        writeReviewButton.title = "You must be logged in to leave a review";
        writeReviewButton.addEventListener("click", () => {
          showNotice("Please log in to write a review.");
        });
      } else {
        writeReviewButton.disabled = false;
        writeReviewButton.title = "Write a review";
        writeReviewButton.addEventListener("click", () => {
          reviewModal.style.display = "block";
        });
      }
    });
  }

  if (closeReviewButton) {
    closeReviewButton.addEventListener("click", () => {
      reviewModal.style.display = "none";
    });
  }

  if (reviewForm) {
    reviewForm.addEventListener("submit", handleReviewSubmit);
  }

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === reviewModal) {
      reviewModal.style.display = "none";
    }
  });

  // Close modal with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && reviewModal.style.display === "block") {
      reviewModal.style.display = "none";
    }
  });

  // Load reviews on initialization
  loadReviews();

  // Return public methods
  return {
    refreshReviews: loadReviews,
  };
}
