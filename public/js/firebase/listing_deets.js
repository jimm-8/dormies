import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
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
  } catch (error) {
    console.error("Error loading listing details:", error);
    showError("Failed to load listing details. Please try again later.");
  }
});

async function fetchListingDetails(ownerId, listingId) {
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
}

async function fetchOwnerDetails(ownerId) {
  const ownerRef = doc(db, "owners", ownerId);
  const ownerSnapshot = await getDoc(ownerRef);

  if (ownerSnapshot.exists()) {
    return {
      id: ownerSnapshot.id,
      ...ownerSnapshot.data(),
    };
  }

  return null;
}

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
    const formattedPrice = formatPrice(
      listing.pricing?.rentAmount || listing.contractTerms?.rentAmount || 0,
      listing.pricing?.rentPeriod ||
        listing.contractTerms?.rentPeriod ||
        "monthly"
    );
    priceElement.textContent = formattedPrice;
  }

  // Update features
  updateFeatures(listing.features);

  // Update inclusions
  const inclusions = [];
  if (listing.inclusions) {
    // Direct inclusions array if available
    if (Array.isArray(listing.inclusions)) {
      inclusions.push(...listing.inclusions);
    } else {
      // Check for specific inclusion fields
      if (listing.inclusions.waterBill === "included")
        inclusions.push("Water Bill");
      if (listing.inclusions.electricBill === "included")
        inclusions.push("Electricity Bill");
      if (listing.inclusions.wifiBill === "included")
        inclusions.push("Internet Bill");
    }
  }
  updateInclusions(inclusions);

  // Update payment terms
  updatePaymentTerms(listing);
}

function formatAddress(address) {
  if (!address) return "Address not specified";

  const parts = [
    address.street || "",
    address.blkNo ? `Blk ${address.blkNo}` : "",
    address.landmark ? `Near ${address.landmark}` : "",
  ].filter(Boolean);

  return parts.join(", ");
}

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

function updateFeatures(features) {
  if (!features) return;

  // Update bedrooms
  const bedroomValue = document.querySelector(
    ".feature-item:nth-child(1) .feature-value"
  );
  if (bedroomValue)
    bedroomValue.textContent = features.bedrooms || "Not specified";

  // Update bathrooms
  const bathroomValue = document.querySelector(
    ".feature-item:nth-child(2) .feature-value"
  );
  if (bathroomValue)
    bathroomValue.textContent = features.bathrooms || "Not specified";

  // Update property type
  const propertyTypeValue = document.querySelector(
    ".feature-item:nth-child(3) .feature-value"
  );
  if (propertyTypeValue)
    propertyTypeValue.textContent = features.propertyType || "Not specified";

  // Update unit condition
  const unitConditionValue = document.querySelector(
    ".feature-item:nth-child(4) .feature-value"
  );
  if (unitConditionValue)
    unitConditionValue.textContent = features.unitCondition || "Not specified";

  // Update gender
  const genderValue = document.querySelector(
    ".feature-item:nth-child(5) .feature-value"
  );
  if (genderValue) genderValue.textContent = features.gender || "Not specified";
}

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
      text: `${capitalizeFirstLetter(terms.rentPeriod)} Payment`,
    });
  }

  // Add contract term
  if (terms.contractTerm) {
    paymentTerms.push({
      icon: "fa fa-file-contract",
      text: terms.contractTerm,
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

function updateOwnerInfo(owner) {
  const ownerSection = document.querySelector(".owner-section");
  if (!ownerSection) return;

  // Get user's first name and last initial
  const firstName = owner.firstName || owner.name?.split(" ")[0] || "Owner";
  let lastName = owner.lastName || "";
  if (lastName) lastName = lastName.charAt(0) + ".";

  const ownerName = lastName ? `${firstName} ${lastName}` : firstName;
  const ownerInitials = (
    firstName.charAt(0) + (lastName.charAt(0) || "")
  ).toUpperCase();
  const memberSince = owner.createdAt ? formatDate(owner.createdAt) : "Unknown";

  // Create owner info HTML
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
            <span>${owner.listingsCount || 1} Listing${
    owner.listingsCount !== 1 ? "s" : ""
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

function setupBackButton() {
  const backBtn = document.querySelector(".back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "/pages/renter/browse.html";
    });
  }
}

function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const forms = document.querySelectorAll(".message-form");

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

function setupFormSubmitHandlers(ownerId, listingId) {
  // Check if user is logged in
  onAuthStateChanged(auth, (user) => {
    const isLoggedIn = !!user;

    // Set up inquire form submit handler
    const inquireForm = document.querySelector(".inquire-form");
    if (inquireForm) {
      inquireForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!isLoggedIn) {
          alert("Please log in to send a message to the owner.");
          window.location.href = `/pages/login.html?redirect=${encodeURIComponent(
            window.location.href
          )}`;
          return;
        }

        const messageText = inquireForm.querySelector("textarea").value.trim();

        if (!messageText) {
          alert("Please enter a message.");
          return;
        }

        try {
          // Here you would send the inquiry to Firebase
          // Could implement this later
          alert("Your message has been sent to the owner!");
          inquireForm.reset();
        } catch (error) {
          console.error("Error sending inquiry:", error);
          alert("Failed to send your message. Please try again later.");
        }
      });
    }

    // Set up schedule form submit handler
    const scheduleForm = document.querySelector(".schedule-form");
    if (scheduleForm) {
      scheduleForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!isLoggedIn) {
          alert("Please log in to schedule a viewing.");
          window.location.href = `/pages/login.html?redirect=${encodeURIComponent(
            window.location.href
          )}`;
          return;
        }

        const dateInput =
          scheduleForm.querySelector('input[type="date"]').value;
        const timeInput =
          scheduleForm.querySelector('input[type="time"]').value;
        const nameInput = scheduleForm
          .querySelector('input[type="text"]')
          .value.trim();
        const phoneInput = scheduleForm
          .querySelector('input[type="tel"]')
          .value.trim();

        if (!dateInput || !timeInput || !nameInput || !phoneInput) {
          alert("Please fill in all required fields.");
          return;
        }

        try {
          // Here you would send the schedule request to Firebase
          // Could implement this later
          alert("Your viewing request has been sent!");
          scheduleForm.reset();
        } catch (error) {
          console.error("Error scheduling viewing:", error);
          alert("Failed to schedule viewing. Please try again later.");
        }
      });
    }
  });
}

function showError(message) {
  const container = document.querySelector("main.container");
  if (container) {
    container.innerHTML = `
      <div class="error-message" style="text-align: center; padding: 2rem; margin: 2rem 0;">
        <i class="fa fa-exclamation-triangle" style="font-size: 3rem; color: #f44336;"></i>
        <h2 style="margin: 1rem 0;">Oops!</h2>
        <p>${message}</p>
        <a href="/pages/renter/browse.html" style="display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
          Go back to listings
        </a>
      </div>
    `;
  }
}

// Helper functions
function capitalizeFirstLetter(string) {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

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
