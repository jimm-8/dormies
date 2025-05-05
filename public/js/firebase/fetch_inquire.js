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
  addDoc,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// Firebase config
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

// DOM Elements
const listingsContainer = document.getElementById("listings-container");
const inquiriesContainer = document.getElementById("inquiries-list");
const messagesContainer = document.getElementById("messages-container");
const listingTitle = document.getElementById("listing-title");
const listingSubtitle = document.getElementById("listing-subtitle");
const contactName = document.getElementById("contact-name");
const inquiryDate = document.getElementById("inquiry-date");
const replyInput = document.querySelector(".reply-input");
const sendButton = document.querySelector(".send-btn");
const listingSearch = document.getElementById("listing-search");

// Templates
const listingItemTemplate = document.getElementById("listing-item-template");
const inquiryItemTemplate = document.getElementById("inquiry-item-template");
const messageTemplate = document.getElementById("message-template");
const messageThreadTemplate = document.getElementById(
  "message-thread-template"
);
const emptyStateTemplate = document.getElementById("empty-state-template");
const loadingTemplate = document.getElementById("loading-indicator-template");

// Global state
let currentOwnerId = null;
let currentListingId = null;
let currentInquiryId = null;
let currentRenterId = null;
let ownerListingsMap = new Map();

// Mobile Navigation
document.addEventListener("DOMContentLoaded", function () {
  const backButtons = document.querySelectorAll(".back-button");

  backButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const parentElement = this.closest(
        ".inquiries-sidebar, .conversation-area"
      );

      if (parentElement.classList.contains("inquiries-sidebar")) {
        document.querySelector(".listings-sidebar").classList.add("active");
        document.querySelector(".inquiries-sidebar").classList.remove("active");
      } else if (parentElement.classList.contains("conversation-area")) {
        document.querySelector(".inquiries-sidebar").classList.add("active");
        document.querySelector(".conversation-area").classList.remove("active");
      }
    });
  });

  // Initialize search functionality
  listingSearch.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();
    const listingItems = document.querySelectorAll(".listing-item");

    listingItems.forEach((item) => {
      const title = item
        .querySelector(".listing-title")
        .textContent.toLowerCase();
      const address = item
        .querySelector(".listing-address")
        .textContent.toLowerCase();

      if (title.includes(searchTerm) || address.includes(searchTerm)) {
        item.style.display = "flex";
      } else {
        item.style.display = "none";
      }
    });
  });
});

// Auth state listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentOwnerId = user.uid;
    await fetchListings(currentOwnerId);
    showEmptyConversationState();
  } else {
    console.warn("User not logged in");
    listingsContainer.innerHTML = "<p>Please log in to view inquiries.</p>";
    window.location.href = "/login.html";
  }
});

// Fetch all listings for the owner
async function fetchListings(ownerId) {
  showLoadingIndicator(listingsContainer);

  try {
    const listingsRef = collection(db, "listings");
    const q = query(listingsRef, where("ownerId", "==", ownerId));
    const snapshot = await getDocs(q);

    clearContainer(listingsContainer);

    if (snapshot.empty) {
      showEmptyState(
        listingsContainer,
        "No Listings",
        "Add properties to receive inquiries"
      );
      return;
    }

    const listings = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      listings.push({ id: docSnap.id, ...data });
      ownerListingsMap.set(docSnap.id, {
        title: data.title || "Untitled Listing",
        address: data.address || "No address",
      });
    });

    // Sort listings by title
    listings.sort((a, b) => (a.title || "").localeCompare(b.title || ""));

    // Render each listing
    listings.forEach(renderListing);

    // Select the first listing by default
    if (listings.length > 0) {
      const firstListing = document.querySelector(".listing-item");
      if (firstListing) {
        firstListing.click();
      }
    }
  } catch (error) {
    console.error("Error fetching listings:", error);
    showErrorState(listingsContainer, "Could not load listings");
  }
}

// Render a single listing item
function renderListing(listing) {
  const clone = listingItemTemplate.content.cloneNode(true);
  const listingItem = clone.querySelector(".listing-item");

  listingItem.dataset.listingId = listing.id;

  const titleElement = clone.querySelector(".listing-title");
  titleElement.textContent = listing.title || "Untitled Listing";

  const addressElement = clone.querySelector(".listing-address");
  addressElement.textContent = listing.address || "No address";

  const inquiriesCount = clone.querySelector("#inquiries-count");
  inquiriesCount.textContent = "0 inquiries";

  const lastActivity = clone.querySelector(".last-activity");
  lastActivity.textContent = "No recent activity";

  // Add click handler
  listingItem.addEventListener("click", () => {
    // Update UI to show this listing is selected
    document.querySelectorAll(".listing-item").forEach((item) => {
      item.classList.remove("active");
    });
    listingItem.classList.add("active");

    // Load inquiries for this listing
    currentListingId = listing.id;
    fetchInquiriesForListing(listing.id);

    // Mobile responsive behavior
    if (window.innerWidth < 768) {
      document.querySelector(".listings-sidebar").classList.remove("active");
      document.querySelector(".inquiries-sidebar").classList.add("active");
    }
  });

  listingsContainer.appendChild(clone);

  // Update inquiry count asynchronously
  updateListingInquiryCount(listing.id, inquiriesCount, lastActivity);
}

// Update the inquiry count and last activity for a listing
async function updateListingInquiryCount(
  listingId,
  countElement,
  activityElement
) {
  try {
    const q = query(
      collection(db, "inquiries"),
      where("listingId", "==", listingId),
      where("ownerId", "==", currentOwnerId),
      orderBy("timestamp", "desc"),
      where("timestamp", "!=", null)
    );

    const snapshot = await getDocs(q);

    // Update count
    const count = snapshot.size;
    countElement.textContent = count === 1 ? "1 inquiry" : `${count} inquiries`;

    // Update last activity
    if (count > 0) {
      const latestInquiry = snapshot.docs[0].data();
      const timestamp = latestInquiry.timestamp?.toDate();

      if (timestamp) {
        activityElement.textContent = `Last activity: ${formatDate(timestamp)}`;
      }
    }
  } catch (error) {
    console.error("Error updating inquiry count:", error);
  }
}

// Fetch inquiries for a specific listing
async function fetchInquiriesForListing(listingId) {
  showLoadingIndicator(inquiriesContainer);

  // Update the header with listing info
  const listingInfo = ownerListingsMap.get(listingId) || {
    title: "Unknown Listing",
    address: "",
  };
  listingTitle.textContent = listingInfo.title;
  listingSubtitle.textContent = listingInfo.address;

  try {
    // Reset message area
    showEmptyConversationState();

    // Get all inquiries for this listing
    const inquiriesRef = collection(db, "inquiries");
    const q = query(
      inquiriesRef,
      where("listingId", "==", listingId),
      where("ownerId", "==", currentOwnerId)
    );

    const snapshot = await getDocs(q);

    clearContainer(inquiriesContainer);

    if (snapshot.empty) {
      showEmptyState(
        inquiriesContainer,
        "No Inquiries",
        "You haven't received any inquiries yet"
      );
      return;
    }

    // Group inquiries by renter
    const renterGroups = new Map();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const renterId = data.renterId;

      if (!renterGroups.has(renterId)) {
        renterGroups.set(renterId, []);
      }

      renterGroups.get(renterId).push({
        id: doc.id,
        ...data,
      });
    });

    // Process each renter's inquiries
    for (const [renterId, inquiries] of renterGroups.entries()) {
      // Sort inquiries by timestamp
      inquiries.sort((a, b) => {
        const timeA = a.timestamp?.toDate() || new Date(0);
        const timeB = b.timestamp?.toDate() || new Date(0);
        return timeB - timeA; // Newest first
      });

      // Get renter info
      try {
        const renterDoc = await getDoc(doc(db, "renters", renterId));
        const renterData = renterDoc.exists() ? renterDoc.data() : null;

        renderInquiryItem(renterId, inquiries[0], renterData);
      } catch (error) {
        console.error("Error fetching renter data:", error);
        renderInquiryItem(renterId, inquiries[0], null);
      }
    }
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    showErrorState(inquiriesContainer, "Could not load inquiries");
  }
}

// Render a single inquiry item in the sidebar
function renderInquiryItem(renterId, latestInquiry, renterData) {
  const clone = inquiryItemTemplate.content.cloneNode(true);
  const inquiryItem = clone.querySelector(".inquiry-item");

  inquiryItem.dataset.inquiryId = latestInquiry.id;
  inquiryItem.dataset.renterId = renterId;

  // Set contact name
  const nameElement = clone.querySelector(".inquiry-title");
  nameElement.textContent = renterData
    ? `${renterData.firstname || ""} ${renterData.lastname || ""}`.trim()
    : "Unknown Contact";

  // Set last message preview
  const messagePreview = clone.querySelector(".last-message");
  messagePreview.textContent = latestInquiry.message
    ? latestInquiry.message.length > 30
      ? `${latestInquiry.message.substring(0, 30)}...`
      : latestInquiry.message
    : "[No message]";

  // Set time
  const timeElement = clone.querySelector(".inquiry-time");
  timeElement.textContent = latestInquiry.timestamp
    ? formatMessageTime(latestInquiry.timestamp.toDate())
    : "";

  // Set unread badge if needed
  const unreadBadge = clone.querySelector(".unread-badge");
  if (latestInquiry.sender === "renter" && !latestInquiry.read) {
    unreadBadge.style.display = "flex";
    unreadBadge.textContent = "New";
  }

  // Set message status
  const messageStatus = clone.querySelector(".message-status");
  if (latestInquiry.sender === "owner") {
    messageStatus.style.display = "flex";
  } else {
    messageStatus.style.display = "none";
  }

  // Add click handler
  inquiryItem.addEventListener("click", () => {
    document.querySelectorAll(".inquiry-item").forEach((item) => {
      item.classList.remove("active");
    });
    inquiryItem.classList.add("active");

    // Show conversation
    currentRenterId = renterId;
    currentInquiryId = latestInquiry.id;
    showConversation(renterId, nameElement.textContent);

    // Mobile responsive behavior
    if (window.innerWidth < 768) {
      document.querySelector(".inquiries-sidebar").classList.remove("active");
      document.querySelector(".conversation-area").classList.add("active");
    }
  });

  inquiriesContainer.appendChild(clone);
}

// Show conversation between owner and renter
async function showConversation(renterId, renterName) {
  // Update conversation header
  contactName.textContent = renterName;
  inquiryDate.textContent = "Loading messages...";

  showLoadingIndicator(messagesContainer);

  try {
    // Get all messages between this owner and renter for the current listing
    const q = query(
      collection(db, "inquiries"),
      where("listingId", "==", currentListingId),
      where("ownerId", "==", currentOwnerId),
      where("renterId", "==", renterId),
      orderBy("timestamp", "asc")
    );

    const snapshot = await getDocs(q);

    clearContainer(messagesContainer);

    if (snapshot.empty) {
      showEmptyState(messagesContainer, "No Messages", "Start a conversation");
      return;
    }

    // Group messages by date
    const messagesByDate = new Map();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate() || new Date();
      const dateStr = formatDateHeader(timestamp);

      if (!messagesByDate.has(dateStr)) {
        messagesByDate.set(dateStr, []);
      }

      messagesByDate.get(dateStr).push({
        id: doc.id,
        ...data,
        timestamp,
      });

      // Mark renter messages as read
      if (data.sender === "renter" && !data.read) {
        updateDoc(doc.ref, { read: true });
      }
    });

    // Update inquiry date in header
    if (snapshot.size > 0) {
      const firstMsg = snapshot.docs[0].data();
      const firstTimestamp = firstMsg.timestamp?.toDate();
      inquiryDate.textContent = firstTimestamp
        ? `Inquiry started on ${formatDate(firstTimestamp)}`
        : "Recent inquiry";
    }

    // Render message groups by date
    for (const [dateStr, messages] of messagesByDate.entries()) {
      const threadClone = messageThreadTemplate.content.cloneNode(true);
      const dateHeader = threadClone.querySelector(
        ".message-date-divider span"
      );
      const messagesWrapper = threadClone.querySelector(".messages-thread");

      dateHeader.textContent = dateStr;

      // Render each message in this date group
      messages.forEach((message) => {
        const messageClone = messageTemplate.content.cloneNode(true);
        const messageElement = messageClone.querySelector(".message");

        // Set message text and time
        messageElement.querySelector(".message-text").textContent =
          message.message;
        messageElement.querySelector(".message-time").textContent =
          formatMessageTime(message.timestamp);

        // Set sender class
        if (message.sender === "owner") {
          messageElement.classList.add("sent");
        } else {
          messageElement.classList.add("received");
        }

        // Show read status for owner messages
        const statusIcon = messageElement.querySelector(".message-status");
        if (message.sender === "owner") {
          statusIcon.style.display = "inline";
        } else {
          statusIcon.style.display = "none";
        }

        messagesWrapper.appendChild(messageElement);
      });

      messagesContainer.appendChild(threadClone);
    }

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Setup reply functionality
    setupReplyFunctionality();
  } catch (error) {
    console.error("Error loading conversation:", error);
    showErrorState(messagesContainer, "Could not load messages");
  }
}

// Setup the reply input and send button
function setupReplyFunctionality() {
  // Clear previous input
  replyInput.value = "";

  // Remove previous event listeners
  sendButton.replaceWith(sendButton.cloneNode(true));

  // Get the new button reference
  const newSendButton = document.querySelector(".send-btn");

  // Add event listener
  newSendButton.addEventListener("click", sendReply);

  // Add enter key listener
  replyInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendReply();
    }
  });
}

// Send a reply message
async function sendReply() {
  const messageText = replyInput.value.trim();

  if (
    !messageText ||
    !currentListingId ||
    !currentRenterId ||
    !currentOwnerId
  ) {
    return;
  }

  try {
    // Add new message to database
    await addDoc(collection(db, "inquiries"), {
      listingId: currentListingId,
      ownerId: currentOwnerId,
      renterId: currentRenterId,
      message: messageText,
      sender: "owner",
      timestamp: serverTimestamp(),
      read: false,
    });

    // Clear input
    replyInput.value = "";

    // Refresh conversation (optional - can also use real-time listener for better UX)
    showConversation(currentRenterId, contactName.textContent);
  } catch (error) {
    console.error("Error sending message:", error);
    alert("Failed to send message. Please try again.");
  }
}

// Show empty conversation state
function showEmptyConversationState() {
  contactName.textContent = "Select an Inquiry";
  inquiryDate.textContent = "Select an inquiry to view the conversation";
  clearContainer(messagesContainer);

  const emptyClone = emptyStateTemplate.content.cloneNode(true);
  messagesContainer.appendChild(emptyClone);
}

// Show loading indicator in container
function showLoadingIndicator(container) {
  clearContainer(container);
  const loadingClone = loadingTemplate.content.cloneNode(true);
  container.appendChild(loadingClone);
}

// Show empty state in container
function showEmptyState(container, title, message) {
  clearContainer(container);
  const emptyClone = emptyStateTemplate.content.cloneNode(true);

  const heading = emptyClone.querySelector("h3");
  const paragraph = emptyClone.querySelector("p");

  if (heading) heading.textContent = title;
  if (paragraph) paragraph.textContent = message;

  container.appendChild(emptyClone);
}

// Show error state in container
function showErrorState(container, message) {
  clearContainer(container);
  const div = document.createElement("div");
  div.className = "error-state";
  div.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <h3>Error</h3>
    <p>${message}</p>
  `;
  container.appendChild(div);
}

// Clear a container
function clearContainer(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

// Format date for message header
function formatDateHeader(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) {
    return "Today";
  } else if (isSameDay(date, yesterday)) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  }
}

// Check if two dates are the same day
function isSameDay(date1, date2) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

// Format date
function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

// Format message time
function formatMessageTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
