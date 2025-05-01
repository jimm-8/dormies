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

const owner_btn = document.getElementById("owner_btn");
const renter_btn = document.getElementById("renter_btn");

owner_btn.addEventListener("click", () => {
  window.location.href = "/create/owner_acc.html";
});

renter_btn.addEventListener("click", () => {
  window.location.href = "/create/renter_acc.html";
});
