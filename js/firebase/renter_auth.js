import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  getFirestore,
  getDoc,
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

  const loginBtn = document.getElementById("login_btn");

  if (!loginBtn) {
    console.error("Button with ID 'login_btn' not found.");
    return;
  }

  loginBtn.addEventListener("click", async (event) => {
    event.preventDefault();

    const email = document.getElementById("renter_email").value;
    const password = document.getElementById("renter_password").value;

    if (!email || !password) {
      showMessageBox("Please fill in both email and password.");
      return;
    }

    const auth = getAuth(app);
    const db = getFirestore(app);

    loginBtn.innerText = "Logging in...";
    loginBtn.disabled = true;

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 🔍 Check Firestore for the 'owners' collection
      const ownerDocRef = doc(db, "renters", user.uid);
      const ownerDocSnap = await getDoc(ownerDocRef);

      if (ownerDocSnap.exists()) {
        showMessageBox("Login successful");
        localStorage.setItem("loggedInUserId", user.uid);
        window.location.href = "/dormies/pages/renter/home.html";
      } else {
        showMessageBox("Unauthorized access. This account is not an owner.");
      }
    } catch (error) {
      const errorCode = error.code;
      if (errorCode === "auth/invalid-credential") {
        showMessageBox("Incorrect email or password");
      } else {
        showMessageBox("Account does not exist");
      }
    } finally {
      loginBtn.innerText = "Login";
      loginBtn.disabled = false;
    }
  });
});
