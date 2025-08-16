// === Firebase refs ===
const dbRef = db.ref("productos/eroski");
const storage = firebase.storage();

// === Estado global ===
window.productos = {};
window.mostrarOcultos = cargarLS("mostrarOcultos", false);
window.modoEspecial = cargarLS("modoEspecial", null);
window.contadorModo = cargarLS("contadorModo", "sumar");
window.contadoresPreviosCache = cargarLS("contadoresPreviosCache", {});

// === DOM Ready ===
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("filtro-categoria")) {
    document.getElementById("filtro-categoria").value = cargarLS("ui:filtro", "");
  }
  if (document.getElementById("buscador")) {
    document.getElementById("buscador").value = cargarLS("ui:busqueda", "");
  }

  const cacheProductos = cargarLS("productosCache", null);
  if (cacheProductos) {
    window.productos = cacheProductos;
    renderizarProductos();
  }
  cargarProductos(); // UNA llamada inicial

  document.getElementById("btn-nuevo")?.addEventListener("click", window.mostrarModalNuevo);

  document.getElementById("toggle-ocultos")?.addEventListener("click", () => {
    window.mostrarOcultos = !window.mostrarOcultos;
    guardarLS("mostrarOcultos", window.mostrarOcultos);
    renderizarProductos();
  });

  document.getElementById("filtro-categoria")?.addEventListener("change", () => {
    guardarLS("ui:filtro", document.getElementById("filtro-categoria").value);
    guardarLS("modoEspecial", window.modoEspecial);
    renderizarProductos();
  });

  document.getElementById("buscador")?.addEventListener("input", () => {
    guardarLS("ui:busqueda", document.getElementById("buscador").value);
    guardarLS("modoEspecial", window.modoEspecial);
    renderizarProductos();
  });

  const setModo = (modo) => {
    window.modoEspecial = (window.modoEspecial === modo) ? null : modo;
    guardarLS("modoEspecial", window.modoEspecial);
    renderizarProductos();
  };

  document.getElementById("btn-merma")?.addEventListener("click", () => setModo("merma"));
  document.getElementById("btn-envasar")?.addEventListener("click", () => setModo("envasar"));
  document.getElementById("btn-caja")?.addEventListener("click", () => setModo("caja"));
  document.getElementById("btn-tele")?.addEventListener("click", () => setModo("tele"));

  const btnSumar = document.getElementById("btn-sumar");
  const btnRestar = document.getElementById("btn-restar");

  btnSumar?.addEventListener("click", () => {
    window.contadorModo = "sumar";
    guardarLS("contadorModo", window.contadorModo);
    btnSumar.classList.add("boton-activo");
    btnRestar?.classList.remove("boton-activo");
  });

  btnRestar?.addEventListener("click", () => {
    window.contadorModo = "restar";
    guardarLS("contadorModo", window.contadorModo);
    btnRestar.classList.add("boton-activo");
    btnSumar?.classList.remove("boton-activo");
  });

  document.getElementById("btn-previa")?.addEventListener("click", () => {
    const activando = window.modoEspecial !== "previa";
    window.modoEspecial = activando ? "previa" : null;
    window.contadorModo = "sumar";
    guardarLS("modoEspecial", window.modoEspecial);
    guardarLS("contadorModo", window.contadorModo);

    if (btnSumar && btnRestar) {
      btnSumar.style.display = activando ? "inline-block" : "none";
      btnRestar.style.display = activando ? "inline-block" : "none";
      if (activando) {
        btnSumar.classList.add("boton-activo");
        btnRestar.classList.remove("boton-activo");
      } else {
        btnSumar.classList.remove("boton-activo");
        btnRestar.classList.remove("boton-activo");
      }
    }

    renderizarProductos();
  });
});

// === Datos ===
window.cargarProductos = function () {
  dbRef.once("value")
    .then(snapshot => {
      window.productos = snapshot.val() || {};
      guardarLS("productosCache", window.productos);
      renderizarProductos();
    })
    .catch(err => console.error("❌ Error al cargar productos:", err));
};

// === Render ===
window.renderizarProductos = function () {
  const galeria = document.getElementById("galeria");
  if (!galeria) return;
  galeria.innerHTML = "";

  const filtro = (document.getElementById("filtro-categoria")?.value || "").toLowerCase();
  const busqueda = (document.getElementById("buscador")?.value || "").toLowerCase();

  let lista = Object.entries(window.productos)
    .filter(([_, prod]) => window.mostrarOcultos || !prod.oculto);

  // Modos especiales (ejemplos)
  if (window.modoEspecial === "merma") {
    lista = lista.filter(([_, p]) => (p.categoria || "").toLowerCase() === "fruta");
  } else if (window.modoEspecial === "envasar") {
    lista = lista.filter(([_, p]) => (p.categoria || "").toLowerCase() === "bolleria");
  } else if (window.modoEspecial === "caja") {
    lista = lista.filter(([_, p]) => (p.categoria || "").toLowerCase() === "fruta");
  } else if (window.modoEspecial === "tele") {
    lista = lista.filter(([_, p]) => (p.categoria || "").toLowerCase() === "tele-recarga");
  } else if (window.modoEspecial === "previa") {
    lista = lista.filter(([_, p]) => {
      const cat = (p.categoria || "").toLowerCase();
      const filtroActivo = (document.getElementById("filtro-categoria")?.value || "").toLowerCase();
      if (filtroActivo === "bolleria" || filtroActivo === "pan") return cat === filtroActivo;
      return cat === "bolleria" || cat === "pan";
    });
  } else {
    if (filtro) lista = lista.filter(([_, p]) => (p.categoria || "").toLowerCase() === filtro);
  }

  // Búsqueda dentro del modo/filtro activo
  if (busqueda) {
    lista = lista.filter(([_, p]) => (p.nombre || "").toLowerCase().includes(busqueda));
  }

  // Orden
  lista.sort((a, b) => {
    if (window.modoEspecial === "previa") {
      const aCont = window.contadoresPreviosCache?.[a[0]] || 0;
      const bCont = window.contadoresPreviosCache?.[b[0]] || 0;
      const aEsActivo = aCont > 0 ? 0 : 1;
      const bEsActivo = bCont > 0 ? 0 : 1;
      if (aEsActivo !== bEsActivo) return aEsActivo - bEsActivo;
    }
    return (a[1].nombre || "").localeCompare(b[1].nombre || "");
  });

  // Render tarjetas
  lista.forEach(([id, prod]) => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-producto";
    tarjeta.dataset.id = id;
    if (prod.oculto) tarjeta.classList.add("oculto");
    if (window.modoEspecial === "merma" && !prod.merma) tarjeta.classList.add("merma-sin-codigo");

    let html = `
      <div class="vista-simple">
        <img src="${prod.img || ""}" alt="Imagen del producto" loading="lazy"
             onerror="this.style.border='2px solid red'; this.alt='No encontrada'"/>
        <h4>${prod.nombre || "Sin nombre"}</h4>
        ${window.modoEspecial === "merma"
          ? `<p>${prod.merma || "-"}</p>`
          : `<p>${prod.balanza || "-"}</p>`}
        <button class="btn-editar oculto">✏️</button>
      </div>

      <div class="vista-detalles oculto">
        <p><strong>Merma:</strong> ${prod.merma || "-"}</p>
        <p><strong>Ref:</strong> ${prod.ref || "-"}</p>
        <p><strong>Cat:</strong> ${prod.categoria || "-"}</p>
        <span class="cerrar-detalle">✖</span>
      </div>
    `;
    tarjeta.innerHTML = html;

    // Long-press → mostrar botón editar
    let lp;
    ["mousedown", "touchstart"].forEach(ev => {
      tarjeta.addEventListener(ev, (e) => {
        e.stopPropagation();
        lp = setTimeout(() => {
          tarjeta.querySelector(".btn-editar").classList.remove("oculto");
        }, 500);
      });
      tarjeta.addEventListener(ev === "mousedown" ? "mouseup" : "touchend", () => clearTimeout(lp));
    });
    tarjeta.addEventListener("mouseleave", () => clearTimeout(lp));

    // Toggle detalles (sin botón de info)
    const toggleDetalle = () => tarjeta.querySelector(".vista-detalles")?.classList.toggle("oculto");
    tarjeta.querySelector(".cerrar-detalle")?.addEventListener("click", (e) => {
      e.stopPropagation();
      tarjeta.querySelector(".vista-detalles")?.classList.add("oculto");
    });

    if (window.modoEspecial === "previa") {
      // Contador rápida
      const cont = document.createElement("span");
      cont.className = "contador previa-contador";
      const valPrev = window.contadoresPreviosCache?.[id] || 0;
      cont.textContent = valPrev;
      tarjeta.querySelector(".vista-simple").appendChild(cont);
      if (valPrev > 0) tarjeta.classList.add("tarjeta-activa");

      // Click tarjeta = sumar/restar (sin abrir detalle)
      tarjeta.addEventListener("click", (e) => {
        if (e.target === cont || e.target.closest(".contador-input")) return;
        let v = parseInt(cont.textContent || "0", 10);
        if (window.contadorModo === "sumar") v++;
        else if (window.contadorModo === "restar" && v > 0) v--;
        cont.textContent = v;
        if (v > 0) tarjeta.classList.add("tarjeta-activa"); else tarjeta.classList.remove("tarjeta-activa");
        window.contadoresPreviosCache = window.contadoresPreviosCache || {};
        window.contadoresPreviosCache[id] = v;
        guardarLS("contadoresPreviosCache", window.contadoresPreviosCache);
        renderizarProductos(); // reordenar
      });

      // Editar cantidad tocando contador
      cont.style.cursor = "number";
      cont.title = "Clica para editar";
      cont.addEventListener("click", (e) => {
        e.stopPropagation();
        if (cont.querySelector("input")) return;

        const input = document.createElement("input");
        input.type = "number";
        input.inputMode = "numeric";
        input.pattern = "[0-9]*";
        input.min = "0";
        input.className = "contador-input";
        input.value = cont.textContent || "0";
        input.style.width = Math.max(28, (input.value.length + 1) * 10) + "px";

        cont.textContent = "";
        cont.appendChild(input);
        input.focus();
        input.select();

        const commit = () => {
          let v = parseInt(input.value || "0", 10);
          if (isNaN(v) || v < 0) v = 0;
          cont.textContent = v;
          if (v > 0) tarjeta.classList.add("tarjeta-activa"); else tarjeta.classList.remove("tarjeta-activa");
          window.contadoresPreviosCache[id] = v;
          guardarLS("contadoresPreviosCache", window.contadoresPreviosCache);
          renderizarProductos();
        };

        input.addEventListener("blur", commit);
        input.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") { ev.preventDefault(); input.blur(); }
          if (ev.key === "Escape") { ev.preventDefault(); cont.textContent = window.contadoresPreviosCache?.[id] || 0; }
        });
      });
    } else {
      // En modos no-previa: click en tarjeta abre/cierra detalle
      tarjeta.addEventListener("click", () => toggleDetalle());
    }

    // Editar
    tarjeta.querySelector(".btn-editar").addEventListener("click", (e) => {
      e.stopPropagation();
      editarProducto(id);
    });

    galeria.appendChild(tarjeta);
  });

  if (window.modoEspecial === "previa") {
    window.contadoresPreviosCache = window.contadoresPreviosCache || {};
    document.querySelectorAll(".tarjeta-producto").forEach(t => {
      const id = t.dataset.id;
      const c = t.querySelector(".contador")?.textContent;
      if (id && c != null) window.contadoresPreviosCache[id] = parseInt(c || "0", 10);
    });
    guardarLS("contadoresPreviosCache", window.contadoresPreviosCache);
  }
};

// === CRUD / Modal ===
window.mostrarModalNuevo = function () {
  limpiarModal();
  document.getElementById("guardar-edicion").onclick = () => guardarEdicion(null);
  document.getElementById("toggle-visible").classList.add("oculto");
  document.getElementById("modal-edicion").classList.remove("oculto");
  document.getElementById("btn-eliminar").classList.add("oculto");
  document.body.style.overflow = "hidden";
};

window.editarProducto = function (id) {
  const p = window.productos[id];
  if (!p) return;

  document.getElementById("edit-nombre").value = p.nombre || "";
  document.getElementById("edit-balanza").value = p.balanza || "";
  document.getElementById("edit-merma").value = p.merma || "";
  document.getElementById("edit-ref").value = p.ref || "";
  document.getElementById("edit-cat").value = p.categoria || "";
  document.getElementById("btn-eliminar").classList.remove("oculto");
  document.getElementById("btn-eliminar").onclick = () => eliminarProducto(id);
  document.body.style.overflow = "hidden";

  const btnVisible = document.getElementById("toggle-visible");
  btnVisible.classList.remove("oculto");
  btnVisible.textContent = p.oculto ? "👁️ Mostrar" : "🙈 Ocultar";
  btnVisible.onclick = () => {
    const nuevo = !window.productos[id].oculto;
    window.productos[id].oculto = nuevo;
    dbRef.child(id).update({ oculto: nuevo }).catch(console.error);
    guardarLS("productosCache", window.productos);
    cerrarModalEdicion();
    renderizarProductos();
  };

  document.getElementById("guardar-edicion").onclick = () => guardarEdicion(id);
  document.getElementById("modal-edicion").classList.remove("oculto");
};

window.guardarEdicion = function (id) {
  const nombre = document.getElementById("edit-nombre").value.trim();
  const categoria = document.getElementById("edit-cat").value.trim().toLowerCase();

  const nombreArchivo = nombre
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

  const cloudinaryUrl = document.getElementById("preview-imagen-producto")?.dataset?.url;
  const imgPrev = window.productos[id]?.img || "";
  const imgFinal =
    cloudinaryUrl ||
    imgPrev ||
    (nombre && categoria ? `recursos/img/codigos/${categoria}/${nombreArchivo}.png` : "");

  const nuevoProd = {
    nombre,
    balanza: document.getElementById("edit-balanza").value.trim(),
    merma: document.getElementById("edit-merma").value.trim(),
    ref: document.getElementById("edit-ref").value.trim(),
    categoria,
    oculto: window.productos[id]?.oculto || false,
    img: imgFinal
  };

  const ref = id ? dbRef.child(id) : dbRef.push();
  ref.set(nuevoProd)
    .then(() => {
      const key = id || ref.key;
      window.productos[key] = { ...nuevoProd };
      guardarLS("productosCache", window.productos);
      cerrarModalEdicion();
      renderizarProductos();
    })
    .catch(err => console.error("❌ Error al guardar producto:", err));
};

// === Cloudinary ===
function subirImagenProducto(event) {
  const archivo = event.target.files?.[0];
  if (!archivo) return;

  const preview = document.getElementById("preview-imagen-producto");
  if (preview) preview.src = URL.createObjectURL(archivo);

  const formData = new FormData();
  formData.append("file", archivo);
  formData.append("upload_preset", "publico"); // Debe existir en tu Cloudinary

  fetch("https://api.cloudinary.com/v1_1/dgdavibcx/image/upload", {
    method: "POST",
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      const url = data.secure_url;
      if (url && preview) {
        preview.src = url;
        preview.dataset.url = url; // usado en guardarEdicion
      }
    })
    .catch(err => console.error("❌ Error al subir imagen:", err));
}
window.subirImagenProducto = subirImagenProducto;

// === Utilidades Modal ===
window.cerrarModalEdicion = function () {
  document.getElementById("modal-edicion").classList.add("oculto");
  document.body.style.overflow = "";
};

window.limpiarModal = function () {
  ["edit-nombre", "edit-balanza", "edit-merma", "edit-ref", "edit-img", "edit-cat"].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
  const prev = document.getElementById("preview-imagen-producto");
  if (prev) { prev.src = ""; prev.removeAttribute("data-url"); }
};

window.eliminarProducto = function (id) {
  const tarjeta = document.querySelector(`.tarjeta-producto[data-id="${id}"]`);
  if (tarjeta) tarjeta.style.opacity = "0.3";

  dbRef.child(id).remove()
    .then(() => {
      delete window.productos[id];
      guardarLS("productosCache", window.productos);
      cerrarModalEdicion();
      renderizarProductos();
    })
    .catch(err => console.error("❌ Error al eliminar producto:", err));
};

// === LocalStorage helpers ===
function guardarLS(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch {}
}
function cargarLS(clave, defecto = null) {
  try {
    const v = localStorage.getItem(clave);
    return v == null ? defecto : JSON.parse(v);
  } catch { return defecto; }
}
