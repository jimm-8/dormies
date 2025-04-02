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
  
  // Modal Functionality
  const modal = document.getElementById("modal");
  const addListingBtn = document.getElementById("add-listing-btn");
  const subListingBox = document.getElementById("sub-listing-box");
  const closeModal = document.getElementById("close-modal");
  
  // Open modal
  addListingBtn.addEventListener("click", () => {
    modal.style.display = "block";
  });
  
  subListingBox.addEventListener("click", () => {
    modal.style.display = "block";
  });
  
  // Close modal
  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
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
  
  // Floor Area Controls
  const floorAreaInput = document.getElementById("floor-area");
  document.getElementById("increase-area").addEventListener("click", () => {
    floorAreaInput.value = parseInt(floorAreaInput.value) + 1;
  });
  
  document.getElementById("decrease-area").addEventListener("click", () => {
    if (floorAreaInput.value > 1) {
        floorAreaInput.value = parseInt(floorAreaInput.value) - 1;
    }
  });
  
  // "I Don't Know Floor Area" Checkbox
  document.getElementById("unknown-area").addEventListener("change", (event) => {
    floorAreaInput.disabled = event.target.checked;
  });
  
  // Save Button (Placeholder Alert)
  document.getElementById("save-listing-btn").addEventListener("click", () => {
    alert("Sub-listing details saved!");
    document.getElementById("modal").style.display = "none";
  });
  