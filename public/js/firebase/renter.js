import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  getFirestore,
  setDoc,
  doc,
  serverTimestamp,
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

  const signUp = document.getElementById("renter_submit");

  if (!signUp) {
    console.error("Button with ID 'renter_submit' not found.");
    return;
  }

  signUp.addEventListener("click", async (event) => {
    event.preventDefault();

    const lastname = document.getElementById("renter_lname").value.trim();
    const firstname = document.getElementById("renter_fname").value.trim();
    const email = document.getElementById("renter_remail").value.trim();
    const password = document.getElementById("renter_rpassword").value.trim();

    if (!lastname || !firstname || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    const auth = getAuth(app);
    const db = getFirestore(app);

    // Start loading
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
        lastname: lastname,
        firstname: firstname,
        role: "renter",
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "renters", user.uid), userData);

      showMessageBox(
        "Account created successfully! Redirecting to Login...",
        () => {
          window.location.href = "/auth/renter_auth.html";
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
      // Reset button regardless of success or failure
      setTimeout(() => {
        signUp.innerText = "Sign Up";
        signUp.disabled = false;
      }, 4000);
    }
  });
});
