const nombre = localStorage.getItem("nombre");
const rol = localStorage.getItem("rol");
const codigo = localStorage.getItem("codigo");

if (!nombre) {
  window.location.href = "login.html";
}

function cerrarSesion() {
  localStorage.clear(); // O puedes usar removeItem("nombre") y demás si prefieres
  window.location.href = "login.html";
}
