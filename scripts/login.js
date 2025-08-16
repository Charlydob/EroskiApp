const codigoInput = document.getElementById("codigoInput");
const loginBtn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("errorMsg");
const bienvenida = document.getElementById("bienvenida");
const loginSection = document.getElementById("loginSection");
const appContent = document.getElementById("appContent");

let usuarios = null;

// Carga usuarios y habilita login
async function cargarUsuarios() {
  try {
    const snap = await db.ref("empleados").once("value");
    usuarios = snap.val() || {};
    window.usuarios = usuarios;
    loginBtn.disabled = false;
    console.log("Usuarios cargados:", usuarios);
  } catch (e) {
    console.error("No se pudieron cargar usuarios:", e);
    errorMsg.textContent = "⚠️ Error cargando usuarios. Reintenta.";
  }
}

// Mensajes
const mensajesPersonalizados = {
  "Charly": "Hola Yo",
  "Bryant": "¿Aún trabajas aquí pordiosero?",
  "Leti": "Sea usted muy bienvenida Doña Leticia ",
  "Lorena": "¡Bienvenida Jefa🫡!",
  "Rocío": "Rocio deja el movil. 🤔",
  "Juan": "¿Cuantas copas tenés?",
  "Jefa": "Bienvenida Jefa🫡",
};

loginBtn.disabled = true;
cargarUsuarios();

loginBtn.addEventListener("click", async () => {
  errorMsg.textContent = "";

  if (!usuarios) await cargarUsuarios();

  const codigoStr = String(codigoInput.value.trim());
  if (!codigoStr) { errorMsg.textContent = "❌ Introduce tu código."; return; }

  if (!usuarios[codigoStr]) {
    errorMsg.textContent = "❌ Código no válido o no asignado.";
    return;
  }

  const nombre = usuarios[codigoStr];
  const rol = (codigoStr === "1306") ? "jefa" : "empleado";

  // Sesión
  localStorage.setItem("nombre", nombre);
  localStorage.setItem("rol", rol);
  localStorage.setItem("codigo", codigoStr);

  // Bienvenida
  loginSection.style.display = "none";
  const mensaje = mensajesPersonalizados[nombre] || `¡Bienvenid@, ${nombre.toUpperCase()}!`;
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
