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

const owner_btn = document.getElementById("owner_btn");
const renter_btn = document.getElementById("renter_btn");

owner_btn.addEventListener("click", () => {
  window.location.href = "/create/owner_acc.html";
});

renter_btn.addEventListener("click", () => {
  window.location.href = "/create/renter_acc.html";
});
