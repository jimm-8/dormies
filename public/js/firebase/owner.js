import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  getFirestore,
  setDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCV7GHk-wK5bhDg2Inqm7vJqTYjl1TTTNw",
  authDomain: "dormies-b47b7.firebaseapp.com",
  projectId: "dormies-b47b7",
  storageBucket: "dormies-b47b7.appspot.com",
  messagingSenderId: "443577320462",
  appId: "1:443577320462:web:0a418fa107fbd01bd1285f",
};

const app = initializeApp(firebaseConfig);

// Function to show message box
function showMessageBox(message, callback = null) {
  const messageBox = document.getElementById("messageBox");
  const messageText = document.getElementById("messageText");

  messageText.innerText = message;
  messageBox.classList.remove("hide"); // Remove hide animation if it's there
  messageBox.classList.add("show"); // Apply slide-down animation
  messageBox.style.display = "block"; // Ensure it is visible

  if (callback) {
    setTimeout(() => {
      closeMessageBox();
      callback();
    }, 2000);
  }
}

function closeMessageBox() {
  const messageBox = document.getElementById("messageBox");
  messageBox.classList.remove("show"); // Remove slide-down animation
  messageBox.classList.add("hide"); // Apply slide-up animation

  setTimeout(() => {
    messageBox.style.display = "none"; // Hide after animation completes
  }, 500); // Wait for animation to finish
}

document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("closeMessageBox");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeMessageBox);
  } else {
    console.error("Close button not found.");
  }

  const signUp = document.getElementById("owner_submit");

  if (!signUp) {
    console.error("Button with ID 'owner_submit' not found.");
    return;
  }

  signUp.addEventListener("click", async (event) => {
    event.preventDefault();

    const name = document.getElementById("owner_name").value.trim();
    const bisname = document.getElementById("owner_bisname").value.trim();
    const email = document.getElementById("owner_remail").value.trim();
    const password = document.getElementById("owner_rpassword").value.trim();

    if (!name || !bisname || !email || !password) {
      showMessageBox("Please fill in all fields.");
      return;
    }

    const auth = getAuth(app);
    const db = getFirestore(app);

    // Disable button and show loading state
    signUp.innerText = "Creating account...";
    signUp.disabled = true;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userData = {
        email: email,
        name: name,
        bisname: bisname,
        role: "owner",
      };

      await setDoc(doc(db, "owners", user.uid), userData);

      // Show message box and redirect after delay
      showMessageBox(
        "Account created successfully! Redirecting to Login...",
        () => {
          window.location.href = "/auth/owner_auth.html";
        }
      );
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        showMessageBox("Email already in use.");
      } else if (error.code === "auth/weak-password") {
        showMessageBox("Password should be at least 6 characters.");
      } else {
        showMessageBox("Error creating account: " + error.message);
      }
    } finally {
      // Reset button only if there's no redirect
      setTimeout(() => {
        if (signUp) {
          signUp.innerText = "Sign Up";
          signUp.disabled = false;
        }
      }, 4000);
    }
  });
});
