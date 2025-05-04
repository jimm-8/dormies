import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore,
  addDoc,
  doc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// Firebase configuration
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
 * Initialize the appointment booking form functionality
 * This should be called once the DOM is fully loaded
 */
export async function initAppointmentForm() {
  // Initialize required collections if they don't exist
  await initializeRequiredCollections();

  const urlParams = new URLSearchParams(window.location.search);
  const ownerId = urlParams.get("ownerId");
  const listingId = urlParams.get("listingId");

  if (!ownerId || !listingId) {
    console.error("Missing ownerId or listingId in URL parameters");
    return;
  }

  const scheduleForm = document.querySelector(".schedule-form");
  if (!scheduleForm) {
    console.error("Schedule form not found in the document");
    return;
  }

  setupScheduleFormSubmit(scheduleForm, ownerId, listingId);
  setupDateTimeValidation(scheduleForm);
}

/**
 * Check if required Firestore collections exist, and initialize them if needed
 */
async function initializeRequiredCollections() {
  try {
    // Check if messages collection exists (for notifications)
    const messagesQuery = collection(db, "messages");
    const messagesSnapshot = await getDocs(messagesQuery);

    // If the collection doesn't exist or is empty, initialize it
    if (messagesSnapshot.empty) {
      console.log("Initializing messages collection...");

      // Create a placeholder document in the messages collection
      const messagesCollectionRef = collection(db, "messages");
      await addDoc(messagesCollectionRef, {
        type: "system",
        message: "Messages collection initialized",
        createdAt: serverTimestamp(),
      });

      console.log("Messages collection initialized successfully");
    }

    // Check if appointments collection exists
    const appointmentsQuery = collection(db, "appointments");
    const appointmentsSnapshot = await getDocs(appointmentsQuery);

    // If the collection doesn't exist or is empty, initialize it
    if (appointmentsSnapshot.empty) {
      console.log("Initializing appointments collection...");

      // Create a placeholder document in the appointments collection
      const appointmentsCollectionRef = collection(db, "appointments");
      await addDoc(appointmentsCollectionRef, {
        type: "system",
        status: "system_init",
        message: "Appointments collection initialized",
        createdAt: serverTimestamp(),
      });

      console.log("Appointments collection initialized successfully");
    }
  } catch (error) {
    console.warn("Error checking/initializing collections:", error);
    // Continue anyway, as the collections might be created when the first appointment is made
  }
}

/**
 * Set up validation for date and time inputs
 * @param {HTMLFormElement} form - The schedule appointment form
 */
function setupDateTimeValidation(form) {
  const dateInput = form.querySelector('input[type="date"]');
  if (dateInput) {
    // Set minimum date to today
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    dateInput.min = formattedDate;

    // Set maximum date to 3 months from now
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);
    dateInput.max = formatDateForInput(threeMonthsLater);
  }

  const timeInput = form.querySelector('input[type="time"]');
  if (timeInput) {
    // Restrict time selection to business hours (8 AM to 6 PM)
    timeInput.min = "08:00";
    timeInput.max = "18:00";
  }
}

/**
 * Format a date for use in date input elements
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string in YYYY-MM-DD format
 */
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Set up the submit event handler for the appointment scheduling form
 * @param {HTMLFormElement} form - The appointment form element
 * @param {string} ownerId - The ID of the listing's owner
 * @param {string} listingId - The ID of the listing
 */
function setupScheduleFormSubmit(form, ownerId, listingId) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
      showNotice("Please log in to schedule a viewing.");
      redirectToLogin();
      return;
    }

    // Get form inputs
    const dateInput = form.querySelector('input[type="date"]');
    const timeInput = form.querySelector('input[type="time"]');
    const nameInput = form.querySelector('input[type="text"]');
    const phoneInput = form.querySelector('input[type="tel"]');

    // Validate inputs
    if (
      !dateInput?.value ||
      !timeInput?.value ||
      !nameInput?.value ||
      !phoneInput?.value
    ) {
      showNotice("Please fill in all required fields.", "error");
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phoneInput.value.replace(/\s/g, ""))) {
      showNotice("Please enter a valid phone number.", "error");
      return;
    }

    try {
      // Show loading state
      const submitButton = form.querySelector("button[type='submit']");
      if (submitButton) {
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = "Scheduling...";
      }

      // Save the appointment to Firestore
      await saveAppointment(
        user.uid,
        ownerId,
        listingId,
        dateInput.value,
        timeInput.value,
        nameInput.value,
        phoneInput.value
      );

      // Reset form and show success message
      form.reset();
      showNotice(
        "Your viewing request has been scheduled successfully!",
        "success"
      );

      // Restore button state
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      showNotice(
        "Failed to schedule viewing. Please try again later.",
        "error"
      );

      // Restore button state on error
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });
}

/**
 * Save an appointment request to Firestore
 * @param {string} renterId - The ID of the user requesting the appointment
 * @param {string} ownerId - The ID of the listing's owner
 * @param {string} listingId - The ID of the listing
 * @param {string} date - The appointment date (YYYY-MM-DD)
 * @param {string} time - The appointment time (HH:MM)
 * @param {string} contactName - The contact name for the appointment
 * @param {string} contactPhone - The contact phone number
 * @returns {Promise} A promise that resolves when the appointment is saved
 */
async function saveAppointment(
  renterId,
  ownerId,
  listingId,
  date,
  time,
  contactName,
  contactPhone
) {
  try {
    // Fetch listing details to include in the appointment
    const listingDetails = await fetchListingDetails(ownerId, listingId);

    // Create a JavaScript Date object from the date and time strings
    const appointmentDateTime = new Date(`${date}T${time}`);

    // Create the appointment object
    const appointmentData = {
      renterId: renterId,
      ownerId: ownerId,
      listingId: listingId,
      listingTitle: listingDetails?.title || "Property Listing",
      appointmentDate: date,
      appointmentTime: time,
      appointmentDateTime: appointmentDateTime,
      contactName: contactName,
      contactPhone: contactPhone,
      status: "pending", // pending, approved, rejected, completed, cancelled
      createdAt: serverTimestamp(),
      notes: "",
    };

    // Add the appointment to the appointments collection
    const appointmentRef = await addDoc(
      collection(db, "appointments"),
      appointmentData
    );

    // Also send a notification message to the owner
    await sendAppointmentNotification(
      renterId,
      ownerId,
      listingId,
      appointmentRef.id,
      date,
      time
    );

    return appointmentRef.id;
  } catch (error) {
    console.error("Error saving appointment:", error);
    throw error;
  }
}

/**
 * Send a notification message about the appointment to the owner
 * @param {string} renterId - The ID of the user requesting the appointment
 * @param {string} ownerId - The ID of the listing's owner
 * @param {string} listingId - The ID of the listing
 * @param {string} appointmentId - The ID of the created appointment
 * @param {string} date - The appointment date
 * @param {string} time - The appointment time
 */
async function sendAppointmentNotification(
  renterId,
  ownerId,
  listingId,
  appointmentId,
  date,
  time
) {
  try {
    // Get user profile data
    const userProfile = await fetchUserProfile(renterId);

    // Format date for display
    const formattedDate = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Format time for display
    const formattedTime = formatTimeForDisplay(time);

    // Create notification message
    const messageData = {
      senderId: renterId,
      senderName: userProfile?.name || "Anonymous User",
      receiverId: ownerId,
      listingId: listingId,
      appointmentId: appointmentId,
      message: `Viewing request for ${formattedDate} at ${formattedTime}. Please check your appointments for details.`,
      read: false,
      createdAt: serverTimestamp(),
      type: "appointment",
    };

    // Add the message to the messages collection
    await addDoc(collection(db, "messages"), messageData);
  } catch (error) {
    console.error("Error sending appointment notification:", error);
    // Don't throw here - this is a non-critical function
  }
}

/**
 * Format time string for display
 * @param {string} timeString - Time in 24-hour format (HH:MM)
 * @returns {string} Time in 12-hour format with AM/PM
 */
function formatTimeForDisplay(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Fetch listing details from Firestore
 * @param {string} ownerId - The ID of the listing's owner
 * @param {string} listingId - The ID of the listing
 * @returns {Promise<Object|null>} The listing details or null if not found
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
 * Fetch a user's profile from Firestore
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object|null>} The user's profile data or null if not found
 */
async function fetchUserProfile(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

/**
 * Redirect to the login page, preserving the current URL as a redirect target
 */
function redirectToLogin() {
  window.location.href = `/pages/login.html?redirect=${encodeURIComponent(
    window.location.href
  )}`;
}

/**
 * Display a notice message to the user
 * @param {string} message - The message to display
 * @param {string} type - The message type ('success', 'error', or 'info')
 * @param {number} duration - How long to show the message in milliseconds
 */
function showNotice(message, type = "info", duration = 3000) {
  // Try to find an existing notice box
  let noticeBox = document.getElementById("noticeBox");
  let noticeText = document.getElementById("noticeText");

  // If notice elements don't exist, create them
  if (!noticeBox) {
    noticeBox = document.createElement("div");
    noticeBox.id = "noticeBox";
    noticeBox.className = "notice-box hide";

    noticeText = document.createElement("span");
    noticeText.id = "noticeText";

    noticeBox.appendChild(noticeText);
    document.body.appendChild(noticeBox);

    // Add necessary CSS if not already present
    if (!document.getElementById("noticeBoxStyles")) {
      const style = document.createElement("style");
      style.id = "noticeBoxStyles";
      style.textContent = `
        .notice-box {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          border-radius: 4px;
          background-color: #323232;
          color: white;
          font-size: 14px;
          z-index: 1000;
          transition: opacity 0.3s, transform 0.3s;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        .notice-box.success { background-color: #4CAF50; }
        .notice-box.error { background-color: #F44336; }
        .notice-box.info { background-color: #2196F3; }
        .notice-box.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .notice-box.hide {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Set message text and apply appropriate class
  noticeText.textContent = message;

  // Remove any existing type classes
  noticeBox.classList.remove("success", "error", "info");

  // Add the new type class
  noticeBox.classList.add(type);

  // Show the notice
  noticeBox.classList.remove("hide");
  noticeBox.classList.add("show");

  // Hide after duration
  setTimeout(() => {
    noticeBox.classList.remove("show");
    noticeBox.classList.add("hide");
  }, duration);
}

// Initialize form when DOM is loaded
document.addEventListener("DOMContentLoaded", initAppointmentForm);
