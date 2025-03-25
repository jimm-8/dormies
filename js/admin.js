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

links.forEach((link) => {
  if (link.getAttribute("href") === currentPage) {
    link.classList.add("active");
  }
});

const accBtn = document.getElementById("acc_btn");
if (accBtn) {
  accBtn.addEventListener("click", () => {
    location.href = "/dormies/pages/owner/account.html";
  });
}
