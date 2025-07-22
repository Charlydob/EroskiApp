const dbRef = db.ref("productos/eroski");
const storage = firebase.storage();
let productos = {};
let mostrarOcultos = false;
let modoEspecial = null;

document.addEventListener("DOMContentLoaded", () => {
  cargarProductos();

  document.getElementById("btn-nuevo").addEventListener("click", mostrarModalNuevo);

  document.getElementById("toggle-ocultos").addEventListener("click", () => {
    mostrarOcultos = !mostrarOcultos;
    cargarProductos();
  });

  document.getElementById("filtro-categoria").addEventListener("change", () => {
    modoEspecial = null;
    cargarProductos();
  });

  document.getElementById("buscador").addEventListener("input", () => {
    modoEspecial = null;
    cargarProductos();
  });

  document.getElementById("btn-merma").addEventListener("click", () => {
    modoEspecial = (modoEspecial === "merma") ? null : "merma";
    cargarProductos();
  });

  document.getElementById("btn-envasar").addEventListener("click", () => {
    modoEspecial = (modoEspecial === "envasar") ? null : "envasar";
    cargarProductos();
  });

  document.getElementById("btn-caja").addEventListener("click", () => {
    modoEspecial = (modoEspecial === "caja") ? null : "caja";
    cargarProductos();
  });
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

  // Convertimos a array y filtramos ocultos
  let lista = Object.entries(productos)
    .filter(([_, prod]) => mostrarOcultos || !prod.oculto);

  // Si hay modo especial, lo aplicamos y anulamos otros filtros
  if (modoEspecial === "merma") {
    lista = lista.filter(([_, prod]) => prod.merma);
  } else if (modoEspecial === "envasar") {
    lista = lista.filter(([_, prod]) => prod.categoria?.toLowerCase() === "bolleria");
  } else if (modoEspecial === "caja") {
    lista = lista.filter(([_, prod]) => prod.categoria?.toLowerCase() === "fruta");
  } else {
    // Solo si no hay modo especial, aplicamos filtros normales
    if (filtro) {
      lista = lista.filter(([_, prod]) => prod.categoria?.toLowerCase() === filtro);
    }
    if (busqueda) {
      lista = lista.filter(([_, prod]) => prod.nombre?.toLowerCase().includes(busqueda));
    }
  }

  // Orden alfabético
  lista.sort((a, b) => (a[1].nombre || '').localeCompare(b[1].nombre || ''));

  // Renderizado
  lista.forEach(([id, prod]) => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-producto";
    tarjeta.dataset.id = id;
    if (prod.oculto) tarjeta.classList.add("oculto");

    let contenido = `
      <div class="vista-simple">
        <img src="${prod.img || ''}" alt="Imagen del producto" />
        <h4>${prod.nombre || 'Sin nombre'}</h4>
    `;

    if (modoEspecial === "merma") {
      contenido += `<p>${prod.merma || '-'}</p>`;
    } else {
      contenido += `<p>${prod.balanza || '-'}</p>`;
    }

    contenido += `<button class="btn-editar oculto">✏️</button></div>`;

    if (!modoEspecial) {
      contenido += `
        <div class="vista-detalles oculto">
          <p><strong>Merma:</strong> ${prod.merma || '-'}</p>
          <p><strong>Ref:</strong> ${prod.ref || '-'}</p>
          <p><strong>Cat:</strong> ${prod.categoria || '-'}</p>
          <span class="cerrar-detalle">✖</span>
        </div>`;
    }

    tarjeta.innerHTML = contenido;

    // Edición long press
    let longPressTimeout;
    tarjeta.addEventListener("mousedown", () => {
      longPressTimeout = setTimeout(() => {
        tarjeta.querySelector(".btn-editar").classList.remove("oculto");
      }, 500);
    });
    tarjeta.addEventListener("mouseup", () => clearTimeout(longPressTimeout));
    tarjeta.addEventListener("mouseleave", () => clearTimeout(longPressTimeout));

    // Alternar detalles
    if (!modoEspecial) {
      tarjeta.addEventListener("click", () => {
        tarjeta.querySelector(".vista-detalles").classList.toggle("oculto");
      });

      tarjeta.querySelector(".cerrar-detalle")?.addEventListener("click", (e) => {
        e.stopPropagation();
        tarjeta.querySelector(".vista-detalles").classList.add("oculto");
      });
    }

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
  const archivo = document.getElementById("edit-img").files[0];

  const nuevoProd = {
    nombre: document.getElementById("edit-nombre").value.trim(),
    balanza: document.getElementById("edit-balanza").value.trim(),
    merma: document.getElementById("edit-merma").value.trim(),
    ref: document.getElementById("edit-ref").value.trim(),
    categoria: document.getElementById("edit-cat").value.trim(),
    oculto: productos[id]?.oculto || false,
    img: productos[id]?.img || "" // temporal, se sobreescribe si se sube nueva
  };

  const guardarEnDB = (imgURL = null) => {
    if (imgURL) nuevoProd.img = imgURL;

    const ref = id ? dbRef.child(id) : dbRef.push();
    ref.set(nuevoProd)
      .then(() => {
        cerrarModalEdicion();
        cargarProductos();
      })
      .catch(err => console.error("❌ Error al guardar producto:", err));
  };

  if (archivo) {
    const nombreUnico = `${Date.now()}_${archivo.name}`;
    const refStorage = storage.ref().child("imagenesProductos/" + nombreUnico);

    refStorage.put(archivo)
      .then(snapshot => snapshot.ref.getDownloadURL())
      .then(url => {
        guardarEnDB(url);
      })
      .catch(err => {
        console.error("❌ Error al subir imagen:", err);
        guardarEnDB(); // guarda sin imagen si falla la subida
      });
  } else {
    guardarEnDB(); // no hay imagen nueva
  }
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

