const dbRef = db.ref("productos/eroski");
let productos = {};
let mostrarOcultos = false;

document.addEventListener("DOMContentLoaded", () => {
  cargarProductos();
  document.getElementById("btn-nuevo").addEventListener("click", mostrarModalNuevo);
  document.getElementById("toggle-ocultos").addEventListener("click", () => {
    mostrarOcultos = !mostrarOcultos;
    cargarProductos();
  });
  document.getElementById("filtro-categoria").addEventListener("change", cargarProductos);
  document.getElementById("buscador").addEventListener("input", cargarProductos);
});

function cargarProductos() {
  dbRef.once("value")
    .then(snapshot => {
      productos = snapshot.val() || {};
      renderizarProductos();
    })
    .catch(err => console.error("❌ Error al cargar productos:", err));
}

function renderizarProductos() {
  const galeria = document.getElementById("galeria");
  galeria.innerHTML = "";

  const filtro = document.getElementById("filtro-categoria").value.toLowerCase();
  const busqueda = document.getElementById("buscador").value.toLowerCase();

  Object.entries(productos).forEach(([id, prod]) => {
    if (!mostrarOcultos && prod.oculto) return;
    if (filtro && prod.categoria?.toLowerCase() !== filtro) return;
    if (busqueda && !prod.nombre?.toLowerCase().includes(busqueda)) return;

    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-producto";
    tarjeta.dataset.id = id;
    if (prod.oculto) tarjeta.classList.add("oculto");

    tarjeta.innerHTML = `
      <div class="vista-simple">
        <img src="${prod.img || ''}" alt="Imagen del producto" />
        <h4>${prod.nombre || 'Sin nombre'}</h4>
        <p>${prod.balanza || '-'}</p>
        <button class="btn-editar oculto">✏️</button>
      </div>
      <div class="vista-detalles oculto">
        <p><strong>Merma:</strong> ${prod.merma || '-'}</p>
        <p><strong>Ref:</strong> ${prod.ref || '-'}</p>
        <p><strong>Cat:</strong> ${prod.categoria || '-'}</p>
        <span class="cerrar-detalle">✖</span>
      </div>
    `;

    // Mostrar edición en long press
    let longPressTimeout;
    tarjeta.addEventListener("mousedown", () => {
      longPressTimeout = setTimeout(() => {
        const btn = tarjeta.querySelector(".btn-editar");
        btn.classList.remove("oculto");
      }, 500);
    });
    tarjeta.addEventListener("mouseup", () => clearTimeout(longPressTimeout));
    tarjeta.addEventListener("mouseleave", () => clearTimeout(longPressTimeout));

   // Alternar entre vista simple y detalles con clic corto
tarjeta.addEventListener("click", () => {
  const detalle = tarjeta.querySelector(".vista-detalles");
  detalle.classList.toggle("oculto");
});


    // Cerrar detalles
    tarjeta.querySelector(".cerrar-detalle").addEventListener("click", (e) => {
      e.stopPropagation();
      tarjeta.querySelector(".vista-detalles").classList.add("oculto");
    });

    // Editar producto
    tarjeta.querySelector(".btn-editar").addEventListener("click", (e) => {
      e.stopPropagation();
      editarProducto(id);
    });

    galeria.appendChild(tarjeta);
  });
}



function mostrarModalNuevo() {
  limpiarModal();
  document.getElementById("guardar-edicion").onclick = () => guardarEdicion(null);
  document.getElementById("toggle-visible").classList.add("oculto");
  document.getElementById("modal-edicion").classList.remove("oculto");
  document.getElementById("btn-eliminar").classList.add("oculto");
document.body.style.overflow = "hidden";

}

function editarProducto(id) {
  const prod = productos[id];
  if (!prod) return;
  document.getElementById("edit-nombre").value = prod.nombre || "";
  document.getElementById("edit-balanza").value = prod.balanza || "";
  document.getElementById("edit-merma").value = prod.merma || "";
  document.getElementById("edit-ref").value = prod.ref || "";
  document.getElementById("edit-img").value = prod.img || "";
  document.getElementById("edit-cat").value = prod.categoria || "";
  document.getElementById("btn-eliminar").classList.remove("oculto");
document.getElementById("btn-eliminar").onclick = () => eliminarProducto(id);
document.body.style.overflow = "hidden";


  const btnVisible = document.getElementById("toggle-visible");
  btnVisible.classList.remove("oculto");
  btnVisible.textContent = prod.oculto ? "👁️ Mostrar" : "🙈 Ocultar";
  btnVisible.onclick = () => {
    productos[id].oculto = !productos[id].oculto;
    dbRef.child(id).update({ oculto: productos[id].oculto }).then(() => cargarProductos());
    cerrarModalEdicion();
  };

  document.getElementById("guardar-edicion").onclick = () => guardarEdicion(id);
  document.getElementById("modal-edicion").classList.remove("oculto");
}

function guardarEdicion(id) {
  const nuevoProd = {
    nombre: document.getElementById("edit-nombre").value.trim(),
    balanza: document.getElementById("edit-balanza").value.trim(),
    merma: document.getElementById("edit-merma").value.trim(),
    ref: document.getElementById("edit-ref").value.trim(),
    img: document.getElementById("edit-img").value.trim(),
    categoria: document.getElementById("edit-cat").value.trim(),
    oculto: productos[id]?.oculto || false
  };

  const ref = id ? dbRef.child(id) : dbRef.push();
  ref.set(nuevoProd)
    .then(() => {
      cerrarModalEdicion();
      cargarProductos();
    })
    .catch(err => console.error("❌ Error al guardar producto:", err));
}

function cerrarModalEdicion() {
  document.getElementById("modal-edicion").classList.add("oculto");
  document.body.style.overflow = "";

}

function limpiarModal() {
  ["edit-nombre", "edit-balanza", "edit-merma", "edit-ref", "edit-img", "edit-cat"].forEach(id => {
    document.getElementById(id).value = "";
  });
}
function eliminarProducto(id) {
  const tarjeta = document.querySelector(`.tarjeta-producto[data-id="${id}"]`);
  if (tarjeta) {
    tarjeta.style.opacity = "0.3";
  }

  dbRef.child(id).remove()
    .then(() => {
      cerrarModalEdicion();       // 👈 esto faltaba
      cargarProductos();          // 👈 refresca galería
    })
    .catch(err => console.error("❌ Error al eliminar producto:", err));
}

