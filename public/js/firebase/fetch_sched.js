import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// ✅ Initialize Firebase
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

// Reference to the appointments container
const appointmentsContainer = document.getElementById("appointments-container");
const currentListingHeader = document.getElementById("current-listing-header");

// Function to format date in a more readable format
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Function to show loading indicator
function showLoadingIndicator() {
  const loadingTemplate = document.getElementById("loading-indicator-template");
  if (loadingTemplate) {
    appointmentsContainer.innerHTML = "";
    appointmentsContainer.appendChild(loadingTemplate.content.cloneNode(true));
  }
}

// Function to show empty state
function showEmptyState() {
  const emptyTemplate = document.getElementById("empty-state-template");
  if (emptyTemplate) {
    appointmentsContainer.innerHTML = "";
    appointmentsContainer.appendChild(emptyTemplate.content.cloneNode(true));
  }
}

// Function to create and render appointment card
function renderAppointmentCard(appointmentData, listingDetails, renterDetails) {
  const template = document.getElementById("appointment-card-template");
  if (!template) {
    console.error("Appointment card template not found!");
    return;
  }

  const appointmentCard = template.content.cloneNode(true);

  // Fill in the data
  const renterNameElements = appointmentCard.querySelectorAll(".renter-name");
  renterNameElements.forEach(
    (el) =>
      (el.textContent =
        appointmentData.name || renterDetails?.name || "Unknown Renter")
  );

  appointmentCard.querySelector(".renter-phone").textContent =
    appointmentData.phone || renterDetails?.phone || "N/A";

  if (appointmentData.preferredDate) {
    appointmentCard.querySelector(".preferred-date").textContent = formatDate(
      appointmentData.preferredDate
    );
  }

  appointmentCard.querySelector(".preferred-time").textContent =
    appointmentData.preferredTime || "N/A";
  appointmentCard.querySelector(".appointment-id").textContent =
    appointmentData.listingId || "N/A";
  appointmentCard.querySelector(".request-timestamp").textContent =
    appointmentData.timestamp || "N/A";
  appointmentCard.querySelector(".appointment-timestamp").textContent =
    appointmentData.timestamp || "N/A";

  appointmentCard
    .querySelector(".accept-button")
    .addEventListener("click", function () {
      acceptAppointment(appointmentData.listingId, appointmentData.renterId);
    });

  appointmentCard
    .querySelector(".decline-button")
    .addEventListener("click", function () {
      declineAppointment(appointmentData.listingId, appointmentData.renterId);
    });

  appointmentsContainer.appendChild(appointmentCard);
}

// Function to accept an appointment
async function acceptAppointment(listingId, renterId) {
  try {
    const scheduleRef = doc(db, "schedules", listingId);
    await updateDoc(scheduleRef, {
      status: "accepted",
      updatedAt: new Date(),
    });

    showNotification("Appointment accepted successfully!", "success");

    fetchAppointmentsForOwner();
  } catch (error) {
    console.error("Error accepting appointment: ", error);
    showNotification(
      "Failed to accept appointment. Please try again.",
      "error"
    );
  }
}

// Function to decline an appointment
async function declineAppointment(listingId, renterId) {
  try {
    const scheduleRef = doc(db, "schedules", listingId);
    await updateDoc(scheduleRef, {
      status: "declined",
      updatedAt: new Date(),
    });

    showNotification("Appointment declined successfully!", "success");

    fetchAppointmentsForOwner();
  } catch (error) {
    console.error("Error declining appointment: ", error);
    showNotification(
      "Failed to decline appointment. Please try again.",
      "error"
    );
  }
}

// Helper function to show notifications
function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Function to fetch a specific renter's details
async function fetchRenterDetails(renterId) {
  try {
    const renterDoc = await getDoc(doc(db, "renters", renterId));
    if (renterDoc.exists()) {
      return renterDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching renter details: ", error);
    return null;
  }
}

// Function to fetch listing details
async function fetchListingDetails(ownerId, listingId) {
  try {
    const listingDoc = await getDoc(
      doc(db, "owners", ownerId, "listings", listingId)
    );
    if (listingDoc.exists()) {
      return listingDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching listing details: ", error);
    return null;
  }
}

// Main function to fetch all appointments for the current logged-in owner
async function fetchAppointmentsForOwner() {
  showLoadingIndicator();

  try {
    const user = auth.currentUser;

    if (!user) {
      console.error("No user is logged in");
      showEmptyState();
      return;
    }

    const ownerId = user.uid;
    const listingsRef = collection(db, "owners", ownerId, "listings");
    const listingsSnapshot = await getDocs(listingsRef);

    if (listingsSnapshot.empty) {
      console.log("No listings found for this owner");
      showEmptyState();
      currentListingHeader.textContent = "No Listings Found";
      return;
    }

    const listings = [];
    listingsSnapshot.forEach((doc) => {
      listings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    appointmentsContainer.innerHTML = "";

    let appointmentsFound = false;

    for (const listing of listings) {
      const schedulesQuery = query(
        collection(db, "schedules"),
        where("listingId", "==", listing.id),
        where("ownerId", "==", ownerId)
      );

      const schedulesSnapshot = await getDocs(schedulesQuery);

      if (!schedulesSnapshot.empty) {
        appointmentsFound = true;

        currentListingHeader.textContent = `Appointments for: ${
          listing.title || listing.name || "Listing #" + listing.id
        }`;

        for (const scheduleDoc of schedulesSnapshot.docs) {
          const appointmentData = scheduleDoc.data();

          let renterDetails = null;
          if (appointmentData.renterId) {
            renterDetails = await fetchRenterDetails(appointmentData.renterId);
          }

          const listingDetails = listing;
          renderAppointmentCard(appointmentData, listingDetails, renterDetails);
        }
      }
    }

    if (!appointmentsFound) {
      showEmptyState();
      currentListingHeader.textContent = "No Appointments Found";
    }
  } catch (error) {
    console.error("Error fetching appointments: ", error);
    showNotification(
      "Failed to load appointments. Please refresh the page.",
      "error"
    );
    showEmptyState();
  }
}

// Function to handle search functionality
function setupSearchFunctionality() {
  const searchInput = document.getElementById("search-appointments");
  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      const searchTerm = e.target.value.toLowerCase();

      document.querySelectorAll(".appointment-card").forEach((card) => {
        const renterName = card
          .querySelector(".renter-name")
          .textContent.toLowerCase();
        if (renterName.includes(searchTerm)) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });
    });
  }
}

// Function to handle status filter
function setupStatusFilter() {
  const statusFilter = document.getElementById("filter-status");
  if (statusFilter) {
    statusFilter.addEventListener("change", function (e) {
      const filterValue = e.target.value;
      console.log(`Filtering by status: ${filterValue}`);
      fetchAppointmentsForOwner();
    });
  }
}

// Initialize the page when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("Fetch schedules script loaded");

  setupSearchFunctionality();
  setupStatusFilter();

  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User is signed in:", user.uid);
      fetchAppointmentsForOwner();
    } else {
      console.log("No user is signed in");
      showEmptyState();
    }
  });
});
