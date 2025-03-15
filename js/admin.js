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

document.addEventListener("DOMContentLoaded", function () {
  const menuBtn = document.getElementById("menu-btn");
  const navLinks = document.getElementById("nav-list");

  menuBtn.addEventListener("click", function () {
    navLinks.classList.toggle("active");
  });
});

const acc = document.getElementById("acc_btn");
acc.addEventListener("click", () => {
  location.href = "/dormies/pages/owner/account.html";
});
