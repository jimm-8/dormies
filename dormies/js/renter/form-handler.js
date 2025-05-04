import { db, collection, addDoc, serverTimestamp } from "./firebase.js";

// Handle Inquire Form
document.getElementById("inquireForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = document.getElementById("inquireMessage").value.trim();

  if (message) {
    try {
      await addDoc(collection(db, "inquiries"), {
        message,
        timestamp: serverTimestamp()
      });
      alert("Message sent!");
      e.target.reset();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to send message.");
    }
  }
});

// Handle Schedule Form
document.getElementById("scheduleForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const date = document.getElementById("scheduleDate").value;
  const time = document.getElementById("scheduleTime").value;

  if (date && time) {
    try {
      await addDoc(collection(db, "schedules"), {
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
  }
});
