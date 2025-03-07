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

const reg_logo = document.getElementById("reg_logo");
if (reg_logo) {
  reg_logo.addEventListener("click", () => {
    location.href = "index.html";
  });
} else {
  console.error("Element #reg_logo not found in the DOM.");
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const role = params.get("role");

  const ownerSignIn = document.getElementById("owner_sign_in");
  const renterSignIn = document.getElementById("renter_sign_up");

  if (!ownerSignIn && !renterSignIn) {
    console.error(
      "Both elements (owner_sign_in & renter_sign_up) are missing."
    );
    return;
  }

  if (ownerSignIn) ownerSignIn.style.display = "none";
  if (renterSignIn) renterSignIn.style.display = "none";

  if (role === "owner" && ownerSignIn) {
    ownerSignIn.style.display = "block";
  } else if (role === "renter" && renterSignIn) {
    renterSignIn.style.display = "block";
  }
});
