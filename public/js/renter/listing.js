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

const back = document.getElementById("back-btn");
back.addEventListener("click", () => {
  location.href = "/index.html";
});

// Load Navbar and Footer
document.addEventListener("DOMContentLoaded", function () {
  loadComponent("footer", "/footer.html");
});

let logoLoader = document.querySelector(".loader-img");
if (logoLoader) {
  logoLoader.src = "/assets/logo-md.png";
  console.log("Logo updated:", logoLoader.src);
}
