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
    const coincideTexto = cod.nombre.toLowerCase().includes(filtroTexto) || cod.balanza.includes(filtroTexto);
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

    // 👇 Lógica de pulsación larga
    let longPressTimeout;

    tarjeta.addEventListener("mousedown", () => {
      longPressTimeout = setTimeout(() => {
        const btnEditar = tarjeta.querySelector(".btn-editar");
        btnEditar.classList.remove("oculto");
        console.log("🕒 Pulsación larga detectada");
      }, 600); // tiempo de espera en ms
    });

    tarjeta.addEventListener("mouseup", () => clearTimeout(longPressTimeout));
    tarjeta.addEventListener("mouseleave", () => clearTimeout(longPressTimeout));
    tarjeta.addEventListener("touchstart", () => {
      longPressTimeout = setTimeout(() => {
        const btnEditar = tarjeta.querySelector(".btn-editar");
        btnEditar.classList.remove("oculto");
        console.log("📱 Pulsación larga móvil detectada");
      }, 600);
    });
    tarjeta.addEventListener("touchend", () => clearTimeout(longPressTimeout));

    galeria.appendChild(tarjeta);
  });

  console.log(`🎨 Renderizando ${codigosFiltrados.length} códigos`);
}


window.renderizarCodigos = renderizarCodigos;


// 3. Filtros en tiempo real
document.getElementById("buscador").addEventListener("input", renderizarCodigos);
document.getElementById("filtro-categoria").addEventListener("change", renderizarCodigos);
document.getElementById("btn-nuevo").addEventListener("click", () => abrirModalEdicion());


// 4. Abrir y cerrar modal
function abrirModalEdicion(id = null) {
  const modal = document.getElementById("modal-edicion");
  modal.classList.remove("oculto");
  codigoEditando = id;

  if (id) {
    const cod = codigosData[id];
    document.getElementById("edit-nombre").value = cod.nombre;
    document.getElementById("edit-balanza").value = cod.balanza;
    document.getElementById("edit-merma").value = cod.merma;
    document.getElementById("edit-ref").value = cod.referencia;
    document.getElementById("edit-cat").value = cod.categoria;
    console.log("✏️ Editando código:", id);
  } else {
    document.getElementById("edit-nombre").value = "";
    document.getElementById("edit-balanza").value = "";
    document.getElementById("edit-merma").value = "";
    document.getElementById("edit-ref").value = "";
    document.getElementById("edit-cat").value = "";
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
// 5. Guardar código (crear o editar)
function guardarCodigo() {
  const nombre = document.getElementById("edit-nombre").value.trim();
  const balanza = document.getElementById("edit-balanza").value.trim();
  const categoria = document.getElementById("edit-cat").value;

  if (!nombre || !balanza || !categoria) {
    alert("⚠️ Faltan campos obligatorios");
    return;
  }

  const nuevoDato = { nombre, balanza, categoria, visible: true };
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


// 6. Eliminar código
document.getElementById("btn-eliminar").addEventListener("click", () => {
  if (!codigoEditando) return;

  const confirmacion = confirm("¿Eliminar este código definitivamente?");
  if (!confirmacion) return;

  firebase.database().ref(`codigos/charlyylaura/${codigoEditando}`).remove()
    .then(() => {
      delete codigosData[codigoEditando];
      cerrarModalEdicion();
      renderizarCodigos();
      console.log("🗑️ Código eliminado:", codigoEditando);
    });
});


// 7. Cargar desde Firebase (inicio)
function cargarCodigosDesdeFirebase() {
  firebase.database().ref("codigos/charlyylaura").once("value", snapshot => {
    codigosData = snapshot.val() || {};
    renderizarCodigos();
    console.log("📡 Códigos cargados desde Firebase");
  });
}
window.onload = cargarCodigosDesdeFirebase;


// 8. Alternar visibilidad
function toggleVisible() {
  if (!codigoEditando) return;
  const actual = codigosData[codigoEditando];
  const nuevoEstado = !actual.visible;

  firebase.database().ref(`codigos/charlyylaura/${codigoEditando}/visible`).set(nuevoEstado)
    .then(() => {
      codigosData[codigoEditando].visible = nuevoEstado;
      renderizarCodigos();
      console.log(`🔁 Visibilidad de '${codigoEditando}' cambiada a`, nuevoEstado);
    });
}
window.toggleVisible = toggleVisible;
document.getElementById("toggle-visible").addEventListener("click", toggleVisible);
