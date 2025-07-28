document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector("nav.sidebar");
  if (!navbar) return;

  let ultimoScroll = 0;

  // Ocultar si rotas el móvil (modo horizontal)
  function verificarOrientacion() {
    const ancho = window.innerWidth;
    const alto = window.innerHeight;

    if (ancho > alto) {
      // Pantalla apaisada → ocultar navbar
      navbar.style.transform = "translateY(-100%)";
    } else {
      // Pantalla vertical → mostrar navbar
      navbar.style.transform = "translateY(0)";
    }
  }

  window.addEventListener("resize", verificarOrientacion);
  verificarOrientacion(); // Al cargar

  // Ocultar con scroll hacia abajo
  window.addEventListener("scroll", () => {
    const scrollActual = window.scrollY;
    if (scrollActual > ultimoScroll && scrollActual > 50) {
      navbar.style.transform = "translateY(-100%)";
    } else {
      navbar.style.transform = "translateY(0)";
    }
    ultimoScroll = scrollActual;
  });
});
