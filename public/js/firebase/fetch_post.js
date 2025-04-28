import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
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
    // Show loader while fetching data
    const loader = document.querySelector(".loader");

    // Get the container where listings will be displayed
    const listingsContainer = document.querySelector(".listings-container");

    // Clear any example listings
    listingsContainer.innerHTML = "";

    // Fetch all listings from all owners
    const listings = await fetchAllListings();

    if (listings.length === 0) {
      listingsContainer.innerHTML = `
        <div class="no-listings">
          <p>No listings available at the moment.</p>
        </div>
      `;
    } else {
      // Display each listing
      listings.forEach((listing) => {
        const listingElement = createListingElement(listing);
        listingsContainer.appendChild(listingElement);
      });
    }

    // Set up search functionality
    setupSearch(listings, listingsContainer);

    // Hide loader once everything is loaded
    if (loader) {
      loader.style.display = "none";
    }
  } catch (error) {
    console.error("Error fetching listings:", error);
    const listingsContainer = document.querySelector(".listings-container");
    listingsContainer.innerHTML = `
      <div class="error-message">
        <p>Failed to load listings. Please try again later.</p>
      </div>
    `;

    // Hide loader on error
    const loader = document.querySelector(".loader");
    if (loader) {
      loader.style.display = "none";
    }
  }
});

async function fetchAllListings() {
  // Get all owners
  const ownersSnapshot = await getDocs(collection(db, "owners"));
  const allListings = [];

  // For each owner, get their listings
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

function createListingElement(listing) {
  const listingCard = document.createElement("a");
  listingCard.href = `/pages/renter/listing.html?ownerId=${listing.ownerId}&listingId=${listing.id}`;
  listingCard.className = "listing-card";

  // Format the address
  const address = [
    listing.address.street || "",
    listing.address.blkNo ? `Blk ${listing.address.blkNo}` : "",
    listing.address.landmark || "",
  ]
    .filter(Boolean)
    .join(", ");

  // Format the rent amount and period
  const formattedPrice = formatPrice(
    listing.pricing.rentAmount,
    listing.pricing.rentPeriod
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
      <h3 class="title">${listing.title}</h3>
      <p class="address">${address}</p>
      <p class="price-tag">Starts at ${formattedPrice}</p>
    </div>
  `;

  return listingCard;
}

function getImageSrc(listing) {
  // Return default image if no images are available
  return "/assets/dorm1.jpg";
}

function formatPrice(amount, period) {
  // Format currency
  const formattedAmount = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(amount);

  // Determine period text
  let periodText;
  switch (period.toLowerCase()) {
    case "daily":
      periodText = "daily";
      break;
    case "weekly":
      periodText = "weekly";
      break;
    case "monthly":
      periodText = "monthly";
      break;
    case "quarterly":
      periodText = "quarterly";
      break;
    case "yearly":
      periodText = "yearly";
      break;
    default:
      periodText = period;
  }

  return `${formattedAmount} ${periodText}`;
}

function setupSearch(allListings, listingsContainer) {
  const searchInput = document.querySelector(".search-input");

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase().trim();

      if (searchTerm === "") {
        // If search is empty, show all listings
        listingsContainer.innerHTML = "";
        allListings.forEach((listing) => {
          const listingElement = createListingElement(listing);
          listingsContainer.appendChild(listingElement);
        });
        return;
      }

      // Filter listings based on search term
      const filteredListings = allListings.filter((listing) => {
        const title = listing.title.toLowerCase();
        const description = listing.description?.toLowerCase() || "";
        const street = listing.address.street?.toLowerCase() || "";
        const landmark = listing.address.landmark?.toLowerCase() || "";

        return (
          title.includes(searchTerm) ||
          description.includes(searchTerm) ||
          street.includes(searchTerm) ||
          landmark.includes(searchTerm)
        );
      });

      // Update listings display
      listingsContainer.innerHTML = "";

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
