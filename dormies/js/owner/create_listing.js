// Loader
setTimeout(() => {
    const loader = document.querySelector(".loader");
    const main = document.getElementById("main");
  
    loader.style.opacity = "0";
    loader.style.transition = "opacity 0.8s ease-out";
  
    setTimeout(() => {
        loader.style.display = "none";
        main.style.display = "block";
        main.style.opacity = "1";
        main.style.transition = "opacity 0.8s ease-in";
    }, 800);
  }, 3000);
  
  // Back Button
  const back = document.getElementById("back-btn");
  back.addEventListener("click", () => {
    location.href = "/dormies/pages/owner/dashboard.html";
  });
  
  // Save button (can be extended)
  document.getElementById("save-listing-btn").addEventListener("click", () => {
    alert("Sub-listing details saved!");
    modal.style.display = "none";
  });
  
  // Show Modal
  document.getElementById("add-listing-btn").addEventListener("click", () => {
    document.getElementById("modal").style.display = "block";
  });
  
  // Hide Modal
  document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("modal").style.display = "none";
  });
  
  // Tab Switching
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
  
        tab.classList.add("active");
        document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });
  
  // Save Button (Placeholder Alert)
  document.getElementById("save-listing-btn").addEventListener("click", () => {
    alert("Sub-listing details saved!");
    document.getElementById("modal").style.display = "none";
  });

  function previewImages(event) {
    const files = event.target.files;
    const preview = document.getElementById("image-preview");
    const previewImage = document.getElementById("preview-image");
    preview.innerHTML = ""; // Clear previous images
  
    // Loop through the selected files and display them
    Array.from(files).forEach(file => {
      const reader = new FileReader();
  
      reader.onload = function (e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        preview.appendChild(img);

        // If this is the first image, also set it to the preview image in the right section
        if (index === 0) {
          previewImage.src = e.target.result;  // Update the preview image on the right section
        }        
      };
  
      reader.readAsDataURL(file); // Convert the file to a data URL
    });
  }