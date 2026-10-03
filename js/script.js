const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector("nav ul");

menuToggle.addEventListener("click", function () {
    navMenu.classList.toggle("open");
    menuToggle.textContent = navMenu.classList.contains("open") ? "✕" : "☰";
});