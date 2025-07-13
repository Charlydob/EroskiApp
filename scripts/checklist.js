const empleados = ["Leti", "Sergio", "Brian", "Rocío", "Juan", "Charly", "Natalia", "Lorena", "TODOS"];
let turnoActual = "mañana";
let tareas = { mañana: [], tarde: [] };

// Cargar tareas desde archivos .txt
async function cargarTareasDesdeTxt(turno) {
  try {
    const response = await fetch(`recursos/txt/tareas-${turno}.txt`);
    const texto = await response.text();
    return texto.split('\n').map(t => t.trim()).filter(t => t.length > 0);
  } catch (err) {
    console.error(`Error cargando tareas del turno "${turno}":`, err);
    return [];
  }
}

async function renderizarTareas() {
  const lista = document.getElementById("lista-tareas");
  const titulo = document.getElementById("turno-label");
  lista.innerHTML = "";
  titulo.textContent = `📝 Checklist – Turno de ${turnoActual.charAt(0).toUpperCase() + turnoActual.slice(1)}`;

  if (tareas[turnoActual].length === 0) {
    tareas[turnoActual] = await cargarTareasDesdeTxt(turnoActual);
  }

  tareas[turnoActual].forEach((tarea, index) => {
    const li = document.createElement("li");
    li.dataset.index = index;

    const idBase = `${turnoActual}-${index}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    const spanTarea = document.createElement("span");
    spanTarea.textContent = tarea;
    spanTarea.className = "tarea-texto";

    const savedCheck = localStorage.getItem(`${idBase}-check`);
    if (savedCheck === "true") {
      checkbox.checked = true;
      spanTarea.classList.add("tachado");
    }

    checkbox.addEventListener("change", () => {
      localStorage.setItem(`${idBase}-check`, checkbox.checked);
      spanTarea.classList.toggle("tachado", checkbox.checked);
    });

    const select = document.createElement("select");
    select.innerHTML = '<option value="">-- Empleado --</option>';
    empleados.forEach(emp => {
      const option = document.createElement("option");
      option.value = emp;
      option.textContent = emp;
      select.appendChild(option);
    });

    const savedSelect = localStorage.getItem(`${idBase}-select`);
    if (savedSelect) {
      select.value = savedSelect;
    }

    select.addEventListener("change", () => {
      localStorage.setItem(`${idBase}-select`, select.value);
      aplicarFiltroEmpleado();
    });

    li.appendChild(checkbox);
    li.appendChild(spanTarea);
    li.appendChild(select);
    lista.appendChild(li);
  });

  actualizarFiltroEmpleados();
  aplicarFiltroEmpleado();
}

function alternarTurno() {
  turnoActual = turnoActual === "mañana" ? "tarde" : "mañana";
  renderizarTareas();
}

function reiniciarLista() {
  document.querySelectorAll("#lista-tareas input[type='checkbox']").forEach(cb => {
    cb.checked = false;
    const id = cb.closest("li").dataset.index;
    localStorage.removeItem(`${turnoActual}-${id}-check`);
  });

  document.querySelectorAll("#lista-tareas .tarea-texto").forEach(span => span.classList.remove("tachado"));

  document.querySelectorAll("#lista-tareas select").forEach(sel => {
    sel.selectedIndex = 0;
    const id = sel.closest("li").dataset.index;
    localStorage.removeItem(`${turnoActual}-${id}-select`);
  });

  aplicarFiltroEmpleado();
}

function generarCodigoAlfanumerico() {
  const selects = document.querySelectorAll("#lista-tareas select");
  const indices = Array.from(selects).map(select => select.selectedIndex || 0);
  const comprimido = comprimirCodigo(indices);
  return `${turnoActual}|${comprimido}`;
}

function mostrarCodigo() {
  const codigo = generarCodigoAlfanumerico();
  document.getElementById("codigo-generado").textContent = codigo;
  document.getElementById("input-codigo").value = codigo;
}

function comprimirCodigo(indices) {
  const letras = [
    "a","b","c","d","e","f","g","h","i","j","k","l",
    "m","n","o","p","q","r","s","t"
  ];

  let resultado = [];
  let i = 0;

  while (i < indices.length) {
    let valor = indices[i];
    let count = 1;
    while (i + count < indices.length && indices[i + count] === valor) {
      count++;
    }

    if (valor === 0 && count >= 2 && count <= 13) {
      resultado.push(letras[count - 2]); // a–l
    } else if (valor >= 1 && valor <= 8 && count >= 2 && count <= 9) {
      resultado.push(letras[valor + 10 - 1]); // m–t
    } else {
      resultado.push(Array(count).fill(valor).join(","));
    }

    i += count;
  }

  return resultado.join("");
}

function descomprimirCodigo(cadena) {
  const tabla = {
    a: Array(2).fill(0), b: Array(3).fill(0), c: Array(4).fill(0), d: Array(5).fill(0),
    e: Array(6).fill(0), f: Array(7).fill(0), g: Array(8).fill(0), h: Array(9).fill(0),
    i: Array(10).fill(0), j: Array(11).fill(0), k: Array(12).fill(0), l: Array(13).fill(0),
    m: Array(2).fill(1), n: Array(3).fill(2), o: Array(4).fill(3), p: Array(5).fill(4),
    q: Array(6).fill(5), r: Array(7).fill(6), s: Array(8).fill(7), t: Array(9).fill(8)
  };

  const resultado = [];
  let i = 0;

  while (i < cadena.length) {
    const char = cadena[i];
    if (tabla[char]) {
      resultado.push(...tabla[char]);
      i++;
    } else {
      let num = "";
      while (i < cadena.length && /[0-9]/.test(cadena[i])) {
        num += cadena[i++];
      }
      if (cadena[i] === ",") i++;
      if (num !== "") resultado.push(parseInt(num));
    }
  }

  return resultado.join(",");
}

function aplicarCodigoAlfanumerico(codigoCompleto) {
  const [turno, cod] = codigoCompleto.split("|");
  if (!turno || !cod || !tareas[turno]) {
    alert("Código inválido");
    return;
  }

  turnoActual = turno;
  renderizarTareas().then(() => {
    const cadenaExpandida = descomprimirCodigo(cod);
    const indices = cadenaExpandida.split(",").map(n => parseInt(n, 10));
    const selects = document.querySelectorAll("#lista-tareas select");

    selects.forEach((select, i) => {
      select.selectedIndex = indices[i] ?? 0;
      const id = select.closest("li").dataset.index;
      localStorage.setItem(`${turnoActual}-${id}-select`, select.value);
    });

    aplicarFiltroEmpleado();
  });
}

function actualizarFiltroEmpleados() {
  const filtro = document.getElementById("filtro-empleado");
  filtro.innerHTML = `
    <option value="">-- Ver todas --</option>
    <option value="__sin__">-- Sin asignar --</option>
  `;
  empleados.forEach(emp => {
    const option = document.createElement("option");
    option.value = emp;
    option.textContent = emp;
    filtro.appendChild(option);
  });
}

function aplicarFiltroEmpleado() {
  const filtro = document.getElementById("filtro-empleado").value;

  document.querySelectorAll("#lista-tareas li").forEach(li => {
    const select = li.querySelector("select");
    const empleado = select.value;

    let visible = false;
    if (filtro === "") {
      visible = true; // mostrar todas
    } else if (filtro === "__sin__") {
      visible = empleado === "";
    } else {
      visible = empleado === filtro;
    }

    li.style.display = visible ? "" : "none";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarTareas();
    const nombreSesion = localStorage.getItem("nombre");
  const filtro = document.getElementById("filtro-empleado");

  if (nombreSesion && empleados.includes(nombreSesion)) {
    filtro.value = nombreSesion;
  }

  document.getElementById("boton-generar").addEventListener("click", mostrarCodigo);
  document.getElementById("boton-aplicar").addEventListener("click", () => {
    const codigo = document.getElementById("input-codigo").value.trim();
    if (!codigo) {
      alert("Introduce un código válido");
      return;
    }
    aplicarCodigoAlfanumerico(codigo);
  });
  document.getElementById("filtro-empleado").addEventListener("change", aplicarFiltroEmpleado);
});
