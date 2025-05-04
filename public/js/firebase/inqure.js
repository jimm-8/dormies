import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore,
  addDoc,
  serverTimestamp,
  collection,
  getDocs,
  setDoc,
  doc,
  getDoc,
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
 * Initialize the inquiry form functionality
 */
export async function initInquiryForm() {
  await initializeRequiredCollections();

  const urlParams = new URLSearchParams(window.location.search);
  const ownerId = urlParams.get("ownerId");
  const listingId = urlParams.get("listingId");

  if (!ownerId || !listingId) {
    console.error("Missing ownerId or listingId in URL parameters");
    return;
  }

  const inquireForm = document.querySelector(".inquire-form");
  if (!inquireForm) {
    console.error("Inquiry form not found in the document");
    return;
  }

  setupInquiryFormSubmit(inquireForm, ownerId, listingId);
}

/**
 * Check if required Firestore collections exist
 */
async function initializeRequiredCollections() {
  try {
    const messagesQuery = collection(db, "messages");
    const messagesSnapshot = await getDocs(messagesQuery);

    if (messagesSnapshot.empty) {
      console.log("Initializing messages collection...");

      const messagesCollectionRef = collection(db, "messages");
      await addDoc(messagesCollectionRef, {
        type: "system",
        message: "Messages collection initialized",
        createdAt: serverTimestamp(),
      });

      console.log("Messages collection initialized successfully");
    }
  } catch (error) {
    console.warn("Error checking/initializing collections:", error);
  }
}

/**
 * Set up the submit event handler for the inquiry form
 */
function setupInquiryFormSubmit(form, ownerId, listingId) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const renter = auth.currentUser;
    if (!renter) {
      showNotice("Please log in to send a message to the owner.");
      redirectToLogin();
      return;
    }

    const messageTextarea = form.querySelector("textarea");
    if (!messageTextarea) {
      console.error("Message textarea not found in inquiry form");
      return;
    }

    const messageText = messageTextarea.value.trim();
    if (!messageText) {
      showNotice("Please enter a message.", "error");
      return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    const originalText = submitButton?.textContent;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    try {
      await saveInquiryMessage(renter.uid, ownerId, listingId, messageText);

      form.reset();
      showNotice("Your message has been sent to the owner!", "success");
    } catch (error) {
      console.error("Error sending inquiry:", error);
      showNotice(
        "Failed to send your message. Please try again later.",
        "error"
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });
}

/**
 * Save an inquiry message to Firestore
 */
async function saveInquiryMessage(renterId, ownerId, listingId, message) {
  try {
    const renterProfile = await fetchRenterProfile(renterId);

    const messageData = {
      senderId: renterId,
      senderName: renterProfile?.name || "Anonymous Renter",
      receiverId: ownerId,
      listingId: listingId,
      message: message,
      read: false,
      createdAt: serverTimestamp(),
      type: "inquiry",
    };

    await addDoc(collection(db, "messages"), messageData);
    return true;
  } catch (error) {
    console.error("Error saving inquiry message:", error);
    throw error;
  }
}

/**
 * Fetch a renter's profile from Firestore
 */
async function fetchRenterProfile(renterId) {
  try {
    const renterDoc = await getDoc(doc(db, "renters", renterId));
    if (renterDoc.exists()) {
      return {
        id: renterDoc.id,
        ...renterDoc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching renter profile:", error);
    return null;
  }
}

/**
 * Redirect to login
 */
function redirectToLogin() {
  window.location.href = `/pages/login.html?redirect=${encodeURIComponent(
    window.location.href
  )}`;
}

/**
 * Display a notice message
 */
function showNotice(message, type = "info", duration = 3000) {
  let noticeBox = document.getElementById("noticeBox");
  let noticeText = document.getElementById("noticeText");

  if (!noticeBox) {
    noticeBox = document.createElement("div");
    noticeBox.id = "noticeBox";
    noticeBox.className = "notice-box hide";

    noticeText = document.createElement("span");
    noticeText.id = "noticeText";

    noticeBox.appendChild(noticeText);
    document.body.appendChild(noticeBox);

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

  noticeText.textContent = message;
  noticeBox.classList.remove("success", "error", "info");
  noticeBox.classList.add(type);
  noticeBox.classList.remove("hide");
  noticeBox.classList.add("show");

  setTimeout(() => {
    noticeBox.classList.remove("show");
    noticeBox.classList.add("hide");
  }, duration);
}

// Initialize form
document.addEventListener("DOMContentLoaded", initInquiryForm);
