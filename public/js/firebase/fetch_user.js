import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Firebase Config
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
const auth = getAuth(app);
const db = getFirestore(app);

// Wait for user authentication
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User signed in:", user.uid);
    await fetchUserData(user.uid, user.email);
  } else {
    console.log("No user is signed in.");
  }
});

// Function to fetch user data (checks both Owners & Renters)
async function fetchUserData(userId, userEmail) {
  try {
    // Check if the user is an Owner
    const ownerRef = doc(db, "owners", userId);
    const ownerSnap = await getDoc(ownerRef);

    if (ownerSnap.exists()) {
      const ownerData = ownerSnap.data();
      console.log("Fetched Owner Data:", ownerData);

      // Set owner name in the HTML
      document.getElementById("owner_name").textContent = ownerData.name;

      // Generate initials for avatar
      if (typeof generateAvatar === "function") {
        generateAvatar(ownerData.name);
      }

      // Show owner-specific button if needed
      document.getElementById("acc_btn").style.visibility = "visible";
      return;
    }

    // If not an owner, check if the user is a Renter
    const rentersRef = collection(db, "renters");
    const renterQuery = query(rentersRef, where("email", "==", userEmail));
    const renterSnap = await getDocs(renterQuery);

    if (!renterSnap.empty) {
      renterSnap.forEach((doc) => {
        const renterData = doc.data();
        console.log("Fetched Renter Data:", renterData);

        // Set renter's full name in the HTML
        const fullName = `${renterData.firstname} ${renterData.lastname}`;
        document.getElementById("renter_name").textContent = fullName;

        const inputName = `${renterData.firstname} ${renterData.lastname}`;
        document.getElementById("renter_name_input").value = inputName;

        const inputEmail = renterData.email;
        document.getElementById("renter_email_input").value = inputEmail;

        const email = renterData.email;
        document.getElementById("renter_email").textContent = email;

        // Generate initials for avatar
        if (typeof generateAvatar === "function") {
          generateAvatar(fullName);
        }

        // If the user is a renter, make the button visible
        if (renterData.role === "renter") {
          document.getElementById("acc_btn").style.visibility = "visible";
        }
      });
      return;
    }

    console.log("User is not found in Owners or Renters collection.");
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
}

async function updateUserProfile(user) {
  const newName = document.getElementById("renter_name_input").value;
  const newEmail = document.getElementById("renter_email_input").value;
  const newPassword = document.getElementById("renter_new_password").value;

  try {
    // Update Firestore (User's Name)
    const userDocRef = doc(db, "renters", user.uid);
    await updateDoc(userDocRef, { firstname: newName });
    console.log("Name updated in Firestore");

    // Update Firebase Auth Email
    if (newEmail !== user.email) {
      await updateEmail(user, newEmail);
      console.log("Email updated in Firebase Auth");
    }

    // Update Firebase Auth Password (Only if a new password is provided)
    if (newPassword.trim() !== "") {
      await updatePassword(user, newPassword);
      console.log("Password updated in Firebase Auth");
    }

    alert("Profile updated successfully!");
  } catch (error) {
    console.error("Error updating profile:", error.message);
    alert("Error: " + error.message);
  }
}
