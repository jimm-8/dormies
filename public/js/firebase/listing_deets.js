import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

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
const auth = getAuth(app);

/**
 * Main function to initialize the page
 */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Get query parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const ownerId = urlParams.get("ownerId");
    const listingId = urlParams.get("listingId");

    if (!ownerId || !listingId) {
      showError(
        "Missing listing information. Please return to the listings page."
      );
      return;
    }

    // Fetch listing details
    const listing = await fetchListingDetails(ownerId, listingId);

    if (!listing) {
      showError(
        "Listing not found. It may have been removed or is no longer available."
      );
      return;
    }

    // Fetch owner details
    const ownerDetails = await fetchOwnerDetails(ownerId);

    // Update the page with listing details
    updateListingDetails(listing);

    // Update owner information
    if (ownerDetails) {
      updateOwnerInfo(ownerDetails);
    }

    // Set up the back button
    setupBackButton();

    // Set up tab switching
    setupTabs();

    // Set up the forms' submit events
    setupFormSubmitHandlers(ownerId, listingId);

    // Setup review button if we're on the renter page
    setupReviewButton();
  } catch (error) {
    console.error("Error loading listing details:", error);
    showError("Failed to load listing details. Please try again later.");
  }
});

/**
 * Fetches listing details from Firestore
 */
async function fetchListingDetails(ownerId, listingId) {
  try {
    const listingRef = doc(db, "owners", ownerId, "listings", listingId);
    const listingSnapshot = await getDoc(listingRef);

    if (listingSnapshot.exists()) {
      return {
        id: listingSnapshot.id,
        ownerId,
        ...listingSnapshot.data(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching listing details:", error);
    return null;
  }
}

/**
 * Fetches owner details from Firestore
 */
async function fetchOwnerDetails(ownerId) {
  try {
    const ownerRef = doc(db, "owners", ownerId);
    const ownerSnapshot = await getDoc(ownerRef);

    if (ownerSnapshot.exists()) {
      return {
        id: ownerSnapshot.id,
        ...ownerSnapshot.data(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching owner details:", error);
    return null;
  }
}

/**
 * Updates the listing details in the UI
 */
function updateListingDetails(listing) {
  // Set page title
  document.title = listing.title || "Property Details";

  // Update property header
  const titleElement = document.querySelector(".title-badge-container h1");
  if (titleElement) titleElement.textContent = listing.title;

  // Update address
  const addressElement = document.querySelector(".address");
  if (addressElement) {
    const formattedAddress = formatAddress(listing.address);
    addressElement.innerHTML = `<i class="fa fa-map-marker-alt"></i> ${formattedAddress}`;
  }

  // Update price tag
  const priceElement = document.querySelector(".price-tag");
  if (priceElement) {
    // Consolidated pricing field references
    const rentAmount =
      listing.pricing?.rentAmount || listing.contractTerms?.rentAmount || 0;
    const rentPeriod =
      listing.pricing?.rentPeriod ||
      listing.contractTerms?.rentPeriod ||
      "monthly";
    const formattedPrice = formatPrice(rentAmount, rentPeriod);
    priceElement.textContent = formattedPrice;
  }

  // Update features
  updateFeatures(listing.features);

  // Update inclusions
  updateInclusions(extractInclusions(listing));

  // Update payment terms
  updatePaymentTerms(listing);
}

/**
 * Extract inclusions from different possible data structures
 */
function extractInclusions(listing) {
  const inclusions = [];
  if (listing.inclusions) {
    // Direct inclusions array if available
    if (Array.isArray(listing.inclusions)) {
      inclusions.push(...listing.inclusions);
    } else {
      // Check for specific inclusion fields
      if (listing.inclusions.waterBill === "Yes") inclusions.push("Water Bill");
      if (listing.inclusions.electricBill === "Yes")
        inclusions.push("Electricity Bill");
      if (listing.inclusions.wifiBill === "Yes")
        inclusions.push("Internet Bill");
    }
  }
  return inclusions;
}

/**
 * Format address for display
 */
function formatAddress(address) {
  if (!address) return "Address not specified";

  const parts = [
    address.street || "",
    address.blkNo ? `Blk ${address.blkNo}` : "",
    address.landmark ? `${address.landmark}` : "",
  ].filter(Boolean);

  return parts.join(", ");
}

/**
 * Format price for display
 */
function formatPrice(amount, period) {
  if (!amount) return "Price not specified";

  // Format currency
  const formattedAmount = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(amount);

  // Remove PHP currency symbol and replace with Php
  const amountWithoutCurrencySymbol = formattedAmount
    .replace(/PHP|₱/, "")
    .trim();
  return `Php ${amountWithoutCurrencySymbol} ${period.toLowerCase()}`;
}

/**
 * Update features in the UI
 */
function updateFeatures(features) {
  if (!features) return;

  const featureItems = [
    {
      selector: ".feature-item:nth-child(1) .feature-value",
      property: "bedrooms",
    },
    {
      selector: ".feature-item:nth-child(2) .feature-value",
      property: "bathrooms",
    },
    {
      selector: ".feature-item:nth-child(3) .feature-value",
      property: "propertyType",
    },
    {
      selector: ".feature-item:nth-child(4) .feature-value",
      property: "unitCondition",
    },
    {
      selector: ".feature-item:nth-child(5) .feature-value",
      property: "gender",
    },
  ];

  featureItems.forEach((item) => {
    const element = document.querySelector(item.selector);
    if (element) {
      element.textContent = features[item.property] || "Not specified";
    }
  });
}

/**
 * Update inclusions in the UI
 */
function updateInclusions(inclusions) {
  const inclusionsList = document.querySelector(
    ".detail-section:nth-child(1) .detail-list"
  );
  if (!inclusionsList) return;

  // Clear existing inclusions
  inclusionsList.innerHTML = "";

  // Add each inclusion
  if (inclusions.length === 0) {
    const li = document.createElement("li");
    li.className = "detail-item";
    li.innerHTML = `<i class="fa fa-times-circle"></i> No inclusions specified`;
    inclusionsList.appendChild(li);
    return;
  }

  inclusions.forEach((inclusion) => {
    const li = document.createElement("li");
    li.className = "detail-item";
    li.innerHTML = `<i class="fa fa-check-circle"></i> ${inclusion}`;
    inclusionsList.appendChild(li);
  });
}

/**
 * Update payment terms in the UI
 */
function updatePaymentTerms(listing) {
  const paymentTermsList = document.querySelector(
    ".detail-section:nth-child(2) .detail-list"
  );
  if (!paymentTermsList) return;

  // Clear existing payment terms
  paymentTermsList.innerHTML = "";

  const paymentTerms = [];

  // Check for contractTerms or fall back to other structures
  const terms = listing.contractTerms || {};

  // Add advance payment
  if (terms.advanceAmount) {
    paymentTerms.push({
      icon: "fa fa-credit-card",
      text: `${terms.advanceAmount} Month${
        terms.advanceAmount > 1 ? "s" : ""
      } Advance`,
    });
  }

  // Add deposit
  if (terms.depositAmount) {
    paymentTerms.push({
      icon: "fa fa-shield-alt",
      text: `${terms.depositAmount} Month${
        terms.depositAmount > 1 ? "s" : ""
      } Deposit`,
    });
  }

  // Add rent period
  if (terms.rentPeriod) {
    paymentTerms.push({
      icon: "fa fa-calendar-alt",
      text: `${capitalizeFirstLetter(terms.rentPeriod)}ly Payment`,
    });
  }

  // Add contract term
  if (terms.contractTerm) {
    paymentTerms.push({
      icon: "fa fa-file-contract",
      text: capitalizeFirstLetter(terms.contractTerm),
    });
  }

  // Add payment method
  if (terms.rentMethod) {
    paymentTerms.push({
      icon: "fa fa-money-bill-wave",
      text: `Accept ${terms.rentMethod}`,
    });
  }

  // If no payment terms, add a default message
  if (paymentTerms.length === 0) {
    paymentTerms.push({
      icon: "fa fa-info-circle",
      text: "Payment terms not specified",
    });
  }

  // Add payment terms to the list
  paymentTerms.forEach((term) => {
    const li = document.createElement("li");
    li.className = "detail-item";
    li.innerHTML = `<i class="${term.icon}"></i> ${term.text}`;
    paymentTermsList.appendChild(li);
  });
}

/**
 * Update owner information in the UI
 */
async function updateOwnerInfo(owner) {
  const ownerSection = document.querySelector(".owner-section");
  if (!ownerSection) return;

  const fullName = owner.name || "Owner";
  const nameParts = fullName.trim().split(" ");
  const firstName = nameParts[0];
  let lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  if (lastName) lastName = lastName.charAt(0) + ".";

  const ownerName = lastName ? `${firstName} ${lastName}` : firstName;
  const ownerInitials = (
    firstName.charAt(0) + (lastName.charAt(0) || "")
  ).toUpperCase();

  const memberSince = owner.createdAt ? formatDate(owner.createdAt) : "Unknown";

  // Fetch actual listing count from Firestore
  let listingsCount = 0;
  try {
    const listingsSnapshot = await getDocs(
      collection(db, "owners", owner.id, "listings")
    );
    listingsCount = listingsSnapshot.size;
  } catch (error) {
    console.error("Failed to fetch listing count:", error);
  }

  // Render to DOM
  ownerSection.innerHTML = `
    <h3 class="owner-header">Property Owner</h3>
    <div class="owner-card">
      <div class="owner-avatar">${ownerInitials}</div>
      <div class="owner-details">
        <h4>${ownerName}</h4>
        <p class="owner-since">Member since ${memberSince}</p>
        <div class="owner-stats">
          <div class="stat">
            <i class="fa fa-home"></i>
            <span>${listingsCount} Listing${
    listingsCount !== 1 ? "s" : ""
  }</span>
          </div>
          <div class="stat">
            <i class="fa fa-star"></i>
            <span>${owner.rating || "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="owner-verification">
      <div class="verification-badge">
        <i class="fa fa-check-circle"></i>
        <span>Verified Owner</span>
      </div>
      <div class="response-time">
        <i class="fa fa-clock"></i>
        <span>Typically responds within 24 hours</span>
      </div>
    </div>
  `;
}

/**
 * Set up the back button functionality
 */
function setupBackButton() {
  const backBtn = document.querySelector(".back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "/pages/renter/home.html";
    });
  }
}

/**
 * Set up tab switching functionality
 */
function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const forms = document.querySelectorAll(".message-form");

  if (tabButtons.length === 0 || forms.length === 0) return;

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.getAttribute("data-tab");

      // Toggle active class for buttons
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Toggle active class for forms
      forms.forEach((form) => {
        if (form.classList.contains(`${tabName}-form`)) {
          form.classList.add("active");
        } else {
          form.classList.remove("active");
        }
      });
    });
  });
}

/**
 * Set up form submit handlers
 */
function setupFormSubmitHandlers(ownerId, listingId) {
  // Set up inquire form submit handler
  setupInquireForm(ownerId, listingId);

  // Set up schedule form submit handler
  setupScheduleForm(ownerId, listingId);
}

/**
 * Set up inquire form submit handler
 */
function setupInquireForm(ownerId, listingId) {
  const inquireForm = document.querySelector(".inquire-form");
  if (!inquireForm) return;

  inquireForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const messageText = inquireForm.querySelector("textarea").value.trim();
    if (!messageText) {
      showNotice("Please enter a message.");
      return;
    }

    onAuthStateChanged(auth, async (renter) => {
      if (!renter) {
        showNotice("Please log in to send a message to the owner.");
        window.location.href = `/pages/login.html?redirect=${encodeURIComponent(
          window.location.href
        )}`;
        return;
      }

      try {
        await addDoc(collection(db, "inquiries"), {
          renterId: renter.uid,
          ownerId,
          listingId,
          message: messageText,
          timestamp: serverTimestamp(),
        });
        showNotice("Message sent!");
        inquireForm.reset();
      } catch (error) {
        console.error("Error sending inquiry:", error);
        showNotice("Failed to send message.");
      }
    });
  });
}

/**
 * Set up schedule form submit handler
 */
function setupScheduleForm(ownerId, listingId) {
  const scheduleForm = document.querySelector(".schedule-form");
  if (!scheduleForm) return;

  scheduleForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dateInput = scheduleForm.querySelector('input[type="date"]').value;
    const timeInput = scheduleForm.querySelector('input[type="time"]').value;
    const nameInput = scheduleForm
      .querySelector('input[type="text"]')
      .value.trim();
    const phoneInput = scheduleForm
      .querySelector('input[type="tel"]')
      .value.trim();

    if (!dateInput || !timeInput || !nameInput || !phoneInput) {
      showNotice("Please fill in all required fields.");
      return;
    }

    onAuthStateChanged(auth, async (renter) => {
      if (!renter) {
        showNotice("Please log in to schedule a viewing.");
        window.location.href = `/pages/login.html?redirect=${encodeURIComponent(
          window.location.href
        )}`;
        return;
      }

      try {
        await addDoc(collection(db, "schedules"), {
          renterId: renter.uid,
          ownerId,
          listingId,
          preferredDate: dateInput,
          preferredTime: timeInput,
          name: nameInput,
          phone: phoneInput,
          status: "Pending",
          timestamp: serverTimestamp(),
        });
        showNotice("Schedule request sent!");
        scheduleForm.reset();
      } catch (error) {
        console.error("Error sending schedule:", error);
        showNotice("Failed to schedule.");
      }
    });
  });
}

/**
 * Set up review button for the renter listing page
 */
function setupReviewButton() {
  const writeReviewButton = document.getElementById("writeReviewButton");
  const reviewModal = document.getElementById("reviewModal");

  if (!writeReviewButton || !reviewModal) return;

  const closeReview = document.getElementById("closeReview");
  const currentPath = window.location.pathname;

  if (currentPath === "/pages/renter/listing.html") {
    onAuthStateChanged(auth, (renter) => {
      if (!renter) {
        writeReviewButton.disabled = true;
        writeReviewButton.title = "You must be logged in to leave a review";
        writeReviewButton.addEventListener("click", () => {
          showNotice("Please log in to write a review.");
        });
      } else {
        writeReviewButton.disabled = false;
        writeReviewButton.title = "";
        writeReviewButton.addEventListener("click", () => {
          reviewModal.classList.add("show");
        });
      }
    });
  } else {
    writeReviewButton.style.display = "none";
  }

  if (closeReview) {
    closeReview.addEventListener("click", () => {
      reviewModal.classList.remove("show");
    });
  }

  window.addEventListener("click", (event) => {
    if (event.target === reviewModal) {
      reviewModal.classList.remove("show");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && reviewModal.classList.contains("show")) {
      reviewModal.classList.remove("show");
    }
  });
}

/**
 * Display error message on the page
 */
function showError(message) {
  const container = document.querySelector("main.container");
  if (container) {
    container.innerHTML = `
      <div class="error-message" style="text-align: center; padding: 2rem; margin: 2rem 0;">
        <i class="fa fa-exclamation-triangle" style="font-size: 3rem; color: #f44336;"></i>
        <h2 style="margin: 1rem 0;">Oops!</h2>
        <p>${message}</p>
        <a href="/pages/renter/home.html" style="display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
          Go back to listings
        </a>
      </div>
    `;
  }
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirstLetter(string) {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

/**
 * Format date for display
 */
function formatDate(timestamp) {
  if (!timestamp) return "Unknown";

  // If timestamp is a Firebase timestamp
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    timestamp = timestamp.toDate();
  } else if (typeof timestamp === "string") {
    // If timestamp is a string, convert to Date
    timestamp = new Date(timestamp);
  } else if (typeof timestamp === "object" && timestamp.seconds) {
    // If timestamp is a Firebase timestamp object
    timestamp = new Date(timestamp.seconds * 1000);
  }

  // Return formatted date
  const options = { year: "numeric", month: "long" };
  return new Intl.DateTimeFormat("en-US", options).format(timestamp);
}

/**
 * Show notification to the user
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
