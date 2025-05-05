// form-handler3.js
import { db, collection, addDoc, serverTimestamp } from "./firebase.js";

// Inquire Form Logic for listing3
const inquireForm = document.querySelector(".inquire-form");
if (inquireForm) {
  inquireForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = inquireForm.querySelector("textarea").value;
    if (message.trim()) {
      await addDoc(collection(db, "inquiries"), {
        message: message.trim(),
        timestamp: serverTimestamp()
      });
      alert("Message sent and saved!");
      inquireForm.reset();
    }
  });
}

// Schedule Form Logic for listing3
const scheduleForm = document.querySelector(".schedule-form");
if (scheduleForm) {
  scheduleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = scheduleForm.querySelector('input[type="date"]').value;
    const time = scheduleForm.querySelector('input[type="time"]').value;
    if (date && time) {
      await addDoc(collection(db, "schedules"), {
        preferredDate: date,
        preferredTime: time,
        timestamp: serverTimestamp()
      });
      alert("Schedule request saved!");
      scheduleForm.reset();
    }
  });
}
