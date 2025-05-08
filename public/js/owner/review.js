// Loader
setTimeout(() => {
  const loader = document.querySelector(".loader");
  const main = document.getElementById("main");

  if (loader && main) {
    loader.style.opacity = "0";
    loader.style.transition = "opacity 0.8s ease-out";

    setTimeout(() => {
      loader.style.display = "none";
      main.style.display = "block"; // Ensure it's visible first!

      setTimeout(() => {
        main.style.opacity = "1";
        main.style.transition = "opacity 0.8s ease-in";
      }, 100);
    }, 800);
  }
}, 3000);

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
  let closeSidebarBtn = document.getElementById("close-sidebar");

  // Menu button toggle
  if (menuBtn) {
    console.log("Menu button found! Adding event listener.");
    menuBtn.addEventListener("click", () => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        sidebar.classList.toggle("active");
        // Optionally, add an overlay if sidebar is active
        document.querySelector(".overlay").classList.toggle("active");
        // Prevent page scroll when sidebar is open
        document.body.classList.toggle("sidebar-open");
      }
    });
  } else {
    console.error("Menu button not found.");
  }

  // Close sidebar button functionality
  if (closeSidebarBtn) {
    console.log("Close sidebar button found! Adding event listener.");
    closeSidebarBtn.addEventListener("click", () => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        sidebar.classList.remove("active");
        // Optionally remove the overlay when sidebar is closed
        document.querySelector(".overlay").classList.remove("active");
        // Allow page scrolling when sidebar is closed
        document.body.classList.remove("sidebar-open");
      }
    });
  } else {
    console.error("Close sidebar button not found.");
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
    logo.src = new URL("/assets/logo-md.png", window.location.origin).href;
    console.log("Logo updated:", logo.src);
  }

  let logoLoader = document.querySelector(".loader-img");
  if (logoLoader) {
    logoLoader.src = new URL(
      "/assets/logo-md.png",
      window.location.origin
    ).href;
    console.log("Logo updated:", logoLoader.src);
  }
}

const create = document.getElementById("create_btn");
if (create) {
  // Ensure the element exists before adding an event listener
  create.addEventListener("click", () => {
    location.href = "/pages/owner/create_listing.html";
  });
} else {
  console.error("Element #create_btn not found.");
}
