import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
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
const db = getFirestore(app);

function createAdminListingCard(listing) {
  const card = document.createElement("div");
  card.className = "listing-card";

  const statusClass =
    listing.status === "Available" ? "status-available" : "status-unavailable";

  card.innerHTML = `
      <div class="listing-img-container">
        <h2>${listing.title ?? "No Title"}</h2>
        <div class="listing-status ${statusClass}">${listing.status}</div>
      </div>
      <div class="listing-info">
        <div class="listing-price">${formatPrice(
          listing.pricing?.rentAmount ?? 0,
          listing.contractTerms?.rentPeriod ?? ""
        )}</div>
        <div class="listing-location">${
          listing.address?.full ?? "No Address Provided"
        }</div>
        <div class="listing-actions">
          <button class="action-btn edit-btn" data-id="${
            listing.id
          }">Edit</button>
          <button class="action-btn view-btn" data-id="${
            listing.id
          }">Delete</button>
        </div>
      </div>
    `;

  return card;
}
