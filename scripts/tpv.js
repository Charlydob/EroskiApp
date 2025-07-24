// 1. Datos globales y helpers
let codigosData = {};
let codigoEditando = null;

function generarId() {
  return 'id-' + Date.now();
}

console.log("✅ Sistema de códigos iniciado");
window.codigosData = codigosData;
window.generarId = generarId;


// 2. Renderizado principal de tarjetas
function renderizarCodigos() {
  const galeria = document.getElementById("galeria");
  galeria.innerHTML = "";

  const filtroTexto = document.getElementById("buscador")?.value.toLowerCase() || "";
  const filtroCategoria = document.getElementById("filtro-categoria")?.value || "";

  const codigosFiltrados = Object.entries(codigosData).filter(([id, cod]) => {
    const coincideTexto = cod.nombre.toLowerCase().includes(filtroTexto) || cod.balanza?.includes(filtroTexto);
    const coincideCategoria = !filtroCategoria || cod.categoria === filtroCategoria;
    return coincideTexto && coincideCategoria;
  });

  codigosFiltrados.forEach(([id, cod]) => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-producto";
    tarjeta.innerHTML = `
      <div class="info">
        <h4>${cod.nombre}</h4>
        <p>Código: ${cod.balanza}</p>
      </div>
      <button class="btn-editar oculto" onclick="abrirModalEdicion('${id}')">✏️</button>
    `;

    let longPressTimeout;
    let longPressActivado = false;

    tarjeta.addEventListener("mousedown", () => {
      longPressActivado = false;
      longPressTimeout = setTimeout(() => {
        longPressActivado = true;
        tarjeta.querySelector(".btn-editar").classList.remove("oculto");
      }, 600);
    });

    tarjeta.addEventListener("mouseup", () => clearTimeout(longPressTimeout));
    tarjeta.addEventListener("mouseleave", () => clearTimeout(longPressTimeout));

    tarjeta.addEventListener("touchstart", () => {
      longPressActivado = false;
      longPressTimeout = setTimeout(() => {
        longPressActivado = true;
        tarjeta.querySelector(".btn-editar").classList.remove("oculto");
      }, 600);
    });

    tarjeta.addEventListener("touchend", () => clearTimeout(longPressTimeout));

    tarjeta.addEventListener("click", (e) => {
      if (longPressActivado) return;
      if (e.target.closest(".btn-editar")) return;
      mostrarDetalleCodigo(cod);
    });

    galeria.appendChild(tarjeta);
  });
}


window.renderizarCodigos = renderizarCodigos;


// 3. Filtros

document.getElementById("buscador").addEventListener("input", renderizarCodigos);
document.getElementById("filtro-categoria").addEventListener("change", renderizarCodigos);
document.getElementById("btn-nuevo").addEventListener("click", () => abrirModalEdicion());


// 4. Modal edición adaptado al nuevo HTML
function abrirModalEdicion(id = null) {
  const modal = document.getElementById("modal-edicion");
  modal.classList.remove("oculto");
  codigoEditando = id;

  if (id) {
    const cod = codigosData[id];
    document.getElementById("edit-nombre").value = cod.nombre || "";
    document.getElementById("edit-balanza").value = cod.balanza || "";
    document.getElementById("edit-merma").value = cod.merma || "";
    document.getElementById("edit-cat").value = cod.categoria || "";
    document.getElementById("edit-detalles").value = cod.detalles || "";
    console.log("✏️ Editando código:", id);
  } else {
    document.getElementById("edit-nombre").value = "";
    document.getElementById("edit-balanza").value = "";
    document.getElementById("edit-merma").value = "";
    document.getElementById("edit-cat").value = "";
    document.getElementById("edit-detalles").value = "";
    console.log("➕ Creando nuevo código");
  }
}

function cerrarModalEdicion() {
  document.getElementById("modal-edicion").classList.add("oculto");
  codigoEditando = null;
  console.log("❌ Modal cerrado");
}

window.abrirModalEdicion = abrirModalEdicion;
window.cerrarModalEdicion = cerrarModalEdicion;


// 5. Guardar código adaptado
function guardarCodigo() {
  const nombre = document.getElementById("edit-nombre").value.trim();
  const balanza = document.getElementById("edit-balanza").value.trim();
  const merma = document.getElementById("edit-merma").value.trim();
  const categoria = document.getElementById("edit-cat").value;
  const detalles = document.getElementById("edit-detalles").value.trim();

  if (!nombre || !categoria) {
    alert("⚠️ Faltan campos obligatorios");
    return;
  }

  const nuevoDato = {
    nombre,
    balanza,
    merma,
    categoria,
    detalles,
    visible: true
  };

  const id = codigoEditando || generarId();

  firebase.database().ref(`codigos/charlyylaura/${id}`).set(nuevoDato)
    .then(() => {
      codigosData[id] = nuevoDato;
      cerrarModalEdicion();
      renderizarCodigos();
      console.log("✅ Código guardado:", id);
    });
}

window.guardarCodigo = guardarCodigo;
document.getElementById("guardar-edicion").addEventListener("click", guardarCodigo);


function cerrarModalEdicion() {
  document.getElementById("modal-edicion").classList.add("oculto");
  codigoEditando = null;
}

window.abrirModalEdicion = abrirModalEdicion;
window.cerrarModalEdicion = cerrarModalEdicion;


// 5. Guardar código
function guardarCodigo() {
  const nombre = document.getElementById("edit-nombre").value.trim();
  const balanza = document.getElementById("edit-balanza").value.trim();
  const merma = document.getElementById("edit-merma").value.trim();
  const categoria = document.getElementById("edit-cat").value;
  const detalles = document.getElementById("edit-detalles").value.trim();

  if (!nombre || !categoria) {
    alert("⚠️ Faltan campos obligatorios");
    return;
  }

  const nuevoDato = { nombre, balanza, merma, categoria, detalles, visible: true };
  const id = codigoEditando || generarId();

  firebase.database().ref(`codigos/charlyEroski/${id}`).set(nuevoDato)
    .then(() => {
      codigosData[id] = nuevoDato;
      cerrarModalEdicion();
      renderizarCodigos();
    });
}

window.guardarCodigo = guardarCodigo;
document.getElementById("guardar-edicion").addEventListener("click", guardarCodigo);


// 6. Eliminar

document.getElementById("btn-eliminar").addEventListener("click", () => {
  if (!codigoEditando) return;

  firebase.database().ref(`codigos/charlyEroski/${codigoEditando}`).remove()
    .then(() => {
      delete codigosData[codigoEditando];
      cerrarModalEdicion();
      renderizarCodigos();
    });
});


// 7. Firebase carga inicial
function cargarCodigosDesdeFirebase() {
  firebase.database().ref("codigos/charlyEroski").once("value", snapshot => {
    codigosData = snapshot.val() || {};
    renderizarCodigos();
  });
}
window.onload = cargarCodigosDesdeFirebase;


// 8. Modal detalle
function mostrarDetalleCodigo(cod) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-contenido">
      <h3>${cod.nombre}</h3>
      <p><strong>Código ordenador:</strong> ${cod.balanza || "-"}</p>
      <p><strong>Código pistola:</strong> ${cod.merma || "-"}</p>
      <p><strong>Notas:</strong> ${cod.detalles || "(Sin notas)"}</p>
      <div class="acciones">
        <button onclick="this.closest('.modal').remove()">❌ Cerrar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}
