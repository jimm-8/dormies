import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// Loader
setTimeout(() => {
  const loader = document.querySelector(".loader");
  const main = document.getElementById("main");

  loader.style.opacity = "0";
  loader.style.transition = "opacity 0.8s ease-out";

  setTimeout(() => {
    loader.style.display = "none";
    main.style.display = "block";
    main.style.opacity = "0";
    setTimeout(() => {
      main.style.opacity = "1";
      main.style.transition = "opacity 0.8s ease-in";
    }, 100);
  }, 800);
}, 3000);

const firebaseConfig = {
  apiKey: "AIzaSyCV7GHk-wK5bhDg2Inqm7vJqTYjl1TTTNw",
  authDomain: "dormies-b47b7.firebaseapp.com",
  projectId: "dormies-b47b7",
  storageBucket: "dormies-b47b7.firebasestorage.app",
  messagingSenderId: "443577320462",
  appId: "1:443577320462:web:0a418fa107fbd01bd1285f",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const submit = document.getElementById("submit");

submit.addEventListener("click", (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Please enter both email and password.");
    return;
  }

  createUserWithEmailAndPassword(auth, username, password)
    .then((userCredential) => {
      alert("Account created successfully!");
      console.log("User:", userCredential.user);
    })
    .catch((error) => {
      alert(`Error: ${error.message}`);
      console.error("Error:", error);
    });
});

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const role = params.get("role");

  const ownerSignIn = document.getElementById("owner_sign_in");
  const renterSignIn = document.getElementById("renter_sign_in");

  if (ownerSignIn && renterSignIn) {
    ownerSignIn.style.display = "none";
    renterSignIn.style.display = "none";

    if (role === "owner") {
      ownerSignIn.style.display = "block";
    } else if (role === "renter") {
      renterSignIn.style.display = "block";
    }
  } else {
    console.error(
      "One or both elements (owner_sign_in / renter_sign_in) not found."
    );
  }
});
