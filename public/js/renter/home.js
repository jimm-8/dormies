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

// Function to load external HTML files
function loadComponent(elementId, filePath, callback) {
  fetch(filePath)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById(elementId).innerHTML = data;
      if (callback) callback();
    })
    .catch((error) => console.error(`Error loading ${filePath}:`, error));
}

function initNavbarEvents() {
  const menuButton = document.getElementById("acc_btn");
  if (menuButton) {
    menuButton.addEventListener("click", function () {
      location.href = "/landing.html";
    });
  }

  const imgBtn = document.getElementById("nav_logo");
  if (imgBtn) {
    imgBtn.addEventListener("click", () => {
      location.href = "/index.html";
    });
  }
}

// Load Navbar and Footer
document.addEventListener("DOMContentLoaded", function () {
  loadComponent("navbar", "/navbar.html", initNavbarEvents);
  loadComponent("footer", "/footer.html");
});

let logoLoader = document.querySelector(".loader-img");
if (logoLoader) {
  logoLoader.src = "/assets/logo-md.png";
  console.log("Logo updated:", logoLoader.src);
}
