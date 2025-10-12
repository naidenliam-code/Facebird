// nav.js — Navigation commune FaceBird 🐦
// Gère la barre de navigation et le mode sombre

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("site-nav");

  if (!nav) return;

  // Définition des liens du menu principal
  const links = [
    { name: "Accueil", href: "index.html" },
    { name: "Fil", href: "feed.html" },
    { name: "Observations", href: "observations.html" },
    { name: "Quiz", href: "quiz.html" },
    { name: "Profil", href: "profil.html" },
    { name: "Carte", href: "map.html" },
  ];

  // Crée le HTML du menu
  const current = location.pathname.split("/").pop() || "index.html";
  const items = links
    .map(
      (l) => `
      <a href="${l.href}" class="${
        current === l.href ? "active" : ""
      }">${l.name}</a>`
    )
    .join("");

  nav.innerHTML = `
    <div class="nav-inner">
      <div class="nav-left">
        <a href="index.html" class="brand">🐦 FaceBird</a>
        <div class="links">${items}</div>
      </div>
      <div class="nav-right">
        <button id="theme-toggle" class="theme-btn" title="Changer le thème">🌙 Mode sombre</button>
      </div>
    </div>
  `;

  // Active/désactive le mode sombre
  const themeBtn = document.getElementById("theme-toggle");
  const root = document.documentElement;

  function setTheme(mode) {
    if (mode === "dark") {
      root.classList.add("dark");
      themeBtn.textContent = "☀️ Mode clair";
    } else {
      root.classList.remove("dark");
      themeBtn.textContent = "🌙 Mode sombre";
    }
    localStorage.setItem("fb-theme", mode);
  }

  // Appliquer le thème sauvegardé
  const savedTheme = localStorage.getItem("fb-theme");
  if (savedTheme === "dark") setTheme("dark");
  else setTheme("light");

  // Gestion du clic sur le bouton
  themeBtn.addEventListener("click", () => {
    const currentTheme = root.classList.contains("dark") ? "dark" : "light";
    setTheme(currentTheme === "dark" ? "light" : "dark");
  });
});
