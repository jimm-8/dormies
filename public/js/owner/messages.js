document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM Loaded. Fetching sidebar...");

  // Load sidebar and navbar dynamically
  fetch("/pages/owner.html")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load sidebar. Status: " + response.status);
      }
      return response.text();
    })
    .then((data) => {
      let sidebarContainer = document.getElementById("sidebar-container");

      if (!sidebarContainer) {
        console.error("Error: #sidebar-container not found!");
        return;
      }

      sidebarContainer.innerHTML = data;

      // Run initialization AFTER inserting sidebar
      initializeSidebar();
    })
    .catch((error) => console.error("Error loading sidebar:", error));
});

function initializeSidebar() {
  console.log("Sidebar Loaded! Running initialization...");

  let menuBtn = document.getElementById("menu-btn");
  let accBtn = document.getElementById("acc_btn");

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const navList = document.getElementById("nav-list");
      if (navList) {
        navList.classList.toggle("active");
      }
    });
  }

  if (accBtn) {
    accBtn.addEventListener("click", () => {
      location.href = "/pages/owner/account.html";
    });
  }

  // Highlight active sidebar link
  let currentPage = window.location.pathname.split("/").pop();
  document.querySelectorAll(".nav-list-item").forEach((link) => {
    if (link.getAttribute("href").includes(currentPage)) {
      link.classList.add("active");
    }
  });

  // Fix logo path dynamically
  let logo = document.querySelector(".side-logo");
  if (logo) {
    logo.src = "/assets/logo-md.png";
    console.log("Logo updated:", logo.src);
  }

  let logoLoader = document.querySelector(".loader-img");
  if (logoLoader) {
    logoLoader.src = "/assets/logo-md.png";
    console.log("Logo updated:", logoLoader.src);
  }
}
