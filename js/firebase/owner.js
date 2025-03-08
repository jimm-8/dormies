import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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

const signUp = document.getElementById("owner_submit");
signUp.addEventListener("click", (event) => {
  event.preventDefault();

  const name = document.getElementById("owner_name").value;
  const bisname = document.getElementById("owner_bisname").value;
  const email = document.getElementById("owner_remail").value;
  const password = document.getElementById("owner_rpassword").value;

  const auth = getAuth();
  const db = getFirestore();

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      const userData = {
        email: email,
        name: name,
        bisname: bisname,
        role: "owner",
      };
      const docRef = doc(db, "owners", user.uid);
      setDoc(docRef, userData)
        .then(() => {
          alert("Account created successfully");
          window.location.href = "/dormies/auth/owner_auth.html";
        })
        .catch((error) => {
          console.error("Error adding document: ", error);
        });
    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode == "auth/email-already-in-use") {
        alert("Email already in use");
      } else {
        alert("Error creating account");
      }
    });
});
