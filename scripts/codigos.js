const dbRef = db.ref("productos/eroski");
const storage = firebase.storage();

window.productos = {};
window.mostrarOcultos = false;
window.modoEspecial = null;
window.contadorModo = "sumar";


document.addEventListener("DOMContentLoaded", () => {
  window.cargarProductos();

  document.getElementById("btn-nuevo").addEventListener("click", window.mostrarModalNuevo);

  document.getElementById("toggle-ocultos")?.addEventListener("click", () => {
    window.mostrarOcultos = !window.mostrarOcultos;
    window.cargarProductos();
  });

  document.getElementById("filtro-categoria")?.addEventListener("change", () => {
  // No resetear modoEspecial si estamos en previa
  if (window.modoEspecial !== "previa") window.modoEspecial = null;
  window.cargarProductos();
});

document.getElementById("buscador")?.addEventListener("input", () => {
  if (window.modoEspecial !== "previa") window.modoEspecial = null;
  window.cargarProductos();
});


  document.getElementById("btn-merma")?.addEventListener("click", () => {
    window.modoEspecial = (window.modoEspecial === "merma") ? null : "merma";
    window.cargarProductos();
  });

  document.getElementById("btn-envasar")?.addEventListener("click", () => {
    window.modoEspecial = (window.modoEspecial === "envasar") ? null : "envasar";
    window.cargarProductos();
  });

  document.getElementById("btn-caja")?.addEventListener("click", () => {
    window.modoEspecial = (window.modoEspecial === "caja") ? null : "caja";
    window.cargarProductos();
  });

  // Botones para el modo Previa
  const btnSumar = document.getElementById("btn-sumar");
const btnRestar = document.getElementById("btn-restar");

btnSumar.addEventListener("click", () => {
  window.contadorModo = "sumar";
  btnSumar.classList.add("boton-activo");
  btnRestar.classList.remove("boton-activo");
});

btnRestar.addEventListener("click", () => {
  window.contadorModo = "restar";
  btnRestar.classList.add("boton-activo");
  btnSumar.classList.remove("boton-activo");
});

document.getElementById("btn-previa")?.addEventListener("click", () => {
  const activando = window.modoEspecial !== "previa";
  window.modoEspecial = activando ? "previa" : null;
  window.contadorModo = "sumar";

  // Mostrar u ocultar botones
  btnSumar.style.display = activando ? "inline-block" : "none";
  btnRestar.style.display = activando ? "inline-block" : "none";

  // Estilo visual
  if (activando) {
    btnSumar.classList.add("boton-activo");
    btnRestar.classList.remove("boton-activo");
  } else {
    btnSumar.classList.remove("boton-activo");
    btnRestar.classList.remove("boton-activo");
  }

  window.cargarProductos();
});


});


window.cargarProductos = function () {
  console.log("🔄 Cargando productos desde Firebase...");
  dbRef.once("value")
    .then(snapshot => {
      window.productos = snapshot.val() || {};
      console.log("✅ Productos cargados:", window.productos);
      window.renderizarProductos();
    })
    .catch(err => console.error("❌ Error al cargar productos:", err));
};


window.renderizarProductos = function () {
  console.log("🎨 Renderizando productos...");
  const galeria = document.getElementById("galeria");
  galeria.innerHTML = "";

  const filtro = document.getElementById("filtro-categoria").value.toLowerCase();
  const busqueda = document.getElementById("buscador").value.toLowerCase();

  let lista = Object.entries(window.productos)
    .filter(([_, prod]) => window.mostrarOcultos || !prod.oculto);

  console.log("🧪 Filtro aplicado:", filtro, " | Búsqueda:", busqueda, " | Modo especial:", window.modoEspecial);

  if (window.modoEspecial === "merma") {
    lista = lista.filter(([_, prod]) => prod.merma);
  } else if (window.modoEspecial === "envasar") {
    lista = lista.filter(([_, prod]) => prod.categoria?.toLowerCase() === "bolleria");
  } else if (window.modoEspecial === "caja") {
    lista = lista.filter(([_, prod]) => prod.categoria?.toLowerCase() === "fruta");
  } else if (window.modoEspecial === "previa") {
    lista = lista.filter(([_, prod]) => {
      const cat = prod.categoria?.toLowerCase();
      return cat === "bolleria" || cat === "pan";
    });
  } else {
    if (filtro) lista = lista.filter(([_, prod]) => prod.categoria?.toLowerCase() === filtro);
    if (busqueda) lista = lista.filter(([_, prod]) => prod.nombre?.toLowerCase().includes(busqueda));
  }

  // Recuperar contadores previos si los hubiera
  const contadoresPrevios = {};
  if (window.modoEspecial === "previa" && window.contadoresPreviosCache) {
    Object.assign(contadoresPrevios, window.contadoresPreviosCache);
  }

  // Ordenar: primero por contador descendente, luego alfabético
  lista.sort((a, b) => {
    if (window.modoEspecial === "previa") {
      const aCont = contadoresPrevios[a[0]] || 0;
      const bCont = contadoresPrevios[b[0]] || 0;
      if (aCont !== bCont) return bCont - aCont;
    }
    return (a[1].nombre || '').localeCompare(b[1].nombre || '');
  });

  console.log(`📦 ${lista.length} productos a mostrar`);

  lista.forEach(([id, prod]) => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-producto";
    tarjeta.dataset.id = id;
    if (prod.oculto) tarjeta.classList.add("oculto");

    let contenido = `
      <div class="vista-simple">
        <img src="${prod.img || ''}" alt="Imagen del producto" 
          onerror="this.style.border='2px solid red'; this.alt='No encontrada'; console.warn('❌ Imagen no cargada:', this.src)" />
        <h4>${prod.nombre || 'Sin nombre'}</h4>
    `;

    contenido += (window.modoEspecial === "merma")
      ? `<p>${prod.merma || '-'}</p>`
      : `<p>${prod.balanza || '-'}</p>`;

    contenido += `<button class="btn-editar oculto">✏️</button></div>`;

    if (!window.modoEspecial) {
      contenido += `
        <div class="vista-detalles oculto">
          <p><strong>Merma:</strong> ${prod.merma || '-'}</p>
          <p><strong>Ref:</strong> ${prod.ref || '-'}</p>
          <p><strong>Cat:</strong> ${prod.categoria || '-'}</p>
          <span class="cerrar-detalle">✖</span>
        </div>`;
    }

    tarjeta.innerHTML = contenido;

    let longPressTimeout;
    ["mousedown", "touchstart"].forEach(eventoInicio => {
      tarjeta.addEventListener(eventoInicio, (e) => {
        e.stopPropagation();
        longPressTimeout = setTimeout(() => {
          tarjeta.querySelector(".btn-editar").classList.remove("oculto");
        }, 500);
      });
      const eventoFin = eventoInicio === "mousedown" ? "mouseup" : "touchend";
      tarjeta.addEventListener(eventoFin, () => clearTimeout(longPressTimeout));
    });
    tarjeta.addEventListener("mouseleave", () => clearTimeout(longPressTimeout));

    if (window.modoEspecial === "previa") {
      const contador = document.createElement("span");
      contador.className = "contador previa-contador";
      const valorPrevio = contadoresPrevios[id] || 0;
      contador.textContent = valorPrevio;
      tarjeta.querySelector(".vista-simple").appendChild(contador);

      if (valorPrevio > 0) {
        tarjeta.classList.add("tarjeta-activa");
      }

      tarjeta.addEventListener("click", (e) => {
        e.stopPropagation();
        let valor = parseInt(contador.textContent);
        if (window.contadorModo === "sumar") valor++;
        else if (window.contadorModo === "restar" && valor > 0) valor--;

        contador.textContent = valor;

        if (valor > 0) {
          tarjeta.classList.add("tarjeta-activa");
        } else {
          tarjeta.classList.remove("tarjeta-activa");
        }

        // Actualizar el cache con el nuevo valor y volver a renderizar
        window.contadoresPreviosCache = window.contadoresPreviosCache || {};
        window.contadoresPreviosCache[id] = valor;
        window.renderizarProductos(); // Reordenar automáticamente tras clic
      });
    } else {
      tarjeta.addEventListener("click", () => {
        tarjeta.querySelector(".vista-detalles")?.classList.toggle("oculto");
      });

      tarjeta.querySelector(".cerrar-detalle")?.addEventListener("click", (e) => {
        e.stopPropagation();
        tarjeta.querySelector(".vista-detalles").classList.add("oculto");
      });
    }

    tarjeta.querySelector(".btn-editar").addEventListener("click", (e) => {
      e.stopPropagation();
      window.editarProducto(id);
    });

    galeria.appendChild(tarjeta);
  });

  // Guardar estado final de contadores después de renderizar
  if (window.modoEspecial === "previa") {
    window.contadoresPreviosCache = {};
    document.querySelectorAll(".tarjeta-producto").forEach(tarjeta => {
      const id = tarjeta.dataset.id;
      const contador = tarjeta.querySelector(".contador")?.textContent;
      if (id && contador) {
        window.contadoresPreviosCache[id] = parseInt(contador);
      }
    });
  }
};





window.mostrarModalNuevo = function () {
  console.log("🆕 Abriendo modal para nuevo producto...");
  window.limpiarModal();
  document.getElementById("guardar-edicion").onclick = () => window.guardarEdicion(null);
  document.getElementById("toggle-visible").classList.add("oculto");
  document.getElementById("modal-edicion").classList.remove("oculto");
  document.getElementById("btn-eliminar").classList.add("oculto");
  document.body.style.overflow = "hidden";
};


window.editarProducto = function (id) {
  console.log("✏️ Editando producto con ID:", id);
  const prod = window.productos[id];
  if (!prod) {
    console.warn("⚠️ Producto no encontrado.");
    return;
  }

  document.getElementById("edit-nombre").value = prod.nombre || "";
  document.getElementById("edit-balanza").value = prod.balanza || "";
  document.getElementById("edit-merma").value = prod.merma || "";
  document.getElementById("edit-ref").value = prod.ref || "";
  document.getElementById("edit-cat").value = prod.categoria || "";
  document.getElementById("btn-eliminar").classList.remove("oculto");
  document.getElementById("btn-eliminar").onclick = () => window.eliminarProducto(id);
  document.body.style.overflow = "hidden";

  const btnVisible = document.getElementById("toggle-visible");
  btnVisible.classList.remove("oculto");
  btnVisible.textContent = prod.oculto ? "👁️ Mostrar" : "🙈 Ocultar";
  btnVisible.onclick = () => {
    console.log("🔁 Cambiando visibilidad del producto...");
    window.productos[id].oculto = !window.productos[id].oculto;
    dbRef.child(id).update({ oculto: window.productos[id].oculto }).then(() => window.cargarProductos());
    window.cerrarModalEdicion();
  };

  document.getElementById("guardar-edicion").onclick = () => window.guardarEdicion(id);
  document.getElementById("modal-edicion").classList.remove("oculto");
};


window.guardarEdicion = function (id) {
  console.log(id ? "💾 Guardando edición..." : "🆕 Guardando nuevo producto...");

  const nombre = document.getElementById("edit-nombre").value.trim();
  const categoria = document.getElementById("edit-cat").value.trim().toLowerCase();

  // Generar ruta de imagen local
  const nombreArchivo = nombre
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita tildes
    .replace(/\s+/g, "_"); // espacios por guiones bajos

const rutaLocal = `recursos/img/codigos/${categoria.toLowerCase()}/${nombreArchivo.toLowerCase()}.png`;

  const nuevoProd = {
    nombre,
    balanza: document.getElementById("edit-balanza").value.trim(),
    merma: document.getElementById("edit-merma").value.trim(),
    ref: document.getElementById("edit-ref").value.trim(),
    categoria,
    oculto: window.productos[id]?.oculto || false,
    img: rutaLocal
  };

  console.log("🧾 Producto final a guardar:", nuevoProd);

  const ref = id ? dbRef.child(id) : dbRef.push();
  ref.set(nuevoProd)
    .then(() => {
      console.log("✅ Producto guardado con imagen local:", rutaLocal);
      window.cerrarModalEdicion();
      window.cargarProductos();
    })
    .catch(err => console.error("❌ Error al guardar producto:", err));
};





window.cerrarModalEdicion = function () {
  console.log("❎ Cerrando modal...");
  document.getElementById("modal-edicion").classList.add("oculto");
  document.body.style.overflow = "";
};


window.limpiarModal = function () {
  console.log("🧽 Limpiando modal de edición...");
  ["edit-nombre", "edit-balanza", "edit-merma", "edit-ref", "edit-img", "edit-cat"].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
};


window.eliminarProducto = function (id) {
  console.log("🗑️ Eliminando producto con ID:", id);
  const tarjeta = document.querySelector(`.tarjeta-producto[data-id="${id}"]`);
  if (tarjeta) tarjeta.style.opacity = "0.3";

  dbRef.child(id).remove()
    .then(() => {
      console.log("✅ Producto eliminado");
      window.cerrarModalEdicion();
      window.cargarProductos();
    })
    .catch(err => console.error("❌ Error al eliminar producto:", err));
};

