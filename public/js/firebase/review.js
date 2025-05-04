import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// Get Firestore and Auth instance
const db = getFirestore();
const auth = getAuth();

// Get elements for modal and review button
const writeReviewButton = document.getElementById("writeReviewButton");
const reviewModal = document.getElementById("reviewModal");
const closeReviewButton = document.getElementById("closeReview");
const submitReviewButton = reviewModal.querySelector("button");
const reviewTextArea = reviewModal.querySelector("textarea");

// Save a review to Firestore
async function saveReview(renterId, reviewText, rating) {
  const user = auth.currentUser;

  if (!user) {
    console.error("User is not authenticated.");
    return;
  }

  try {
    // Reference to the "reviews" subcollection for the renter
    const reviewsRef = collection(db, "renters", renterId, "reviews");

    // Create a new review document
    await addDoc(reviewsRef, {
      reviewText: reviewText,
      rating: rating,
      createdAt: new Date(), // Timestamp
      userId: user.uid,
      userName: `${user.displayName}`, // Assuming user has a displayName
    });

    console.log("Review saved successfully!");
    alert("Review saved successfully!");
  } catch (error) {
    console.error("Error saving review:", error);
    alert("Error saving review. Please try again.");
  }
}

// Fetch reviews for a specific renter from the subcollection "reviews"
async function fetchReviews(renterId) {
  try {
    // Reference to the "reviews" subcollection for the renter
    const reviewsRef = collection(db, "renters", renterId, "reviews");

    // Query to fetch reviews sorted by "createdAt" in descending order
    const reviewsQuery = query(reviewsRef, orderBy("createdAt", "desc"));

    // Get the reviews
    const querySnapshot = await getDocs(reviewsQuery);

    if (querySnapshot.empty) {
      console.log("No reviews yet.");
      return [];
    }

    // Parse the reviews data
    const reviews = querySnapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() };
    });

    console.log("Fetched reviews:", reviews);
    return reviews;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    alert("Error fetching reviews. Please try again.");
    return [];
  }
}

// Open the review modal
writeReviewButton.addEventListener("click", () => {
  reviewModal.style.display = "block";
});

// Close the review modal
closeReviewButton.addEventListener("click", () => {
  reviewModal.style.display = "none";
});

// Submit the review from the modal
submitReviewButton.addEventListener("click", async () => {
  const renterId = "exampleRenterId"; // Replace with the actual renter's ID
  const reviewText = reviewTextArea.value.trim();

  if (!reviewText) {
    alert("Please write a review.");
    return;
  }

  // Save the review
  await saveReview(renterId, reviewText, 5); // Assuming rating is 5 for now (you can modify as needed)

  // Close the modal after submission
  reviewModal.style.display = "none";

  // Optionally, refresh the reviews list
  loadReviews(renterId);
});

// Fetch and display reviews for a renter
async function loadReviews(renterId) {
  const reviews = await fetchReviews(renterId);

  const reviewsList = document.querySelector(".reviews-list");
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

    reviewElement.innerHTML = `
      <div class="review-header">
        <strong>${review.userName}</strong> - ${new Date(
      review.createdAt.seconds * 1000
    ).toLocaleDateString()}
      </div>
      <div class="review-rating">
        <span>Rating: ${review.rating} / 5</span>
      </div>
      <div class="review-text">
        <p>${review.reviewText}</p>
      </div>
    `;

    reviewsList.appendChild(reviewElement);
  });
}

// Load the reviews when the page is loaded
document.addEventListener("DOMContentLoaded", () => {
  const renterId = "exampleRenterId"; // Replace with the actual renter's ID
  loadReviews(renterId);
});
