function getImageSrc(listing) {
  const fallbackImages = ["/assets/dorm1.jpg", "/assets/property-photos/dorm1_1.jpg", "/assets/property-photos/dorm1_2.jpg", 
    "/assets/property-photos/dorm1_3.jpg", "/assets/property-photos/dorm1_4.jpg", "/assets/dorm2.jpg", "/assets/dorm3.jpg"
  ];
  
  if (listing.photos && listing.photos.length > 0) {
    const randomIndex = Math.floor(Math.random() * listing.photos.length);
    return listing.photos[randomIndex];
  }

  const fallbackIndex = Math.floor(Math.random() * fallbackImages.length);
  return fallbackImages[fallbackIndex];
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCV7GHk-wK5bhDg2Inqm7vJqTYjl1TTTNw",
  authDomain: "dormies-b47b7.firebaseapp.com",
  projectId: "dormies-b47b7",
  storageBucket: "dormies-b47b7.appspot.com",
  messagingSenderId: "443577320462",
  appId: "1:443577320462:web:0a418fa107fbd01bd1285f",
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.querySelector(".loader");
  const listingsContainer = document.querySelector(".listings-container");
  const listingCard = document.querySelector(".listing-card");
  const isOwnerDashboard =
    listingCard && document.querySelector(".listings-grid");

  try {
    // First check if we're on the owner dashboard
    if (isOwnerDashboard) {
      // Get current user ID if available - this will use Firebase Auth from fetch_user.js
      const currentUserId = await getCurrentUserId();
      console.log("Current owner ID:", currentUserId);

      if (currentUserId) {
        // For owner view, we only need to fetch listings for this specific owner
        const ownerListings = await fetchOwnerListings(currentUserId);
        displayOwnerListings(ownerListings);
      } else {
        console.error("No authenticated owner found");
        if (listingCard) {
          listingCard.innerHTML = `
            <div class="error-message">
              <p>Please log in to view your listings.</p>
            </div>
          `;
        }
      }
    } else if (listingsContainer) {
      // For renter view, fetch all listings from all owners
      const allListings = await fetchAllListings();
      displayRenterListings(allListings, listingsContainer);
    }
  } catch (err) {
    console.error("Error loading listings:", err);
    const errorHTML = `
      <div class="error-message">
        <p>Failed to load listings. Please try again later.</p>
      </div>
    `;
    if (listingsContainer) {
      listingsContainer.innerHTML = errorHTML;
    } else if (isOwnerDashboard && listingCard) {
      listingCard.innerHTML = errorHTML;
    }
  }

  if (loader) loader.style.display = "none";
});

// Fetch listings for a specific owner
async function fetchOwnerListings(ownerId) {
  try {
    const listingsQuery = query(
      collection(db, "owners", ownerId, "listings"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const listingsSnapshot = await getDocs(listingsQuery);
    const ownerListings = [];

    listingsSnapshot.forEach((doc) => {
      ownerListings.push({
        id: doc.id,
        ownerId,
        ...doc.data(),
      });
    });

    return ownerListings;
  } catch (error) {
    console.error("Error fetching owner listings:", error);
    return [];
  }
}

// Display listings for owner dashboard
function displayOwnerListings(listings) {
  const listingCard = document.querySelector(".listing-card");
  const listingsGrid = document.querySelector(".listings-grid");

  if (!listingCard || !listingsGrid) return;

  // Clear the placeholder listing card
  listingCard.remove();

  if (listings.length === 0) {
    const noListingsCard = document.createElement("div");
    noListingsCard.className = "listing-card no-listings";
    noListingsCard.innerHTML = `
      <p>You don't have any active listings yet.</p>
    `;

    // Insert after the "Add New Listing" button
    const addButton = document.getElementById("create_btn");
    if (addButton) {
      listingsGrid.insertBefore(noListingsCard, addButton.nextSibling);
    } else {
      listingsGrid.appendChild(noListingsCard);
    }
  } else {
    // Add each listing as a separate card
    listings.forEach((listing) => {
      const element = createAdminListingCard(listing);
      listingsGrid.appendChild(element);
    });
  }
}

// Display listings for renter view
function displayRenterListings(listings, container) {
  if (listings.length === 0) {
    container.innerHTML = `
      <div class="no-listings">
        <p>No listings available at the moment.</p>
      </div>
    `;
    return;
  }

  // Clear the container first
  container.innerHTML = "";

  // Add each listing
  listings.forEach((listing) => {
    const element = createListingElement(listing);
    container.appendChild(element);
  });

  // Set up search functionality
  setupSearch(listings, container);
}

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

    try {
      const listingsSnapshot = await getDocs(listingsQuery);

      listingsSnapshot.forEach((doc) => {
        allListings.push({
          id: doc.id,
          ownerId,
          ...doc.data(),
        });
      });
    } catch (error) {
      console.error(`Error fetching listings for owner ${ownerId}:`, error);
    }
  }

  return allListings;
}

function createListingElement(listing) {
  const el = document.createElement("a");
  el.href = `/pages/renter/listing.html?ownerId=${listing.ownerId}&listingId=${listing.id}`;
  el.className = "listing-card";

  const address = [
    listing.address?.street,
    listing.address?.blkNo ? `Blk ${listing.address.blkNo}` : "",
    listing.address?.landmark,
  ]
    .filter(Boolean)
    .join(", ");

  const price = formatPrice(
    listing.pricing?.rentAmount ?? 0,
    listing.contractTerms?.rentPeriod ?? ""
  );

  el.innerHTML = `
    <div class="image-container">
      <img src="${getImageSrc(listing)}" alt="${
    listing.title
  }" class="listing-image">
      <div class="verified-badge">
        <i class="ri-checkbox-circle-fill"></i> Verified
      </div>
    </div>
    <div class="listing-info">
      <h3 class="title">${listing.title ?? "No Title"}</h3>
      <p class="address">${address}</p>
      <p class="price-tag">Starts at ${price}</p>
    </div>
  `;
  return el;
}

function createAdminListingCard(listing) {
  const card = document.createElement("div");
  card.className = "listing-card";

  // Add data attributes to the card for easy access
  card.dataset.listingId = listing.id;
  card.dataset.ownerId = listing.ownerId;

  const address = [
    listing.address?.street,
    listing.address?.blkNo ? `Blk ${listing.address.blkNo}` : "",
    listing.address?.landmark,
  ]
    .filter(Boolean)
    .join(", ");

  card.innerHTML = `
    <div class="listing-img-container">
      <h2>${listing.title ?? "No Title"}</h2>
      <div class="listing-status">Available</div>
    </div>
    <div class="listing-info">
      <div class="listing-price">${formatPrice(
        listing.pricing?.rentAmount ?? 0,
        listing.contractTerms?.rentPeriod ?? ""
      )}</div>
      <div class="listing-location">${address || "No Address"}</div>
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

function formatPrice(price, period) {
  if (!period) return `₱${(price || 0).toLocaleString()}`;

  const tag =
    {
      daily: "day",
      weekly: "week",
      monthly: "month",
    }[period.toLowerCase()] || "";

  return `₱${price.toLocaleString()}${tag ? " / " + tag : ""}`;
}

// Get current user ID from Firebase Auth
async function getCurrentUserId() {
  try {
    // Wait for auth to be initialized if needed
    return new Promise((resolve) => {
      // Check if auth is already initialized from fetch_user.js
      const auth = getAuth();

      // Get the current signed in user
      const currentUser = auth.currentUser;

      if (currentUser) {
        // User is already signed in, return their ID immediately
        console.log("Current user found:", currentUser.uid);
        resolve(currentUser.uid);
      } else {
        // Wait for auth state to change
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe();
          if (user) {
            console.log("User authenticated:", user.uid);
            resolve(user.uid);
          } else {
            console.log("No authenticated user found");
            resolve(null);
          }
        });
      }
    });
  } catch (error) {
    console.error("Error getting current user ID:", error);
    return null;
  }
}

function setupSearch(allListings, listingsContainer) {
  const searchInput = document.querySelector(".search-input");
  if (!searchInput) return;

  searchInput.addEventListener("input", function () {
    const term = this.value.toLowerCase().trim();
    listingsContainer.innerHTML = "";

    const matches = allListings.filter((listing) => {
      const title = listing.title?.toLowerCase() || "";
      const desc = listing.description?.toLowerCase() || "";
      const street = listing.address?.street?.toLowerCase() || "";
      const landmark = listing.address?.landmark?.toLowerCase() || "";
      return [title, desc, street, landmark].some((val) => val.includes(term));
    });

    if (matches.length === 0) {
      listingsContainer.innerHTML = `
        <div class="no-listings">
          <p>No listings found matching "${term}".</p>
        </div>
      `;
    } else {
      matches.forEach((listing) => {
        const card = createListingElement(listing);
        listingsContainer.appendChild(card);
      });
    }
  });
}
