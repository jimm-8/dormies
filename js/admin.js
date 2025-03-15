// Loader
setTimeout(() => {
  const loader = document.querySelector(".loader");
  const main = document.getElementById("main");

  if (loader && main) {
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
  }
}, 3000);

document.addEventListener("DOMContentLoaded", function () {
  const menuBtn = document.getElementById("menu-btn");
  const navLinks = document.getElementById("nav-list");

  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", function () {
      navLinks.classList.toggle("active");
    });
  }
});

const links = document.querySelectorAll(".nav-list-item");
const currentPage = window.location.pathname.split("/").pop();

links.array.forEach((link) => {
  if (link.getAtribute("href") === currentPage) {
    link.classList.add("active");
  }
});

const accBtn = document.getElementById("acc_btn");
if (accBtn) {
  accBtn.addEventListener("click", () => {
    location.href = "/dormies/pages/owner/account.html";
  });
}
