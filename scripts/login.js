const codigoInput = document.getElementById("codigoInput");
const loginBtn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("errorMsg");
const bienvenida = document.getElementById("bienvenida");
const loginSection = document.getElementById("loginSection");
const appContent = document.getElementById("appContent");

let usuarios = {};
let usuariosCargados = false;

// ✅ Cargar usuarios con claves como strings
db.ref("empleados").once("value", (snap) => {
  const data = snap.val();
  if (!data) return;
  Object.entries(data).forEach(([codigo, nombre]) => {
    usuarios[String(codigo)] = nombre;
  });
  usuariosCargados = true;
});


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
  if (!usuariosCargados) {
    errorMsg.textContent = "⏳ Cargando empleados, intenta en unos segundos...";
    return;
  }

  const codigo = codigoInput.value.trim();
  if (!usuarios[codigo]) {
    errorMsg.textContent = "❌ Código no válido o no asignado.";
    return;
  }

  const nombre = usuarios[codigo];
  const rol = codigo === "1306" ? "jefa" : "empleado";

  // Guardar sesión
  localStorage.setItem("nombre", nombre);
  localStorage.setItem("rol", rol);
  localStorage.setItem("codigo", codigo);

  // Ocultar login
  loginSection.style.display = "none";

  // Mostrar bienvenida
  const mensaje = mensajesPersonalizados[nombre] || `¡Bienvenido, ${nombre.toUpperCase()}!`;
  bienvenida.textContent = mensaje;
  bienvenida.classList.remove("oculto");

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

window.addEventListener("DOMContentLoaded", () => {
  const nombre = localStorage.getItem("nombre");
  if (nombre) {
    loginSection.style.display = "none";
    appContent.classList.remove("blur");
    appContent.style.pointerEvents = "auto";
  }
});
