import { db, collection, addDoc, serverTimestamp, auth } from "./firebase.js";

// Handle Inquire Form
document.getElementById("inquireForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = document.getElementById("inquireMessage").value.trim();
  const user = auth.currentUser;

  if (message && user) {
    try {
      await addDoc(collection(db, "inquiries"), {
        renterId: user.uid, // Attach renterId (user's UID)
        message,
        timestamp: serverTimestamp()
      });
      alert("Message sent!");
      e.target.reset();
    } catch (error) {
      console.error("Error:", error);
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
  const user = auth.currentUser;

  if (date && time && user) {
    try {
      await addDoc(collection(db, "schedules"), {
        renterId: user.uid, // Attach renterId (user's UID)
        preferredDate: date,
        preferredTime: time,
        timestamp: serverTimestamp()
      });
      alert("Schedule request sent!");
      e.target.reset();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to schedule.");
    }
  } else {
    alert("User not logged in or missing date/time.");
  }
});
