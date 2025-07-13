const codigoInput = document.getElementById("codigoInput");
const loginBtn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("errorMsg");
const bienvenida = document.getElementById("bienvenida");
const loginSection = document.getElementById("loginSection");
const appContent = document.getElementById("appContent");

const usuarios = {
  1: "Bryant",
  2: "Charly",
  6: "Leti",
  7: "Lorena",
  8: "Rocío",
  10: "Juan",
  1306: "Jefa"
};
const mensajesPersonalizados = {
  "Charly": "Hola Yo",
  "Bryant": "¿Aún trabajas aquí pordiosero?",
  "Leti": "Sea usted muy bienvenida Doña Leticia ",
  "Lorena": "",
  "Rocío": "Rocio deja el movil. 🤔",
  "Juan": "¿Cuantas copas tenés?",
  "Jefa": "Bienvenida Jefa🫡",
};

loginBtn.addEventListener("click", () => {
  const codigo = parseInt(codigoInput.value.trim());

  if (!usuarios[codigo]) {
    errorMsg.textContent = "❌ Código no válido o no asignado.";
    return;
  }

  const nombre = usuarios[codigo];
  const rol = codigo === 1306 ? "jefa" : "empleado";

  // Guardar sesión
  localStorage.setItem("nombre", nombre);
  localStorage.setItem("rol", rol);
  localStorage.setItem("codigo", codigo);

  // Paso 1: Oculta login
  loginSection.style.display = "none";

  // Paso 2: Muestra bienvenida
const mensaje = mensajesPersonalizados[nombre] || `¡Bienvenido, ${nombre.toUpperCase()}!`;
bienvenida.textContent = mensaje;

  bienvenida.classList.remove("oculto");

  // Paso 3: Espera 2s y luego oculta bienvenida + quita blur
  setTimeout(() => {
    bienvenida.classList.add("oculto");
    appContent.classList.remove("blur");
    appContent.style.pointerEvents = "auto";
  }, 2000);
});

codigoInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") loginBtn.click();
});

function cerrarSesion() {
  localStorage.clear();
  location.reload();
}

// Autologin si ya hay sesión
window.addEventListener("DOMContentLoaded", () => {
  const nombre = localStorage.getItem("nombre");
  if (nombre) {
    loginSection.style.display = "none";
    appContent.classList.remove("blur");
    appContent.style.pointerEvents = "auto";
  }
});
