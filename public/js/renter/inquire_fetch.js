import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
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
const inquiriesList = document.getElementById("inquiries-list");
const messagesContainer = document.getElementById("messages-container");
const conversationArea = document.getElementById("conversation-area");
const listingTitle = document.getElementById("listing-title");
const listingSubtitle = document.getElementById("listing-subtitle");
const contactName = document.getElementById("contact-name");
const inquiryDate = document.getElementById("inquiry-date");
const replyInput = document.querySelector(".reply-input");
const sendButton = document.querySelector(".send-btn");
const listingSearch = document.getElementById("listing-search");

// Templates - These need to be added to your HTML
const listingItemTemplate = document.createElement("template");
listingItemTemplate.id = "listing-item-template";
listingItemTemplate.innerHTML = `
  <div class="listing-item">
    <div class="listing-info">
      <h5 class="listing-title">Listing Title</h5>
      <p class="listing-address">Address</p>
    </div>
  </div>
`;

const inquiryItemTemplate = document.createElement("template");
inquiryItemTemplate.id = "inquiry-item-template";
inquiryItemTemplate.innerHTML = `
  <div class="inquiry-item">
    <div class="inquirer-avatar"></div>
    <div class="inquirer-info">
      <h5 class="inquirer-name">User Name</h5>
      <p class="last-message">Message preview...</p>
    </div>
    <div class="inquiry-meta">
      <span class="inquiry-time">Time</span>
      <span class="unread-badge">New</span>
    </div>
  </div>
`;

const messageTemplate = document.createElement("template");
messageTemplate.id = "message-template";
messageTemplate.innerHTML = `
  <div class="message">
    <div class="message-content">
      <p class="message-text"></p>
      <span class="message-time"></span>
    </div>
    <span class="message-status"><i class="fa fa-check"></i></span>
  </div>
`;

const messageThreadTemplate = document.createElement("template");
messageThreadTemplate.id = "message-thread-template";
messageThreadTemplate.innerHTML = `
  <div class="message-date-group">
    <div class="message-date-divider">
      <span>Date</span>
    </div>
    <div class="messages-thread"></div>
  </div>
`;

const emptyStateTemplate = document.createElement("template");
emptyStateTemplate.id = "empty-state-template";
emptyStateTemplate.innerHTML = `
  <div class="empty-state">
    <i class="fa fa-comments-o"></i>
    <h3>No Messages</h3>
    <p>Select a conversation to view messages</p>
  </div>
`;

const loadingTemplate = document.createElement("template");
loadingTemplate.id = "loading-indicator-template";
loadingTemplate.innerHTML = `
  <div class="loading-indicator">
    <div class="spinner"></div>
    <p>Loading...</p>
  </div>
`;

// Add templates to the document
document.body.appendChild(listingItemTemplate);
document.body.appendChild(inquiryItemTemplate);
document.body.appendChild(messageTemplate);
document.body.appendChild(messageThreadTemplate);
document.body.appendChild(emptyStateTemplate);
document.body.appendChild(loadingTemplate);

// Global state
let currentRenterId = null;
let currentListingId = null;
let currentOwnerId = null;
let currentInquiryId = null;

// Mobile Navigation
document.addEventListener("DOMContentLoaded", function () {
  // Initialize search functionality
  if (listingSearch) {
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
  }
});

// Auth state listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentRenterId = user.uid;
    await fetchContactedListings(currentRenterId);
    showEmptyConversationState();
  } else {
    console.warn("User not logged in");
    if (listingsContainer) {
      listingsContainer.innerHTML =
        "<p>Please log in to view your conversations.</p>";
    }
    window.location.href = "/login.html";
  }
});

// Fetch listings that the renter has contacted
async function fetchContactedListings(renterId) {
  if (!listingsContainer) return;

  showLoadingIndicator(listingsContainer);

  try {
    const inquiriesRef = collection(db, "inquiries");
    const q = query(inquiriesRef, where("renterId", "==", renterId));

    clearContainer(listingsContainer);

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      showEmptyState(
        listingsContainer,
        "No Contacted Properties",
        "You haven't contacted any properties yet"
      );
      return;
    }

    // Group by listings
    const contactedListings = new Map();

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const listingId = data.listingId;
      const ownerId = data.ownerId;
      const key = `${listingId}_${ownerId}`;

      if (!contactedListings.has(key)) {
        contactedListings.set(key, {
          listingId,
          ownerId,
          latestMessage: null,
          timestamp: null,
        });
      }

      // Track the latest message
      const timestamp = data.timestamp?.toDate() || new Date(0);
      const currentLatest = contactedListings.get(key).timestamp;

      if (!currentLatest || timestamp > currentLatest) {
        contactedListings.get(key).latestMessage = data;
        contactedListings.get(key).timestamp = timestamp;
      }
    }

    // Process each listing
    for (const [key, listing] of contactedListings.entries()) {
      try {
        // Get listing info
        const listingRef = doc(
          db,
          "owners",
          listing.ownerId,
          "listings",
          listing.listingId
        );
        const listingDoc = await getDoc(listingRef);
        const listingData = listingDoc.exists() ? listingDoc.data() : null;

        renderContactedListing(listing.listingId, listing.ownerId, listingData);
      } catch (error) {
        console.error("Error fetching listing data:", error);
        renderContactedListing(listing.listingId, listing.ownerId, null);
      }
    }
  } catch (error) {
    console.error("Error fetching contacted listings:", error);
    showErrorState(listingsContainer, "Could not load properties");
  }
}

// Render a contacted listing in the sidebar
function renderContactedListing(listingId, ownerId, listingData) {
  const clone = listingItemTemplate.content.cloneNode(true);
  const listingItem = clone.querySelector(".listing-item");

  listingItem.dataset.listingId = listingId;
  listingItem.dataset.ownerId = ownerId;

  // Set listing title
  const titleElement = clone.querySelector(".listing-title");
  titleElement.textContent = listingData
    ? listingData.title || "Untitled Listing"
    : "Unknown Listing";

  // Set listing address
  const addressElement = clone.querySelector(".listing-address");
  addressElement.textContent = listingData
    ? listingData.address || "No address"
    : "Unknown Location";

  // Add click handler
  listingItem.addEventListener("click", () => {
    document.querySelectorAll(".listing-item").forEach((item) => {
      item.classList.remove("active");
    });
    listingItem.classList.add("active");

    // Show inquiries for this listing
    currentListingId = listingId;
    currentOwnerId = ownerId;
    showListingInquiries(listingId, ownerId, titleElement.textContent);
  });

  listingsContainer.appendChild(clone);
}

// Show inquiries/contacts for a specific listing
async function showListingInquiries(listingId, ownerId, listingName) {
  // Update header
  listingTitle.textContent = listingName || "Property";
  listingSubtitle.textContent = "Conversation history";

  showLoadingIndicator(inquiriesList);
  clearContainer(messagesContainer);

  try {
    // We'll be showing owner contacts for this listing
    // In this case, it's just one owner, but this structure allows for more flexibility
    const ownerRef = doc(db, "owners", ownerId);
    const ownerSnap = await getDoc(ownerRef);
    const ownerData = ownerSnap.exists() ? ownerSnap.data() : null;

    clearContainer(inquiriesList);

    if (!ownerData) {
      showEmptyState(
        inquiriesList,
        "Owner Not Found",
        "Unable to load owner information"
      );
      return;
    }

    // Get the latest message
    const inquiriesRef = collection(db, "inquiries");
    const q = query(
      inquiriesRef,
      where("listingId", "==", listingId),
      where("ownerId", "==", ownerId),
      where("renterId", "==", currentRenterId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      showEmptyState(
        inquiriesList,
        "No Messages",
        "No conversation history with this owner"
      );
      return;
    }

    // Find the latest message
    let latestMessage = null;
    let latestTimestamp = null;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const timestamp = data.timestamp?.toDate() || new Date(0);

      if (!latestTimestamp || timestamp > latestTimestamp) {
        latestMessage = {
          id: docSnap.id,
          ...data,
          timestamp,
        };
        latestTimestamp = timestamp;
      }
    });

    // Render the owner contact
    renderInquiryItem(ownerId, ownerData, latestMessage);
  } catch (error) {
    console.error("Error fetching listing inquiries:", error);
    showErrorState(inquiriesList, "Could not load contacts");
  }
}

// Render an inquiry/contact item
function renderInquiryItem(ownerId, ownerData, latestMessage) {
  const clone = inquiryItemTemplate.content.cloneNode(true);
  const inquiryItem = clone.querySelector(".inquiry-item");

  inquiryItem.dataset.ownerId = ownerId;

  // Set owner name
  const nameElement = clone.querySelector(".inquirer-name");
  nameElement.textContent = ownerData
    ? `${ownerData.firstname || ""} ${ownerData.lastname || ""}`.trim() ||
      "Property Owner"
    : "Unknown Owner";

  // Set last message preview
  const messagePreview = clone.querySelector(".last-message");
  messagePreview.textContent =
    latestMessage && latestMessage.message
      ? latestMessage.message.length > 30
        ? `${latestMessage.message.substring(0, 30)}...`
        : latestMessage.message
      : "[No message]";

  // Set time
  const timeElement = clone.querySelector(".inquiry-time");
  timeElement.textContent =
    latestMessage && latestMessage.timestamp
      ? formatMessageTime(latestMessage.timestamp)
      : "";

  // Set unread badge if needed
  const unreadBadge = clone.querySelector(".unread-badge");
  if (
    latestMessage &&
    latestMessage.sender === "owner" &&
    !latestMessage.read
  ) {
    unreadBadge.style.display = "flex";
  } else {
    unreadBadge.style.display = "none";
  }

  // Add click handler
  inquiryItem.addEventListener("click", () => {
    document.querySelectorAll(".inquiry-item").forEach((item) => {
      item.classList.remove("active");
    });
    inquiryItem.classList.add("active");

    // Show conversation
    showConversation(
      currentListingId,
      ownerId,
      listingTitle.textContent,
      nameElement.textContent
    );
  });

  inquiriesList.appendChild(clone);
}

// Show conversation between renter and owner
async function showConversation(listingId, ownerId, listingTitle, ownerName) {
  // Show conversation area if needed
  if (conversationArea) {
    conversationArea.style.display = "flex";
  }

  // Update conversation header
  contactName.textContent = ownerName;
  inquiryDate.textContent = "Loading messages...";

  showLoadingIndicator(messagesContainer);

  try {
    // Get all messages for this conversation
    const q = query(
      collection(db, "inquiries"),
      where("listingId", "==", listingId),
      where("ownerId", "==", ownerId),
      where("renterId", "==", currentRenterId)
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

      // Mark owner messages as read
      if (data.sender === "owner" && !data.read) {
        updateDoc(doc.ref, { read: true });
      }
    });

    // Update inquiry date in header
    if (snapshot.size > 0) {
      const firstMsg = snapshot.docs[0].data();
      const firstTimestamp = firstMsg.timestamp?.toDate();
      inquiryDate.textContent = firstTimestamp
        ? `Conversation started on ${formatDate(firstTimestamp)}`
        : "Recent conversation";
    }

    // Render message groups by date
    for (const [dateStr, messages] of messagesByDate.entries()) {
      const threadClone = messageThreadTemplate.content.cloneNode(true);
      const dateHeader = threadClone.querySelector(
        ".message-date-divider span"
      );
      const messagesWrapper = threadClone.querySelector(".messages-thread");

      dateHeader.textContent = dateStr;

      // Sort messages by timestamp (oldest first)
      messages.sort((a, b) => a.timestamp - b.timestamp);

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
        if (message.sender === "renter") {
          messageElement.classList.add("sent");
        } else {
          messageElement.classList.add("received");
        }

        // Show read status for renter messages
        const statusIcon = messageElement.querySelector(".message-status");
        if (message.sender === "renter") {
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
    !currentOwnerId ||
    !currentRenterId
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
      sender: "renter",
      timestamp: serverTimestamp(),
      read: false,
    });

    // Clear input
    replyInput.value = "";

    // Refresh conversation
    showConversation(
      currentListingId,
      currentOwnerId,
      listingTitle.textContent,
      contactName.textContent
    );
  } catch (error) {
    console.error("Error sending message:", error);
    alert("Failed to send message. Please try again.");
  }
}

// Show empty conversation state
function showEmptyConversationState() {
  contactName.textContent = "Select a Contact";
  inquiryDate.textContent = "Choose a conversation to begin";
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
    <i class="fa fa-exclamation-circle"></i>
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
