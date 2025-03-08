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

document.addEventListener("DOMContentLoaded", () => {
  const signIn = document.getElementById("login_btn");

  if (!signIn) {
    console.error("Button with ID 'login_btn' not found.");
    return;
  }

  signIn.addEventListener("click", async (event) => {
    event.preventDefault();

    const email = document.getElementById("renter_email").value;
    const password = document.getElementById("renter_password").value;

    const auth = getAuth(app);
    const db = getFirestore(app);

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
        alert("Login successful");
        localStorage.setItem("loggedInUserId", user.uid);
        window.location.href = "/dormies/pages/user.html";
      } else {
        alert("Unauthorized access. This account is not an owner.");
      }
    } catch (error) {
      const errorCode = error.code;
      if (errorCode === "auth/invalid-credential") {
        alert("Incorrect email or password");
      } else {
        alert("Account does not exist");
      }
    }
  });
});
