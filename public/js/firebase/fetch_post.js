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

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const loader = document.querySelector(".loader");
    const listingsContainer = document.querySelector(".listings-container");
    listingsContainer.innerHTML = "";

    const listings = await fetchAllListings();

    if (listings.length === 0) {
      listingsContainer.innerHTML = `
        <div class="no-listings">
          <p>No listings available at the moment.</p>
        </div>
      `;
    } else {
      listings.forEach((listing) => {
        const listingElement = createListingElement(listing);
        listingsContainer.appendChild(listingElement);
      });
    }

    setupSearch(listings, listingsContainer);

    if (loader) loader.style.display = "none";
  } catch (error) {
    console.error("Error fetching listings:", error);
    const listingsContainer = document.querySelector(".listings-container");
    listingsContainer.innerHTML = `
      <div class="error-message">
        <p>Failed to load listings. Please try again later.</p>
      </div>
    `;
    const loader = document.querySelector(".loader");
    if (loader) loader.style.display = "none";
  }
});

async function fetchAllListings() {
  const ownersSnapshot = await getDocs(collection(db, "owners"));
  const allListings = [];

  for (const ownerDoc of ownersSnapshot.docs) {
    const ownerId = ownerDoc.id;
    const listingsQuery = query(
      collection(db, "owners", ownerId, "listings"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const listingsSnapshot = await getDocs(listingsQuery);
    listingsSnapshot.forEach((doc) => {
      allListings.push({
        id: doc.id,
        ownerId,
        ...doc.data(),
      });
    });
  }

  return allListings;
}

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

function createListingElement(listing) {
  const listingCard = document.createElement("a");
  listingCard.href = `/pages/renter/listing.html?ownerId=${listing.ownerId}&listingId=${listing.id}`;
  listingCard.className = "listing-card";

  const address = [
    listing.address?.street || "",
    listing.address?.blkNo ? `Blk ${listing.address.blkNo}` : "",
    listing.address?.landmark || "",
  ]
    .filter(Boolean)
    .join(", ");

  const formattedPrice = formatPrice(
    listing.pricing?.rentAmount ?? 0,
    listing.contractTerms?.rentPeriod ?? ""
  );

  listingCard.innerHTML = `
    <div class="image-container">
      <img src="${getImageSrc(listing)}" alt="${
    listing.title
  }" class="listing-image">
      <div class="verified-badge">
        <i class="ri-checkbox-circle-fill"></i> Verified
      </div>
    </div>
    <div class="listing-info">
      <h3 class="title">${listing.title ?? "No Title Provided"}</h3>
      <p class="address">${address}</p>
      <p class="price-tag">Starts at ${formattedPrice}</p>
    </div>
  `;

  return listingCard;
}

function getImageSrc(listing) {
  return "/assets/dorm1.jpg";
}

function formatPrice(price, period) {
  if (!period || typeof period !== "string")
    return `₱${(price || 0).toLocaleString()}`;

  switch (period.toLowerCase()) {
    case "daily":
      return `₱${price.toLocaleString()} / day`;
    case "weekly":
      return `₱${price.toLocaleString()} / week`;
    case "monthly":
      return `₱${price.toLocaleString()} / month`;
    default:
      return `₱${price.toLocaleString()}`;
  }
}

function setupSearch(allListings, listingsContainer) {
  const searchInput = document.querySelector(".search-input");

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase().trim();

      listingsContainer.innerHTML = "";

      const filteredListings = allListings.filter((listing) => {
        const title = listing.title?.toLowerCase() || "";
        const description = listing.description?.toLowerCase() || "";
        const street = listing.address?.street?.toLowerCase() || "";
        const landmark = listing.address?.landmark?.toLowerCase() || "";

        return (
          title.includes(searchTerm) ||
          description.includes(searchTerm) ||
          street.includes(searchTerm) ||
          landmark.includes(searchTerm)
        );
      });

      if (filteredListings.length === 0) {
        listingsContainer.innerHTML = `
          <div class="no-listings">
            <p>No listings found matching "${searchTerm}".</p>
          </div>
        `;
      } else {
        filteredListings.forEach((listing) => {
          const listingElement = createListingElement(listing);
          listingsContainer.appendChild(listingElement);
        });
      }
    });
  }
}
