import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
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

    // Update the page with listing details
    updateListingDetails(listing);

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

function updateListingDetails(listing) {
  // Set page title
  document.title = listing.title;

  // Update property header
  const titleElement = document.querySelector(".title-badge-container h1");
  if (titleElement) titleElement.textContent = listing.title;

  // Update address
  const addressElement = document.querySelector(".address");
  if (addressElement) {
    const formattedAddress = formatAddress(listing.address);
    addressElement.textContent = formattedAddress;
  }

  // Update price tag
  const priceElement = document.querySelector(".price-tag");
  if (priceElement) {
    const formattedPrice = formatPrice(
      listing.pricing.rentAmount,
      listing.pricing.rentPeriod
    );
    priceElement.textContent = formattedPrice;
  }

  // Update inclusions
  updateInclusions(listing.inclusions || []);

  // Update payment terms
  updatePaymentTerms(listing);
}

function formatAddress(address) {
  const parts = [
    address.street || "",
    address.blkNo ? `Blk ${address.blkNo}` : "",
    address.landmark || "",
  ].filter(Boolean);

  return parts.join(", ");
}

function formatPrice(amount, period) {
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

function updateInclusions(inclusions) {
  const inclusionsSection = document.querySelector("section.inclusions");
  if (!inclusionsSection) return;

  // Keep the heading
  const heading = inclusionsSection.querySelector("h2");
  inclusionsSection.innerHTML = "";
  inclusionsSection.appendChild(heading);

  // Map of inclusion types to icons
  const inclusionIcons = {
    female: "ri-women-line",
    male: "ri-men-line",
    mixed: "ri-user-5-line",
    bed: "ri-hotel-bed-line",
    refrigerator: "ri-fridge-line",
    kitchen: "ri-home-smile-line",
    bathroom: "ri-user-shared-line",
    wifi: "ri-wifi-line",
    aircon: "ri-temp-cold-line",
    fan: "ri-windy-line",
    furniture: "ri-sofa-line",
    // Add more mappings as needed
  };

  // Add each inclusion with appropriate icon
  if (inclusions.length === 0) {
    // If no inclusions are specified
    addInclusionItem(
      inclusionsSection,
      "ri-close-circle-line",
      "No inclusions specified"
    );
    return;
  }

  // Add gender restriction if specified
  if (listing.restrictions && listing.restrictions.gender) {
    const gender = listing.restrictions.gender.toLowerCase();
    const genderIcon = inclusionIcons[gender] || "ri-user-line";
    const genderText =
      gender === "female"
        ? "Female only"
        : gender === "male"
        ? "Male only"
        : "Mixed gender";
    addInclusionItem(inclusionsSection, genderIcon, genderText);
  }

  // Process inclusions
  inclusions.forEach((inclusion) => {
    const iconClass = getIconForInclusion(inclusion, inclusionIcons);
    addInclusionItem(inclusionsSection, iconClass, inclusion);
  });
}

function getIconForInclusion(inclusion, iconMap) {
  // Lowercase and trim the inclusion for matching
  const normalizedInclusion = inclusion.toLowerCase().trim();

  // Check for various keywords in the inclusion text
  for (const [key, icon] of Object.entries(iconMap)) {
    if (normalizedInclusion.includes(key)) {
      return icon;
    }
  }

  // Default icon if no match
  return "ri-checkbox-circle-line";
}

function addInclusionItem(container, iconClass, text) {
  const item = document.createElement("div");
  item.className = "inclusion_payment-item";
  item.innerHTML = `
    <i class="${iconClass}"></i>
    <p>${text}</p>
  `;
  container.appendChild(item);
}

function updatePaymentTerms(listing) {
  const paymentSection = document.querySelector("section.payment-terms");
  if (!paymentSection) return;

  // Keep the heading
  const heading = paymentSection.querySelector("h2");
  paymentSection.innerHTML = "";
  paymentSection.appendChild(heading);

  // Add advance payment if specified
  if (listing.pricing.advancePayment) {
    const advanceMonths = listing.pricing.advancePayment.months || 2;
    const advanceAmount = listing.pricing.rentAmount * advanceMonths;
    const formattedAdvance = new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(advanceAmount);

    addPaymentTermItem(
      paymentSection,
      "ri-currency-line",
      `Advance Payments: ${formattedAdvance
        .replace(/PHP|₱/, "Php")
        .trim()} (${advanceMonths} months)`
    );
  } else {
    addPaymentTermItem(
      paymentSection,
      "ri-currency-line",
      "Advance Payments: Not specified"
    );
  }

  // Add minimum stay if specified
  if (listing.pricing.minimumStay) {
    addPaymentTermItem(
      paymentSection,
      "ri-home-heart-line",
      `Minimum Stay: ${listing.pricing.minimumStay} months`
    );
  }

  // Add utilities information
  const electricityIncluded =
    listing.utilities && listing.utilities.electricity === "included";
  addPaymentTermItem(
    paymentSection,
    "ri-lightbulb-flash-line",
    `Electricity Bills: ${electricityIncluded ? "Included" : "Not Included"}`
  );

  const waterIncluded =
    listing.utilities && listing.utilities.water === "included";
  addPaymentTermItem(
    paymentSection,
    "ri-water-flash-line",
    `Water Bills: ${waterIncluded ? "Included" : "Not Included"}`
  );
}

function addPaymentTermItem(container, iconClass, text) {
  const item = document.createElement("div");
  item.className = "inclusion_payment-item";
  item.innerHTML = `
    <i class="${iconClass}"></i>
    <p>${text}</p>
  `;
  container.appendChild(item);
}

function setupFormSubmitHandlers(ownerId, listingId) {
  // Set up inquire form submit handler
  const inquireForm = document.querySelector(".inquire-form");
  if (inquireForm) {
    inquireForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const messageText = inquireForm.querySelector("textarea").value.trim();

      if (!messageText) {
        alert("Please enter a message.");
        return;
      }

      try {
        // Here you would send the inquiry to Firebase
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
      const dateInput = scheduleForm.querySelector('input[type="date"]').value;
      const timeInput = scheduleForm.querySelector('input[type="time"]').value;

      if (!dateInput || !timeInput) {
        alert("Please select both date and time.");
        return;
      }

      try {
        // Here you would send the schedule request to Firebase
        alert("Your viewing request has been sent!");
        scheduleForm.reset();
      } catch (error) {
        console.error("Error scheduling viewing:", error);
        alert("Failed to schedule viewing. Please try again later.");
      }
    });
  }

  // Set up tab switching
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

function showError(message) {
  const container = document.querySelector("main.container");
  if (container) {
    container.innerHTML = `
      <div class="error-message" style="text-align: center; padding: 2rem; margin: 2rem 0;">
        <i class="ri-error-warning-fill" style="font-size: 3rem; color: #f44336;"></i>
        <h2 style="margin: 1rem 0;">Oops!</h2>
        <p>${message}</p>
        <a href="/pages/renter/browse.html" style="display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
          Go back to listings
        </a>
      </div>
    `;
  }
}
