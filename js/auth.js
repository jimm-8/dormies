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
    location.href = "/dormies/";
  });
} else {
  console.error("Element #reg_logo not found in the DOM.");
}
