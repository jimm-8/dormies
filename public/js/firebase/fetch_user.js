// Import Firebase modules
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js";

// Initialize Firebase services
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

// Main function to handle user authentication state
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is authenticated
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // User is signed in, fetch their data
        await fetchUserData(user.uid);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    } else {
      // User is signed out, redirect to login page
      window.location.href = "/renter/login.html";
    }
  });
});

// Function to fetch user data from Firestore
async function fetchUserData(userId) {
  try {
    // Get user document from Firestore
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();

      // Update UI with user data - with null checks
      updateUserUI(userData);

      // Fetch user's profile image if it exists
      if (userData.profileImage) {
        fetchProfileImage(userData.profileImage);
      } else {
        setDefaultAvatar();
      }

      // Now fetch any additional data like inquiries
      const inquiriesRef = collection(db, "inquiries");
      const q = query(inquiriesRef, where("renterId", "==", userId));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        // Process each inquiry
        const data = doc.data();
        // Add to UI or process as needed
        // ...
      });
    } else {
      console.log("No user data found!");
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
}

// Update UI elements with user data - with proper null checks
function updateUserUI(userData) {
  // Safely update name-related elements
  const nameElements = [
    document.getElementById("renter_name"),
    document.getElementById("renter_name_input"),
  ];

  nameElements.forEach((element) => {
    if (element) {
      element.textContent = userData.name || "";
      if (element.tagName === "INPUT") {
        element.value = userData.name || "";
      }
    }
  });

  // Safely update email-related elements
  const emailElements = [
    document.getElementById("renter_email"),
    document.getElementById("renter_email_input"),
  ];

  emailElements.forEach((element) => {
    if (element) {
      element.textContent = userData.email || "";
      if (element.tagName === "INPUT") {
        element.value = userData.email || "";
      }
    }
  });

  // Safely update other UI elements as needed
  const loader = document.querySelector(".loader");
  if (loader) {
    loader.style.display = "none";
  }
}

// Fetch and display user's profile image
async function fetchProfileImage(imagePath) {
  try {
    const avatarElement = document.getElementById("avatar");
    if (!avatarElement) return; // Exit if element doesn't exist

    const url = await getDownloadURL(ref(storage, imagePath));
    avatarElement.style.backgroundImage = `url(${url})`;
  } catch (error) {
    console.error("Error fetching profile image:", error);
    setDefaultAvatar();
  }
}

// Set default avatar when no profile image exists
function setDefaultAvatar() {
  const avatarElement = document.getElementById("avatar");
  if (avatarElement) {
    avatarElement.style.backgroundImage = 'url("/assets/default-avatar.png")';
  }
}

// Export necessary functions if needed
export { fetchUserData };
