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

// ✅ DOM Elements
const listingsContainer = document.getElementById("listings-container");
const inquiriesContainer = document.getElementById("inquiries-container");
const currentListingHeader = document.getElementById("current-listing-header");

const listingItemTemplate = document.getElementById("listing-item-template");
const inquiryThreadTemplate = document.getElementById(
  "inquiry-thread-template"
);
const messageTemplate = document.getElementById("message-template");
const emptyStateTemplate = document.getElementById("empty-state-template");
const loadingTemplate = document.getElementById("loading-indicator-template");

let currentOwnerId = null;
let ownerListingsMap = new Map();

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentOwnerId = user.uid;
    await fetchListings(user.uid);
    await fetchValidInquiries();
  } else {
    console.warn("User not logged in");
    listingsContainer.innerHTML = "<p>Please log in to view inquiries.</p>";
  }
});

async function fetchListings(ownerId) {
  listingsContainer.innerHTML = "";
  listingsContainer.appendChild(loadingTemplate.content.cloneNode(true));

  const listingsRef = collection(db, `owners/${ownerId}/listings`);
  const snapshot = await getDocs(listingsRef);
  listingsContainer.innerHTML = "";

  const ownerListings = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    ownerListings.push({ id: docSnap.id, ...data });
    ownerListingsMap.set(docSnap.id, data.title || "Untitled Listing");
  });

  if (ownerListings.length === 0) {
    listingsContainer.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  ownerListings.forEach((listing) => renderListing(listing));
}

function renderListing(listing) {
  const listingElement = listingItemTemplate.content.cloneNode(true);
  const wrapper = listingElement.querySelector(".listing-item");
  const title = listingElement.querySelector(".listing-title");
  const image = listingElement.querySelector(".listing-image");
  const unreadBadge = listingElement.querySelector(".unread-badge");

  title.textContent = listing.title || "Untitled Listing";
  image.src = listing.mainImage || "/assets/placeholder-property.jpg";

  wrapper.addEventListener("click", () => {
    loadMessagesFromInquiries(listing.id, listing.title);
    document
      .querySelectorAll(".listing-item")
      .forEach((el) => el.classList.remove("active"));
    wrapper.classList.add("active");
  });

  listingsContainer.appendChild(listingElement);
}

async function fetchValidInquiries() {
  const inquiriesRef = collection(db, "inquiries");

  onSnapshot(inquiriesRef, async (snapshot) => {
    const validInquiries = snapshot.docs.filter(
      (docSnap) =>
        docSnap.data().ownerId === currentOwnerId &&
        ownerListingsMap.has(docSnap.data().listingId)
    );

    // Optionally display somewhere that you have N valid messages
    console.log(`You have ${validInquiries.length} valid inquiry messages.`);
  });
}

async function loadMessagesFromInquiries(listingId, listingTitle) {
  inquiriesContainer.innerHTML = "";
  currentListingHeader.textContent = listingTitle;
  inquiriesContainer.appendChild(loadingTemplate.content.cloneNode(true));

  const q = query(
    collection(db, "inquiries"),
    where("listingId", "==", listingId),
    where("ownerId", "==", currentOwnerId),
    orderBy("timestamp", "asc")
  );

  onSnapshot(q, async (snapshot) => {
    inquiriesContainer.innerHTML = ""; // clear content only once

    if (snapshot.empty) {
      const empty = emptyStateTemplate.content.cloneNode(true);
      inquiriesContainer.appendChild(empty);
      return;
    }

    const inquiryThread = inquiryThreadTemplate.content.cloneNode(true);
    const threadContainer = inquiryThread.querySelector(".messages-thread");

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const senderId = data.userId; // ✅ fix field name to userId if needed

      let userData = {};
      try {
        const userDoc = await getDoc(doc(db, "users", senderId));
        userData = userDoc.exists() ? userDoc.data() : { name: "Unknown" };
      } catch (error) {
        console.warn("Error fetching user info:", error);
        userData = { name: "Unknown" };
      }

      const messageElement = messageTemplate.content.cloneNode(true);
      const msgBox = messageElement.querySelector(".message");

      msgBox.querySelector(".message-text").textContent =
        data.message || "[No message]";
      msgBox.querySelector(".message-sender").textContent =
        userData.name || "Unknown";

      msgBox.classList.add("received"); // ✅ always 'received' (from renter)

      threadContainer.appendChild(msgBox);
    }

    inquiriesContainer.appendChild(inquiryThread);
  });
}
