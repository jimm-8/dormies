document.addEventListener("DOMContentLoaded", function () {
  const menuBtn = document.getElementById("menu-btn");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".overlay");
  const closeBtn = document.getElementById("close-sidebar");
  const accBtn = document.getElementById("acc_btn");
  const navLinks = document.querySelectorAll(".nav-list-item");

  function toggleSidebar() {
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
    document.body.classList.toggle("sidebar-open");
  }

  function closeSidebar() {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
    document.body.classList.remove("sidebar-open");
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", toggleSidebar);
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeSidebar);
  }

  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }

  if (accBtn) {
    accBtn.addEventListener("click", () => {
      location.href = "/pages/owner/account.html";
    });
  }

  const currentPage = window.location.pathname;

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (currentPage === href || currentPage.endsWith(href.split("/").pop())) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
});
