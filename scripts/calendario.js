const imagenes = Array.from(document.querySelectorAll(".galeria-horarios img"));
let indiceActual = 0;
let startX = 0, startY = 0;
let currentX = 0, currentY = 0;
let translateX = 0, translateY = 0;
let scale = 1;
let initialDistance = 0;

const visor = document.getElementById("visorImagen");
const grande = document.getElementById("imagenGrande");

function abrirModal(indice) {
  indiceActual = indice;
  actualizarImagen();
  visor.classList.remove("oculto");
  document.body.style.overflow = "hidden";
}

function cerrarModal() {
  visor.classList.add("oculto");
  document.body.style.overflow = "";
}

function actualizarImagen() {
  grande.src = imagenes[indiceActual].src;
  resetTransform();
}

function resetTransform() {
  scale = 1;
  translateX = 0;
  translateY = 0;
  grande.style.transform = "translate(0px, 0px) scale(1)";
}

// ZOOM y PAN táctil
visor.addEventListener("touchstart", e => {
  if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    initialDistance = Math.sqrt(dx * dx + dy * dy);
  } else if (e.touches.length === 1) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    currentX = translateX;
    currentY = translateY;
  }
}, { passive: false });

visor.addEventListener("touchmove", e => {
  if (e.touches.length === 2) {
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);
    const zoomFactor = currentDistance / initialDistance;
    scale = Math.min(Math.max(1, zoomFactor), 3);
    grande.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  } else if (e.touches.length === 1 && scale > 1.05) {
    e.preventDefault();
    const deltaX = e.touches[0].clientX - startX;
    const deltaY = e.touches[0].clientY - startY;
    translateX = currentX + deltaX;
    translateY = currentY + deltaY;
    grande.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }
}, { passive: false });

visor.addEventListener("touchend", e => {
  if (e.changedTouches.length === 1 && scale <= 1.05) {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < -50 && indiceActual < imagenes.length - 1) {
        indiceActual++;
        actualizarImagen();
      } else if (deltaX > 50 && indiceActual > 0) {
        indiceActual--;
        actualizarImagen();
      }
    } else if (deltaY > 80) {
      cerrarModal();
    }
  }
});

// TOQUE lateral
visor.addEventListener("click", e => {
  if (scale > 1.05) return;
  const x = e.clientX;
  const ancho = window.innerWidth;
  if (x > ancho * 0.66 && indiceActual < imagenes.length - 1) {
    indiceActual++;
    actualizarImagen();
  } else if (x < ancho * 0.33 && indiceActual > 0) {
    indiceActual--;
    actualizarImagen();
  } else {
    cerrarModal();
  }
});
