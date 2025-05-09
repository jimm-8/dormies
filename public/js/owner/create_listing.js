// Loader
setTimeout(() => {
  const loader = document.querySelector(".loader");
  const main = document.getElementById("main");

  loader.style.opacity = "0";
  loader.style.transition = "opacity 0.8s ease-out";

  setTimeout(() => {
    loader.style.display = "none";
    main.style.display = "block";
    main.style.opacity = "1";
    main.style.transition = "opacity 0.8s ease-in";
  }, 800);
}, 3000);

// Back Button
const back = document.getElementById("back-btn");
back.addEventListener("click", () => {
  location.href = "/pages/owner/dashboard.html";
});
