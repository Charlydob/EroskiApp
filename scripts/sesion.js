function cerrarSesion() {
  localStorage.clear();
  window.location.href = "login.html";
}
window.addEventListener("DOMContentLoaded", () => {
  db.ref("empleados").once("value", (snap) => {
    const datos = snap.val();
    if (datos) {
      empleados.length = 0; // limpiar
      for (let codigo in datos) {
        empleados.push(datos[codigo]);
      }
      localStorage.setItem("empleados", JSON.stringify(empleados));
    }

    cargarSelectorEmpleado?.();
    renderizarTabla?.();
  });
});
