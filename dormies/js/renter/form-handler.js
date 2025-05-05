// Import Firebase modules from your firebase.js
import { db, collection, addDoc, serverTimestamp, auth } from "./firebase.js";

// Track the current logged-in user
let currentUser = null;

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    console.log("User logged in:", user.uid);
  } else {
    currentUser = null;
    console.log("No user is logged in.");
  }
});

// Handle Inquire Form
document.getElementById("inquireForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = document.getElementById("inquireMessage").value.trim();

  if (message && currentUser) {
    try {
      await addDoc(collection(db, "inquiries"), {
        userId: currentUser.uid,
        message,
        timestamp: serverTimestamp()
      });
      alert("Message sent!");
      e.target.reset();
    } catch (error) {
      console.error("Error sending inquiry:", error);
      alert("Failed to send message.");
    }
  } else {
    alert("User not logged in or message is empty.");
  }
});

// Handle Schedule Form
document.getElementById("scheduleForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const date = document.getElementById("scheduleDate").value;
  const time = document.getElementById("scheduleTime").value;

  if (date && time && currentUser) {
    try {
      await addDoc(collection(db, "schedules"), {
        userId: currentUser.uid,
        preferredDate: date,
        preferredTime: time,
        timestamp: serverTimestamp()
      });
      alert("Schedule request sent!");
      e.target.reset();
    } catch (error) {
      console.error("Error sending schedule:", error);
      alert("Failed to schedule.");
    }
  } else {
    alert("User not logged in or missing date/time.");
  }
});
