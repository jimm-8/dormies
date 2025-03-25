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
    menuButton.style.visibility = "none";
  }

  const imgBtn = document.getElementById("nav_logo");
  if (imgBtn) {
    imgBtn.addEventListener("click", () => {
      location.href = "/dormies/pages/renter/home.html";
    });
  }
}

// Load Navbar and Footer
document.addEventListener("DOMContentLoaded", function () {
  loadComponent("navbar", "/dormies/pages/navbar.html", initNavbarEvents);
  loadComponent("footer", "/dormies/pages/footer.html");
});

let logoLoader = document.querySelector(".loader-img");
if (logoLoader) {
  logoLoader.src = "/dormies/assets/logo-md.png";
  console.log("Logo updated:", logoLoader.src);
}

const back = document.getElementById("back-btn");
back.addEventListener("click", () => {
  location.href = "/dormies/pages/renter/home.html";
});

function generateAvatar(name) {
  console.log("Generating avatar for:", name);

  const avatar = document.getElementById("avatar"); // Ensure we get the element inside the function

  if (!avatar) {
    console.error("Avatar element not found!");
    return;
  }

  if (!name || name.trim() === "") {
    console.warn("No name provided for avatar generation!");
    avatar.textContent = "?";
    return;
  }

  // If an image is already uploaded, do not overwrite it with initials
  if (avatar.style.backgroundImage && avatar.style.backgroundImage !== "none") {
    console.log("Avatar has an image, skipping initials.");
    return;
  }

  // Extract initials (first letters of first & last name)
  const words = name.trim().split(" ");
  const initials =
    words.length > 1
      ? words[0].charAt(0).toUpperCase() + words[1]?.charAt(0)?.toUpperCase()
      : words[0].charAt(0).toUpperCase();

  console.log("Generated initials:", initials);

  // Generate a random color
  const randomColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;

  // Update avatar element
  avatar.textContent = initials;
  avatar.style.backgroundColor = randomColor;
  avatar.style.color = "#fff"; // Ensure text is visible
  console.log("Avatar updated with color:", randomColor);
}

// Ensure initials return if the image is removed
document.addEventListener("DOMContentLoaded", () => {
  const avatar = document.getElementById("avatar");
  if (avatar) {
    avatar.addEventListener("dblclick", () => {
      avatar.style.backgroundImage = "none";
      generateAvatar("User Name"); // Replace "User Name" with the actual name
    });
  } else {
    console.error("Avatar element not found on page load!");
  }
});

// Attach function to window so it's globally accessible
window.generateAvatar = generateAvatar;

const avatar = document.getElementById("avatar");
const imageModal = document.getElementById("imageModal");
const closeModal = document.querySelector(".close");
const imageUpload = document.getElementById("imageUpload");
const previewCanvas = document.getElementById("previewCanvas");
const saveImageBtn = document.getElementById("saveImage");

let croppedImageData = "";

// Open modal when avatar is clicked
avatar.addEventListener("click", () => {
  imageModal.style.display = "flex"; // Show modal
  setTimeout(() => {
    imageModal.classList.add("show");
  }, 10); // Small delay ensures transition works
});

closeModal.addEventListener("click", () => {
  imageModal.classList.remove("show");
  setTimeout(() => {
    imageModal.style.display = "none"; // Hide completely after transition
  }, 300); // Match transition time
});

// Image upload and cropping logic
imageUpload.addEventListener("change", function (event) {
  const file = event.target.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result;

      img.onload = function () {
        const canvas = previewCanvas;
        const ctx = canvas.getContext("2d");

        // Set canvas size for cropping (square)
        const size = Math.min(img.width, img.height);
        canvas.width = 150;
        canvas.height = 150;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          img,
          (img.width - size) / 2, // Crop from center
          (img.height - size) / 2,
          size,
          size,
          0,
          0,
          150,
          150
        );

        // Save cropped image data
        croppedImageData = canvas.toDataURL("image/png");
      };
    };

    reader.readAsDataURL(file);
  }
});

// Save cropped image as avatar background
saveImageBtn.addEventListener("click", () => {
  if (croppedImageData) {
    avatar.style.backgroundImage = `url(${croppedImageData})`;
    avatar.textContent = ""; // Remove initials when an image is uploaded
    imageModal.classList.remove("show"); // Close modal
  }
});
