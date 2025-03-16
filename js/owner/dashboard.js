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
  fetch("/dormies/pages/owner.html")
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
      location.href = "/dormies/pages/owner/account.html";
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
    logo.src = "/dormies/assets/logo-md.png";
    console.log("Logo updated:", logo.src);
  }

  let logoLoader = document.querySelector(".loader-img");
  if (logoLoader) {
    logoLoader.src = "/dormies/assets/logo-md.png";
    console.log("Logo updated:", logoLoader.src);
  }
}

const create = document.getElementById("create_btn");
  if (create) { // Ensure the element exists before adding an event listener
      create.addEventListener("click", () => {
          location.href = "/dormies/pages/owner/create_listing.html";
      });
  } else {
      console.error("Element #create_btn not found.");
  }
