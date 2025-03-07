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

  const ownerSignUp = document.getElementById("owner_sign_up");
  const renterSignUp = document.getElementById("renter_sign_up");

  if (ownerSignUp && renterSignUp) {
    ownerSignUp.style.display = "none";
    renterSignUp.style.display = "none";

    if (role === "owner") {
      ownerSignUp.style.display = "block";
    } else if (role === "renter") {
      renterSignUp.style.display = "block";
    }
  } else {
    console.error(
      "One or both elements (owner_sign_up / renter_sign_up) not found."
    );
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const owner_btn = document.getElementById("owner_btn");
  const renter_btn = document.getElementById("renter_btn");

  if (owner_btn) {
    owner_btn.addEventListener("click", () => {
      location.href = "auth.html?role=owner";
    });
  } else {
    console.error("owner_btn not found");
  }

  if (renter_btn) {
    renter_btn.addEventListener("click", () => {
      location.href = "auth.html?role=renter";
    });
  } else {
    console.error("renter_btn not found");
  }
});
