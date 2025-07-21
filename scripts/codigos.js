const galeria = document.getElementById("galeria");
const buscador = document.getElementById("buscador");
const filtroCategoria = document.getElementById("filtro-categoria");

let mostrarOcultos = false;
let productos = [];

async function cargarProductosDesdeFirebase() {
  try {
    const snapshot = await db.ref("productos").once("value");
    const data = snapshot.val() || {};
    productos = Object.entries(data).map(([id, prod]) => ({ ...prod, id }));
    productos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    poblarSelectCategorias();
    mostrarProductos();
  } catch (err) {
    console.error("❌ Error al cargar productos desde Firebase:", err);
  }
}


// Solo queremos estas categorías reales, filtradas y ordenadas alfabéticamente
const CATEGORIAS_VALIDAS = ["Fruta", "Pan", "Bolleria", "Legumbre", "Fruto seco"];

function poblarSelectCategorias() {
  filtroCategoria.innerHTML = '<option value="">Todas las categorías</option>';
  const encontradas = new Set();

  productos.forEach(p => {
    const categoria = p.categoria.trim();
    if (CATEGORIAS_VALIDAS.includes(categoria) && !encontradas.has(categoria)) {
      encontradas.add(categoria);
      const option = document.createElement("option");
      option.value = categoria;
      option.textContent = categoria;
      filtroCategoria.appendChild(option);
    }
  });
}

function mostrarProductos(filtroTexto = "", categoriaSeleccionada = "") {
  galeria.innerHTML = "";

  productos
    .filter(p =>
      (mostrarOcultos || p.visible === "true") &&
      p.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) &&
      (categoriaSeleccionada === "" || p.categoria === categoriaSeleccionada)
    )
    .forEach(p => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="vista-normal">
          <img src="${p.imagen}" alt="${p.nombre}" />
          <div class="nombre">${p.nombre}</div>
          <div class="nombre">${p.codigobalanza}</div>
        </div>
        <div class="vista-detalles">
          <div class="dato">Caja: ${p.codigobalanza}</div>
          <div class="dato">Merma: ${p.codigomerma}</div>
          <div class="dato">Ref: ${p.referencia}</div>
          <div class="cerrar">[Cerrar]</div>
        </div>
      `;

      // Click corto → abre detalle
      div.querySelector(".vista-normal").addEventListener("click", () => {
        document.querySelectorAll(".item.activo").forEach(el => el.classList.remove("activo"));
        div.classList.add("activo");
      });

      div.querySelector(".cerrar").addEventListener("click", (e) => {
        e.stopPropagation();
        div.classList.remove("activo");
      });

      // Pulsación larga → edición
      let presionado = false;
      let timeout = null;

      div.addEventListener("touchstart", () => {
        presionado = true;
        timeout = setTimeout(() => {
          if (presionado) abrirModalEdicion(p, productos.indexOf(p));
        }, 600);
      });

      div.addEventListener("touchend", () => {
        presionado = false;
        clearTimeout(timeout);
      });

      galeria.appendChild(div);
    });
}


buscador.addEventListener("input", () => {
  mostrarProductos(buscador.value, filtroCategoria.value);
});

filtroCategoria.addEventListener("change", () => {
  mostrarProductos(buscador.value, filtroCategoria.value);
});

document.addEventListener("DOMContentLoaded", () => {
  cargarProductosDesdeFirebase();
});
// Filtro: mostrar productos que tienen código de merma
document.getElementById("btn-merma").addEventListener("click", () => {
  const resultado = productos.filter(p => p.visible === "true" && p.codigomerma.trim() !== "");
  mostrarFiltrados(resultado, "merma");
});


// Filtro: categoría Bolleria (envasar)
document.getElementById("btn-envasar").addEventListener("click", () => {
  const resultado = productos.filter(p => p.visible === "true" && p.categoria === "Bolleria");
  mostrarFiltrados(resultado);
});

// Filtro: frutas con código de balanza asignado
document.getElementById("btn-caja").addEventListener("click", () => {
  const resultado = productos.filter(p =>
    p.visible === "true" &&
    p.categoria === "Fruta" &&
    p.codigobalanza.trim() !== ""
  );
  mostrarFiltrados(resultado);
});

// Función auxiliar para mostrar una lista filtrada específica
function mostrarFiltrados(lista, modo = "normal") {
  galeria.innerHTML = "";
  lista.forEach(p => {
    let codigo = p.codigobalanza;
    if (modo === "merma") {
      codigo = p.codigomerma;
    }

    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="vista-normal">
        <img src="${p.imagen}" alt="${p.nombre}" />
        <div class="nombre">${p.nombre}</div>
        <div class="nombre">${codigo}</div>
      </div>
      <div class="vista-detalles">
        <div class="dato">Caja: ${p.codigobalanza}</div>
        <div class="dato">Merma: ${p.codigomerma}</div>
        <div class="dato">Ref: ${p.referencia}</div>
        <div class="cerrar">[Cerrar]</div>
      </div>
    `;

    div.querySelector(".vista-normal").addEventListener("click", () => {
      document.querySelectorAll(".item.activo").forEach(el => el.classList.remove("activo"));
      div.classList.add("activo");
    });

    div.querySelector(".cerrar").addEventListener("click", (e) => {
      e.stopPropagation();
      div.classList.remove("activo");
    });

    galeria.appendChild(div);
  });
}


buscador.addEventListener("input", () => {
  buscador.classList.toggle("clearable", buscador.value.length > 0);
});

buscador.addEventListener("click", (e) => {
  const inputRightEdge = buscador.getBoundingClientRect().right;
  if (e.clientX > inputRightEdge - 30 && buscador.classList.contains("clearable")) {
    buscador.value = '';
    buscador.classList.remove("clearable");
    buscador.dispatchEvent(new Event("input"));
  }
});
let productoEditando = null;

function abrirModalEdicion(producto, indice = null) {
  productoEditando = { producto, indice };

  document.getElementById("edit-nombre").value = producto.nombre || "";
  document.getElementById("edit-balanza").value = producto.codigobalanza || "";
  document.getElementById("edit-merma").value = producto.codigomerma || "";
  document.getElementById("edit-ref").value = producto.referencia || "";
  document.getElementById("edit-img").value = producto.imagen || "";
  document.getElementById("edit-cat").value = producto.categoria || "";

  document.getElementById("modal-edicion").classList.remove("oculto");
  const btnToggle = document.getElementById("toggle-visible");
if (producto.visible === "false") {
  btnToggle.textContent = "🔓 Mostrar producto";
} else {
  btnToggle.textContent = "🔒 Ocultar producto";
}
btnToggle.onclick = () => {
  producto.visible = producto.visible === "false" ? "true" : "false";
  if (producto.id) {
    db.ref(`productos/${producto.id}`).set(producto);
  }
  cerrarModalEdicion();
  mostrarProductos(buscador.value, filtroCategoria.value);
};

}

function cerrarModalEdicion() {
  document.getElementById("modal-edicion").classList.add("oculto");
}

document.getElementById("guardar-edicion").addEventListener("click", () => {
  if (!productoEditando) return;

  const { producto, indice } = productoEditando;

  producto.nombre = document.getElementById("edit-nombre").value;
  producto.codigobalanza = document.getElementById("edit-balanza").value;
  producto.codigomerma = document.getElementById("edit-merma").value;
  producto.referencia = document.getElementById("edit-ref").value;
  producto.imagen = document.getElementById("edit-img").value;
  producto.categoria = document.getElementById("edit-cat").value;
  producto.visible = "true";

  if (producto.id) {
    // Editar producto existente
    db.ref(`productos/${producto.id}`).set(producto);
    productos[indice] = producto;
  } else {
    // Nuevo producto
    const ref = db.ref("productos").push();
    producto.id = ref.key;
    ref.set(producto);
    productos.push(producto);
  }

  cerrarModalEdicion();
  mostrarProductos(buscador.value, filtroCategoria.value);
});


// Crear producto nuevo
document.getElementById("btn-nuevo").addEventListener("click", () => {
  abrirModalEdicion({ nombre: "", codigobalanza: "", codigomerma: "", referencia: "", imagen: "", categoria: "", visible: "true" });
});
document.getElementById("toggle-ocultos").addEventListener("click", () => {
  mostrarOcultos = !mostrarOcultos;
  document.getElementById("toggle-ocultos").textContent = mostrarOcultos
    ? "🔒 Ocultar productos ocultos"
    : "👀 Ver productos ocultos";
  mostrarProductos(buscador.value, filtroCategoria.value);
});
