const galeria = document.getElementById("galeria");
const buscador = document.getElementById("buscador");
const filtroCategoria = document.getElementById("filtro-categoria");

let productos = [];

async function cargarProductosDesdeTxt() {
  try {
    const response = await fetch("recursos/txt/codigos.txt");
    const texto = await response.text();

    productos = texto
      .split("\n")
      .map(linea => linea.trim())
      .filter(linea => linea.length > 0)
      .map(linea => {
        const partes = linea.split(',');
        const nombre = partes[0] || "";
        const codigobalanza = partes[1] || "";
        const codigomerma = partes[2] || "";
        const referencia = partes[3] || "";
        const imagen = partes[4] || "";
        const categoria = partes[5] || "";
        const visible = partes[6] === "false" ? "false" : "true";

        return { nombre, codigobalanza, codigomerma, referencia, imagen, categoria, visible };
      });

    productos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

    poblarSelectCategorias();
    mostrarProductos();
  } catch (err) {
    console.error("Error al cargar productos:", err);
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
      p.visible === "true" &&
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
  mostrarProductos(buscador.value, filtroCategoria.value);
});

filtroCategoria.addEventListener("change", () => {
  mostrarProductos(buscador.value, filtroCategoria.value);
});

document.addEventListener("DOMContentLoaded", () => {
  cargarProductosDesdeTxt();
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
