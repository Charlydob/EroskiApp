
const usuarios = window.usuarios || {};
window.usuarios = {};
window.empleados = [];


db.ref("empleados").once("value", (snap) => {
  const data = snap.val();
  if (!data) return;

  window.usuarios = data;
empleados = Object.values(data); // ✅ incluye a todos, incluida Lorena

console.log("📋 Nombres en Firebase:", Object.values(data));

  // ✅ ORDEN PERSONALIZADO
const ordenDeseado = ["Lorena", "Juan", "Leti", "Charly", "Bryant", "Rocio", "Natalia", "Sergio"];

const entradas = Object.entries(data); // ✅ no excluye a nadie

entradas.sort(([, nombreA], [, nombreB]) => {
  const iA = ordenDeseado.indexOf(nombreA);
  const iB = ordenDeseado.indexOf(nombreB);
  return (iA === -1 ? Infinity : iA) - (iB === -1 ? Infinity : iB);
});

window.usuarios = Object.fromEntries(entradas);
empleados = entradas.map(([, nombre]) => nombre);


  // 🔁 Renderiza después de tener usuarios + empleados correctos
  cargarSelectorEmpleado?.();
  renderizarTabla?.();
  cargarIntercambioTurno?.();
});

const horas = [
  "6-7", "7-8", "8-9", "9-10", "10-11", "11-12", "12-13", "13-14",
  "14-15", "15-16", "16-17", "17-18", "18-19", "19-20", "20-21", "21-22"
];
let modoSeleccion = null;
let semanaActual = null;
let diaActual = "lunes";
let celdasTocadas = new Set();
let tocando = false;
let empleadoPintando = null;

const tablaContainer = document.getElementById("tablaHorarioContainer");
const selectorSemana = document.getElementById("selectorSemana");
const selectorDia = document.getElementById("selectorDia");

// Establecer día actual al cargar
const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const hoy = new Date();
const diaActualNombre = diasSemana[hoy.getDay()];
selectorDia.value = diaActualNombre;
diaActual = diaActualNombre; // actualiza también la variable global

window.cambiosPendientes = {};
window.timeoutAutoGuardar = null;

window.guardarCambiosPendientes = async function () {
  const entradas = Object.entries(window.cambiosPendientes);
  if (entradas.length === 0) {
    alert("No hay cambios pendientes.");
    return;
  }

  console.log("💾 Guardando cambios:", entradas);

  for (let [clave, cambios] of entradas) {
    const [dia, empleado] = clave.split("_");
    await db.ref(`${semanaActual}/${dia}`).update(cambios);
  }

  window.cambiosPendientes = {};
  alert("✅ Cambios guardados.");
  renderizarTabla();

  document.querySelectorAll("td[style*='#fff3cd']")
    .forEach(td => td.style.backgroundColor = "");
};

window.marcarCambioPendiente = function (dia, empleado, updates) {
  const clave = `${dia}_${empleado}`;
  if (!window.cambiosPendientes[clave]) {
    window.cambiosPendientes[clave] = {};
  }

  Object.assign(window.cambiosPendientes[clave], updates);

  clearTimeout(window.timeoutAutoGuardar);
  window.timeoutAutoGuardar = setTimeout(() => {
    window.guardarCambiosPendientes();
  }, 60000);
};

selectorDia.addEventListener("change", () => {
  diaActual = selectorDia.value;
  renderizarTabla();
});

function setModo(modo) {
  modoSeleccion = modo;

  // Quitar la clase activa de todos los botones
  const botones = document.querySelectorAll("#modoSeleccion button");
  botones.forEach(btn => btn.classList.remove("modo-activo"));

  // Añadirla solo al botón activo
  const botonActivo = [...botones].find(btn => btn.textContent.includes(modo === "uno" ? "1" :modo === "ceroCinco" ? "0.5" :modo === "verde" ? "🟩" :"🗑️"));
  if (botonActivo) botonActivo.classList.add("modo-activo");
}


function crearNuevaSemana() {
  let fecha = prompt("Introduce la fecha de inicio de semana (dd/mm/aaaa):");
  if (!fecha) return;

  const fechaNormalizada = fecha.replaceAll("/", "-"); // clave segura para Firebase
  const nombreSemana = `horario_semana_${fechaNormalizada}`;

  // Verificar si ya existe
  if ([...selectorSemana.options].some(opt => opt.value === nombreSemana)) {
    alert("Ya existe un horario para esa semana.");
    return;
  }

  // Añadir al selector
  const nuevaOpcion = document.createElement("option");
  nuevaOpcion.value = nombreSemana;
  nuevaOpcion.textContent = fecha;
  selectorSemana.appendChild(nuevaOpcion);
  selectorSemana.value = nombreSemana;

  semanaActual = nombreSemana;
  inicializarSemana(nombreSemana);

  // Guardar la fecha real en Firebase
  db.ref(`${nombreSemana}/_fecha`).set(fecha);

  renderizarTabla();
  renderizarResumenEmpleado();
}




function inicializarSemana(nombreSemana) {
  const dias = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
  for (let dia of dias) {
    for (let empleado of empleados) {
      for (let hora of horas) {
        const celdaID = `${empleado}_${hora}`;
        db.ref(`${nombreSemana}/${dia}/${celdaID}`).set("");
      }
    }
  }
}

selectorSemana.addEventListener("change", () => {
  semanaActual = selectorSemana.value;
  renderizarTabla();
});

function renderizarTabla() {
  if (!semanaActual) return;
  tablaContainer.innerHTML = "";

  const tabla = document.createElement("table");
  tabla.className = "tabla-horarios";

  const filaHoras = document.createElement("tr");
  filaHoras.innerHTML = `<th>Empleado</th>`;
  for (let hora of horas) {
    const th = document.createElement("th");
    th.textContent = hora;
    filaHoras.appendChild(th);
  }
  tabla.appendChild(filaHoras);

  for (let empleado of empleados) {
    const fila = document.createElement("tr");
    const tdNombre = document.createElement("td");
tdNombre.textContent = empleado;
tdNombre.style.cursor = "pointer";

tdNombre.addEventListener("click", () => {
  if (!semanaActual || !diaActual) return;

  if (modoSeleccion === "verde" || modoSeleccion === "borrar") {
    const color = modoSeleccion === "verde" ? "green" : "transparent";
    const valor = modoSeleccion === "verde" ? "verde" : "";

    for (let hora of horas) {
      const celdaID = `${empleado}_${hora}`;
      const celda = tabla.querySelector(`[data-celda-id='${celdaID}']`);
      if (celda) {
        celda.style.backgroundColor = color;
        celda.textContent = "";
        db.ref(`${semanaActual}/${diaActual}/${celdaID}`).set(valor);
      }
    }
  }
});

fila.appendChild(tdNombre);



    for (let hora of horas) {
      const td = document.createElement("td");
      const celdaID = `${empleado}_${hora}`;
      td.dataset.celdaId = celdaID;

      db.ref(`${semanaActual}/${diaActual}/${celdaID}`).once("value", (snap) => {
        const valor = snap.val();
        if (valor === "1") {
          td.style.backgroundColor = "orange";
          td.textContent = "1";
        } else if (valor === "0.5") {
          td.style.backgroundColor = "orange";
          td.textContent = "0.5";
        } else if (valor === "verde") {
          td.style.backgroundColor = "green";
        }
      });

// MÓVIL
td.addEventListener("touchstart", (e) => {
  e.preventDefault();
  tocando = true;
  celdasTocadas.clear();
  empleadoPintando = celdaID.split("_")[0];
  aplicarModo(td, celdaID);
});

td.addEventListener("touchmove", (e) => {
  if (!tocando) return;
  const touch = e.touches[0];
  const elem = document.elementFromPoint(touch.clientX, touch.clientY);
  if (elem && elem.tagName === "TD" && elem.dataset.celdaId) {
    const celdaEmpleado = elem.dataset.celdaId.split("_")[0];
    if (celdaEmpleado === empleadoPintando) {
      aplicarModo(elem, elem.dataset.celdaId);
    }
  }
});

td.addEventListener("touchend", () => {
  tocando = false;
  empleadoPintando = null;
});

// PC
td.addEventListener("mousedown", (e) => {
  e.preventDefault();
  tocando = true;
  celdasTocadas.clear();
  empleadoPintando = celdaID.split("_")[0];
  aplicarModo(td, celdaID);
});

td.addEventListener("mousemove", (e) => {
  if (!tocando) return;
  const celdaEmpleado = celdaID.split("_")[0];
  if (celdaEmpleado === empleadoPintando) {
    aplicarModo(td, celdaID);
  }
});

document.addEventListener("mouseup", () => {
  tocando = false;
  empleadoPintando = null;
});



      fila.appendChild(td);
    }

    tabla.appendChild(fila);
  }

  tablaContainer.appendChild(tabla);

  cargarSelectorEmpleado();

  // ✅ Añade esto
  renderizarResumenEmpleado();
}


function aplicarModo(td, celdaID) {
  if (!semanaActual || !diaActual || !modoSeleccion || celdasTocadas.has(celdaID)) return;

  let valor = "";
  let color = "transparent";

  switch (modoSeleccion) {
    case "uno":
      valor = "1";
      color = "orange";
      break;
    case "ceroCinco":
      valor = "0.5";
      color = "orange";
      break;
    case "verde":
      valor = "verde";
      color = "green";
      break;
    case "borrar":
      valor = "";
      color = "transparent";
      break;
  }

  td.textContent = ["1", "0.5"].includes(valor) ? valor : "";
  td.style.backgroundColor = color;
  db.ref(`${semanaActual}/${diaActual}/${celdaID}`).set(valor);

  celdasTocadas.add(celdaID);
}


// Inicializar si hay semanas previas
function cargarSemanasExistentes() {
  db.ref().once("value", (snap) => {
    const data = snap.val();
    const semanas = [];

    for (let key in data) {
      if (key.startsWith("horario_semana_")) {
        const fecha = data[key]._fecha;
        if (!fecha) continue;
        semanas.push({ key, fecha });
      }
    }

    // Ordenar por fecha cronológica (ascendente)
    semanas.sort((a, b) => {
      const [d1, m1, y1] = a.fecha.split("/").map(Number);
      const [d2, m2, y2] = b.fecha.split("/").map(Number);
      return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
    });

    selectorSemana.innerHTML = "";
    for (let { key, fecha } of semanas) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = fecha;
      selectorSemana.appendChild(opt);
    }

    // Recuperar selección previa
    const ultimaSeleccion = localStorage.getItem("semanaSeleccionada");

    if (ultimaSeleccion && [...selectorSemana.options].some(opt => opt.value === ultimaSeleccion)) {
      selectorSemana.value = ultimaSeleccion;
    } else if (semanas.length > 0) {
      // Seleccionar la más reciente si no hay guardada
      selectorSemana.value = semanas[semanas.length - 1].key;
    }

    semanaActual = selectorSemana.value;
    renderizarTabla();
    renderizarResumenEmpleado();
  });
}

function eliminarSemanaActual() {
  if (!semanaActual) return;

  const confirmacion = confirm("¿Seguro que quieres eliminar esta semana?");
  if (!confirmacion) return;
db.ref().once("value", (snapTodas) => {
  const semanas = snapTodas.val();


});

  db.ref(semanaActual).remove().then(() => {
    // Eliminar del selector
    const opcion = [...selectorSemana.options].find(opt => opt.value === semanaActual);
    if (opcion) opcion.remove();

    semanaActual = null;
    tablaContainer.innerHTML = "";
    alert("Semana eliminada correctamente.");
  });
}


window.addEventListener("DOMContentLoaded", () => {
  const rol = localStorage.getItem("rol");
  const nombre = localStorage.getItem("nombre");

  window.esJefa = rol === "jefa" || ["charly", "lorena"].includes(nombre?.toLowerCase());

  if (!window.esJefa) {
    document.querySelectorAll(".zona-edicion").forEach(el => {
      el.style.display = "none";
    });
    const modo = document.getElementById("modoSeleccion");
    if (modo) modo.style.display = "none";
    modoSeleccion = null;
  }

  cargarSemanasExistentes();
  cargarSelectorEmpleado();

  // Botones de navegación de día
  const btnAnterior = document.getElementById("diaAnterior");
  const btnSiguiente = document.getElementById("diaSiguiente");

  if (btnAnterior && btnSiguiente) {
    btnAnterior.addEventListener("click", () => cambiarDia(-1));
    btnSiguiente.addEventListener("click", () => cambiarDia(1));
  } else {
    console.warn("⚠️ Botones de navegación de día no encontrados en el DOM.");
  }



});




const selectorEmpleado = document.getElementById("selectorEmpleado");
const resumenEmpleado = document.getElementById("resumenEmpleado");

function cargarSelectorEmpleado() {
  const nombreUsuario = localStorage.getItem("nombre");

  selectorEmpleado.innerHTML = ""; // Limpiar

  // Añadir "Resumen general" siempre
  const general = document.createElement("option");
  general.value = "__general__";
  general.textContent = "Resumen general";
  selectorEmpleado.appendChild(general);

  empleados.forEach(nombre => {
    const opt = document.createElement("option");
    opt.value = nombre;
    opt.textContent = nombre;
    selectorEmpleado.appendChild(opt);
  });

  // Selección automática del usuario logueado si existe en la lista
  if (nombreUsuario && empleados.includes(nombreUsuario)) {
    selectorEmpleado.value = nombreUsuario;
  }

  renderizarResumenEmpleado();
}

selectorEmpleado.addEventListener("change", renderizarResumenEmpleado);
selectorSemana.addEventListener("change", renderizarResumenEmpleado);

function renderizarResumenEmpleado() {
  const nombre = selectorEmpleado.value;
  if (!semanaActual || !nombre) return;

  if (nombre === "__general__") {
    renderizarResumenGeneral();
    return;
  }

  const fechaSemana = selectorSemana.selectedOptions[0]?.textContent;
  const [diaInicio, mesSeleccionado, anioSeleccionado] = fechaSemana.split("/");

  let totalSemana = 0;
  let diasLibres = 0;
  let resumenDiario = [];
  let totalMes = 0;
  let totalAnio = 0;
  let totalGeneral = 0;
  let mañanasMes = 0;
  let tardesMes = 0;
  let diasLibresListado = [];

  db.ref().once("value", (snapTodas) => {
    const semanas = snapTodas.val();

    for (let key in semanas) {
      if (!key.startsWith("horario_semana_")) continue;

      const datosSemana = semanas[key];
      const fechaGuardada = datosSemana._fecha;
      if (!fechaGuardada) continue;

      const [diaInicioStr, mm, aaaa] = fechaGuardada.split("/");
      const baseDate = new Date(`${aaaa}-${mm}-${diaInicioStr}`);
      const datosDias = Object.entries(datosSemana).filter(([k]) => !k.startsWith("_"));

      for (let [dia, celdas] of datosDias) {
        if (!celdas) continue;

        let horasDia = 0;
        let ultimaHora = null;

        for (let hora of horas) {
          const celdaID = `${nombre}_${hora}`;
          const valor = celdas[celdaID];
          if (valor === "1" || valor === "0.5") {
            horasDia += parseFloat(valor);
            ultimaHora = hora;
          }
        }

        const indexDia = ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"].indexOf(dia);
        const fechaReal = new Date(baseDate);
        fechaReal.setDate(baseDate.getDate() + indexDia);

        if (fechaReal.getFullYear() === parseInt(anioSeleccionado)) totalAnio += horasDia;
        if (
          fechaReal.getMonth() + 1 === parseInt(mesSeleccionado) &&
          fechaReal.getFullYear() === parseInt(anioSeleccionado)
        ) {
          totalMes += horasDia;
          if (ultimaHora) {
            const horaFin = parseInt(ultimaHora.split("-")[1]);
            if (horaFin <= 16) mañanasMes++;
            else tardesMes++;
          }
        }

        totalGeneral += horasDia;
      }
    }

    const datosSemanaActual = semanas[semanaActual];
    if (!datosSemanaActual) return;

    const diasValidos = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
    for (let dia of diasValidos) {
      const celdas = datosSemanaActual[dia];
      if (!celdas) continue;

      let horasDia = 0;
      let compañeros = {};
      let verdes = 0;
      let totalCeldas = 0;

      for (let key in celdas) {
        if (key.startsWith(nombre + "_")) {
          totalCeldas++;
          const valor = celdas[key];
          if (valor === "1") horasDia += 1;
          else if (valor === "0.5") horasDia += 0.5;
          if (valor === "verde") verdes++;
        }
      }

if (verdes === totalCeldas && totalCeldas > 0) {
  diasLibres++;
  if (!diasLibresListado.includes(dia)) {
    diasLibresListado.push(dia);
  }
}

      if (horasDia > 0) totalSemana += horasDia;

      if (horasDia > 3) {
        for (let hora of horas) {
          const celdaID = `${nombre}_${hora}`;
          const valor = celdas[celdaID];
          if (valor === "1" || valor === "0.5") {
            for (let key in celdas) {
              if (key !== celdaID && key.endsWith(`_${hora}`)) {
                const otro = key.split("_")[0];
                const valorOtro = celdas[key];
                if (otro !== nombre && (valorOtro === "1" || valorOtro === "0.5")) {
                  compañeros[otro] = (compañeros[otro] || 0) + 1;
                }
              }
            }
          }
        }
      }

      const coincidenciasFiltradas = Object.entries(compañeros)
        .filter(([_, horasCoincididas]) => horasCoincididas > 2)
        .map(([nombre]) => nombre);

      resumenDiario.push(`• ${dia}: ${horasDia}h ${coincidenciasFiltradas.length > 0 ? `(con: ${coincidenciasFiltradas.join(", ")})` : ""}`);
    }

    resumenEmpleado.innerHTML = `
      <strong>${nombre}</strong><br>
      🕓 Horas esta semana: <strong>${totalSemana}</strong><br>
      📆 Total mes: ${totalMes}h / año: ${totalAnio}h<br>
      🧮 Total acumulado: ${totalGeneral}h<br>
      🌅 Mañanas este mes: ${mañanasMes} / 🌇 Tardes: ${tardesMes}<br>
      🤝 Trabaja con:<br>${resumenDiario.join("<br>")}<br>
💤 Días libres (${diasLibres}): ${diasLibresListado.map(d => d[0].toUpperCase() + d.slice(1)).join(", ")}
    `;

    for (let dia of diasValidos) {
  const celdas = datosSemanaActual[dia];
  if (!celdas) continue;

  let total = 0;
  let verdes = 0;

  for (let hora of horas) {
    const celdaID = `${nombre}_${hora}`;
    const valor = celdas?.[celdaID];
    if (valor) total++;
    if (valor === "verde") verdes++;
  }

  const esDiaLibre = total > 0 && verdes === total;

  const fechaActual = new Date();
  const diaSemanaActual = fechaActual.toLocaleDateString("es-ES", { weekday: 'long' }).toLowerCase();
  const esHoy = dia === diaSemanaActual;

  const claseDiaLibre = esDiaLibre ? "dia-libre" : "";
  const claseHoy = esHoy ? "dia-hoy" : "";
  const claseUsuario = "usuario-actual"; // ya es su resumen, así que siempre se aplica

  const inicialesDias = {
    lunes: "L",
    martes: "M",
    miércoles: "X",
    jueves: "J",
    viernes: "V",
    sábado: "S",
    domingo: "D"
  };

  tablaMini += `<tr class="${claseDiaLibre} ${claseHoy} ${claseUsuario}"><td>${inicialesDias[dia]}</td>`;

  for (let hora of horas) {
    const celdaID = `${nombre}_${hora}`;
    const valor = celdas?.[celdaID];
    let clase = "";
    if (valor === "1" || valor === "0.5") clase = "trabajo";
    tablaMini += `<td class="${clase}">${(valor === "1" || valor === "0.5") ? valor : ""}</td>`;
  }

  tablaMini += "</tr>";
}


    tablaMini += "</table>";
    document.getElementById("miniTurnoEmpleado").innerHTML = tablaMini;
  });
}



function renderizarResumenGeneral() {
  const fechaSemana = selectorSemana.selectedOptions[0]?.textContent;
  const [_, mesActual, anioActual] = fechaSemana.split("/");

  db.ref().once("value", (snap) => {
    const todasLasSemanas = snap.val();
    const resumen = {};

    for (let empleado of empleados) {
      resumen[empleado] = {
        semana: 0,
        mes: 0,
        mañanas: 0,
        tardes: 0,
        diasLibres: 0
      };
    }

    for (let key in todasLasSemanas) {
      if (!key.startsWith("horario_semana_")) continue;
      const semana = todasLasSemanas[key];
      const fecha = semana._fecha;
      if (!fecha) continue;

      const [__, mm, aaaa] = fecha.split("/");
      const esMismaSemana = key === semanaActual;
      const esMismoMes = mm === mesActual && aaaa === anioActual;

      const dias = Object.entries(semana).filter(([k]) => !k.startsWith("_"));
      for (let [dia, celdas] of dias) {
        for (let empleado of empleados) {
          let horasDia = 0;
          let verdes = 0;
          let total = 0;
          let ultimaHora = null;

for (let hora of horas) {
  const celdaID = `${empleado}_${hora}`;
  const valor = celdas?.[celdaID];
  if (valor === "1" || valor === "0.5") {
    horasDia += parseFloat(valor);
    ultimaHora = hora;
  } else if (valor === "verde") {
    verdes++;
  }
  if (valor) total++;
}


          if (esMismaSemana) resumen[empleado].semana += horasDia;
          if (esMismoMes) resumen[empleado].mes += horasDia;

          if (esMismoMes && total === verdes && total > 0) {
            resumen[empleado].diasLibres++;
          }

if (esMismoMes && ultimaHora && horasDia > 0) {
  const fin = parseInt(ultimaHora.split("-")[1]);
  if (fin <= 16) resumen[empleado].mañanas++;
  else resumen[empleado].tardes++;
}

        }
      }
    }

    // Mostrar tabla
let tabla = `
  <table class="tabla-resumen-general">
    <thead>
      <tr>
        <th>👤 Empleado</th>
        <th>🕓 Semana</th>
        <th>📆 Mes</th>
        <th>🌅 Mañanas</th>
        <th>🌇 Tardes</th>
        <th>💤 Libres</th>
      </tr>
    </thead>
    <tbody>
`;

for (let empleado of empleados) {
  const r = resumen[empleado];
  tabla += `
    <tr>
      <td><strong>${empleado}</strong></td>
      <td>${r.semana}</td>
      <td>${r.mes}</td>
      <td>${r.mañanas}</td>
      <td>${r.tardes}</td>
      <td>${r.diasLibres}</td>
    </tr>
  `;
}

tabla += `
    </tbody>
  </table>
`;

resumenEmpleado.innerHTML = tabla;
// ✅ Espera a que la semana actual esté completamente cargada
const datosSemanaActual = todasLasSemanas[semanaActual];
if (datosSemanaActual) {
  generarTablaResumenHorariosPorDia(datosSemanaActual);
} else {
  console.warn("⚠️ Semana actual no encontrada para resumen diario");
}

document.getElementById("miniTurnoEmpleado").innerHTML = "";


  });
}

function cargarIntercambioTurno() {
  const semanaSel = document.getElementById("semanaIntercambio");
  const origenSel = document.getElementById("empleadoOrigen");
  const destinoSel = document.getElementById("empleadoDestino");

  // Cargar semanas
  db.ref().once("value", (snap) => {
    const data = snap.val();
    semanaSel.innerHTML = "";
    for (let key in data) {
      if (key.startsWith("horario_semana_")) {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = data[key]._fecha || key.replace("horario_semana_", "").replaceAll("-", "/");
        semanaSel.appendChild(opt);
      }
    }
  });

  // Cargar empleados actualizados
  if (typeof empleados !== "undefined") {
    [origenSel, destinoSel].forEach(sel => {
      sel.innerHTML = "";
      empleados.forEach(nombre => {
        const opt = document.createElement("option");
        opt.value = nombre;
        opt.textContent = nombre;
        sel.appendChild(opt);
      });
    });
  }
}

function intercambiarTurno() {
  const semana = document.getElementById("semanaIntercambio").value;
  const dia = document.getElementById("diaIntercambio").value;
  const de = document.getElementById("empleadoOrigen").value;
  const a = document.getElementById("empleadoDestino").value;

  if (!semana || !dia || !de || !a || de === a) {
    alert("Selecciona empleados distintos y todos los campos.");
    return;
  }

  db.ref(`${semana}/${dia}`).once("value", (snap) => {
    const datos = snap.val();
    if (!datos) return;

    const nuevosDatos = {};
    for (let hora of horas) {
      const fromID = `${de}_${hora}`;
      const toID = `${a}_${hora}`;
      nuevosDatos[fromID] = "";
      nuevosDatos[toID] = datos[fromID] || "";
    }

    db.ref(`${semana}/${dia}`).update(nuevosDatos).then(() => {
      alert("✅ Turno intercambiado.");
      renderizarTabla();
    });
  });
}



function intercambiarTurno() {
  const semana = document.getElementById("semanaIntercambio").value;
  const dia = document.getElementById("diaIntercambio").value;
  const de = document.getElementById("empleadoOrigen").value;
  const a = document.getElementById("empleadoDestino").value;

  if (!semana || !dia || !de || !a || de === a) {
    alert("Selecciona empleados distintos y todos los campos.");
    return;
  }

  db.ref(`${semana}/${dia}`).once("value", (snap) => {
    const datos = snap.val();
    if (!datos) return;

    const actualizaciones = {};

    for (let hora of horas) {
      const idDe = `${de}_${hora}`;
      const idA = `${a}_${hora}`;
      const valorDe = datos[idDe] || "";
      const valorA = datos[idA] || "";

      // Intercambio
      actualizaciones[idDe] = valorA;
      actualizaciones[idA] = valorDe;
    }

    db.ref(`${semana}/${dia}`).update(actualizaciones).then(() => {
      alert("🔁 Turno intercambiado correctamente.");
      renderizarTabla();
    });
  });
}

function agregarNuevoEmpleado(nombre) {
  if (!nombre || typeof nombre !== 'string') return;

  if (!empleados.includes(nombre)) {
    empleados.push(nombre);
  }

  const selectorEmpleado = document.getElementById("selectorEmpleado");
  if (selectorEmpleado && ![...selectorEmpleado.options].some(opt => opt.value === nombre)) {
    const opt = document.createElement("option");
    opt.value = nombre;
    opt.textContent = nombre;
    selectorEmpleado.appendChild(opt);
  }

  if (!Object.values(usuarios).includes(nombre)) {
    const nuevoCodigo = generarCodigoLibre();
    usuarios[nuevoCodigo] = nombre;
    db.ref(`empleados/${nuevoCodigo}`).set(nombre);
  }

  renderizarTabla?.();
}

function generarCodigoLibre() {
  let nuevoCodigo = 1000;
  while (usuarios[nuevoCodigo]) nuevoCodigo++;
  return nuevoCodigo;
}

function agregarDesdeInput() {
  const nombre = document.getElementById("nuevoNombre").value.trim();
  const codigo = document.getElementById("nuevoCodigo").value.trim();

  if (!nombre || !codigo) {
    alert("Por favor, introduce nombre y código.");
    return;
  }

  if (usuarios[codigo]) {
    alert("Ese código ya está en uso.");
    return;
  }

  db.ref(`empleados/${codigo}`).set(nombre).then(() => {
    alert("Empleado añadido correctamente.");
    usuarios[codigo] = nombre;
    if (!empleados.includes(nombre)) empleados.push(nombre);
    cargarSelectorEmpleado?.();
    renderizarTabla?.();
    cerrarModalEmpleado();
  }).catch(err => {
    alert("Error al guardar en Firebase: " + err.message);
  });
}

function abrirModalEmpleado() {
  const modal = document.getElementById("modalEmpleado");
  const tabla = document.getElementById("tablaEmpleados");
  if (!modal || !tabla || !window.usuarios) return;

  const tbody = tabla.querySelector("tbody");
  tbody.innerHTML = "";

  const ordenDeseado = ["Lorena", "Juan", "Leti", "Charly", "Bryant", "Rocio", "Natalia", "Sergio"];

  const entradas = Object.entries(window.usuarios).filter(([codigo]) => parseInt(codigo) !== 1306);

  entradas.sort(([, nombreA], [, nombreB]) => {
    const iA = ordenDeseado.indexOf(nombreA);
    const iB = ordenDeseado.indexOf(nombreB);
    return (iA === -1 ? Infinity : iA) - (iB === -1 ? Infinity : iB);
  });

  for (const [codigo, nombre] of entradas) {
    const fila = document.createElement("tr");

    const tdNombre = document.createElement("td");
    const inputNombre = document.createElement("input");
    inputNombre.type = "text";
    inputNombre.value = nombre;
    tdNombre.appendChild(inputNombre);

    const tdCodigo = document.createElement("td");
    const inputCodigo = document.createElement("input");
    inputCodigo.type = "number";
    inputCodigo.value = codigo;
    tdCodigo.appendChild(inputCodigo);

    fila.appendChild(tdNombre);
    fila.appendChild(tdCodigo);
    tbody.appendChild(fila);
  }

  modal.style.display = "block";
}



function guardarCambiosTabla() {
  const filas = document.querySelectorAll("#tablaEmpleados tbody tr");
  const nuevosDatos = {};

  for (let fila of filas) {
    const nombre = fila.children[0].querySelector("input").value.trim();
    const codigo = fila.children[1].querySelector("input").value.trim();

    if (!nombre || !codigo) {
      alert("Hay campos vacíos.");
      return;
    }

    if (nuevosDatos[codigo]) {
      alert(`El código ${codigo} está duplicado.`);
      return;
    }

    nuevosDatos[codigo] = nombre;
  }

  db.ref("empleados").set(nuevosDatos).then(() => {
    alert("Cambios guardados correctamente.");
    usuarios = nuevosDatos;
    empleados = Object.values(nuevosDatos).filter(n => n.toLowerCase() !== "jefa");
    cargarSelectorEmpleado?.();
    renderizarTabla?.();
    cerrarModalEmpleado();
  }).catch(err => {
    alert("Error al guardar: " + err.message);
  });
}

function cerrarModalEmpleado() {
  document.getElementById("modalEmpleado").style.display = "none";
}

window.addEventListener("click", function (e) {
  const modal = document.getElementById("modalEmpleado");
  if (e.target === modal) cerrarModalEmpleado();
});


// 👇 Asegura que los botones con onclick funcionen
window.abrirModalEmpleado = abrirModalEmpleado;
window.agregarDesdeInput = agregarDesdeInput;
window.guardarCambiosTabla = guardarCambiosTabla;
window.cerrarModalEmpleado = cerrarModalEmpleado;

const td = document.createElement("td");

if (bloques.length === 0) {
  const verdes = horas.every(h => datosSemana?.[dia]?.[`${empleado}_${h}`] === "verde");
  td.textContent = verdes ? "Libre" : "";
} else {
  const inicio = bloques[0].hora.split("-")[0];
  let finRaw = bloques.at(-1).hora.split("-")[1];
  if (bloques.at(-1).peso === 0.5) {
    const [h] = finRaw.split(":");
    finRaw = `${parseInt(h) - 1}:30`;
  }

  const texto = `${inicio === "7" ? "7:30" : inicio.padStart(2, "0")}:00–${finRaw}:00`;
  td.textContent = texto.replace("--", "-");
}

// 👇 Hacer celdas editables solo para jefa o Charly
if (window.esJefa) {
  td.contentEditable = true;
  td.style.backgroundColor = "#ffffe0";
  td.dataset.dia = dia;
  td.dataset.empleado = empleado;

  td.addEventListener("blur", async () => {
    const texto = td.textContent.trim().toLowerCase();
    const dia = td.dataset.dia;
    const empleado = td.dataset.empleado;
    const ruta = `${semanaActual}/${dia}`;

    const updates = {};

    // Vacío o 'libre' => limpiar todas
    if (texto === "" || texto === "libre") {
      for (let hora of horas) {
        updates[`${empleado}_${hora}`] = "verde";
      }
    } else {
      // Parsear formato tipo "7:30–14:00"
const match = texto.match(/(\d{1,2}):?(\d{0,2})\s*[–-]\s*(\d{1,2}):?(\d{0,2})/);
      if (!match) {
        alert("Formato inválido. Usa por ejemplo: 7:30–14:00");
        return;
      }

      const [_, hInicio, mInicio, hFin, mFin] = match.map(Number);
      const tInicio = hInicio + (mInicio === 30 ? 0.5 : 0);
      const tFin = hFin + (mFin === 30 ? 0.5 : 0);

      for (let hora of horas) {
        const [h1, h2] = hora.split("-").map(Number);
        const bloque = h1 + 0.5;

        const celdaID = `${empleado}_${hora}`;
        if (bloque > tInicio && bloque <= tFin) {
          updates[celdaID] = "1";
        } else if (bloque === tInicio) {
          updates[celdaID] = "0.5";
        } else {
          updates[celdaID] = "";
        }
      }
    }

if (!window.cambiosPendientes[`${dia}_${empleado}`]) {
  window.cambiosPendientes[`${dia}_${empleado}`] = {};
}
window.marcarCambioPendiente(dia, empleado, updates);
td.style.backgroundColor = "#fff3cd";

  });
}

function generarTablaResumenHorariosPorDia(datosSemana) {
  if (!datosSemana) {
    console.warn("⚠️ No hay datos para la semana actual");
    return;
  }
  console.log("🔍 Ejecutando generarTablaResumenHorariosPorDia", datosSemana);
  console.log("🧩 Resumen diario ejecutado para semana:", semanaActual);

  const dias = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const diaSeleccionado = selectorDia?.value; // para colorear esa columna

  const contenedor = document.createElement("div");
  contenedor.id = "tablaResumenPorDia";

  const tabla = document.createElement("table");
  tabla.className = "tabla-resumen-por-dia";

  // CABECERA: Día en columnas
  const thead = document.createElement("thead");
  const filaCabecera = document.createElement("tr");
filaCabecera.innerHTML = "<th>Empleado</th>" + dias.map(d => {
  const clase = d === diaSeleccionado ? ' class="columna-actual"' : "";
  return `<th${clase}>${d[0].toUpperCase() + d.slice(1)}</th>`;
}).join("");
  thead.appendChild(filaCabecera);
  tabla.appendChild(thead);

  for (let empleado of empleados) {
    const fila = document.createElement("tr");
    const tdNombre = document.createElement("td");
    tdNombre.textContent = empleado;
    fila.appendChild(tdNombre);

    for (let dia of dias) {
const td = document.createElement("td");
if (dia === diaSeleccionado) td.classList.add("columna-actual");      const bloques = [];

      for (let i = 0; i < horas.length; i++) {
        const celdaID = `${empleado}_${horas[i]}`;
        const valor = datosSemana?.[dia]?.[celdaID];
        if (valor === "1" || valor === "0.5") {
          bloques.push({ hora: horas[i], peso: parseFloat(valor) });
        }
      }

      if (bloques.length === 0) {
        const verdes = horas.every(h => datosSemana?.[dia]?.[`${empleado}_${h}`] === "verde");
        td.textContent = verdes ? "Libre" : "";
      } else {
        const inicio = bloques[0].hora.split("-")[0];
        let finRaw = bloques.at(-1).hora.split("-")[1];
        if (bloques.at(-1).peso === 0.5) {
          const finNum = parseInt(finRaw);
          finRaw = `${finNum - 1}:30`;
        }

        const formatear = (h) => h.includes(":") ? h : h + ":00";
        const texto = `${inicio === "7" ? "7:30" : formatear(inicio)}–${formatear(finRaw)}`;
        td.textContent = texto.replace(":00", "").replace(":00", "");
      }

      if (window.esJefa) {
        td.contentEditable = true;
        td.style.backgroundColor = "#ffffe0";
        td.dataset.dia = dia;
        td.dataset.empleado = empleado;

        td.addEventListener("blur", async () => {
          const texto = td.textContent.trim().toLowerCase();
          const dia = td.dataset.dia;
          const empleado = td.dataset.empleado;
          const ruta = `${semanaActual}/${dia}`;
          const updates = {};

          if (texto === "" || texto === "libre") {
            for (let hora of horas) {
              updates[`${empleado}_${hora}`] = "verde";
            }
          } else {
const match = texto.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
            if (!match) {
              alert("Formato inválido. Usa por ejemplo: 7:30–14:00");
              return;
            }

            let [_, hInicio, mInicio, hFin, mFin] = match;
            hInicio = parseInt(hInicio);
            hFin = parseInt(hFin);
            mInicio = parseInt(mInicio || "0");
            mFin = parseInt(mFin || "0");

            const tInicio = hInicio + (mInicio === 30 ? 0.5 : 0);
            const tFin = hFin + (mFin === 30 ? 0.5 : 0);

            for (let hora of horas) {
              const [h1, h2] = hora.split("-").map(Number);
              const bloque = h1 + 0.5;
              const celdaID = `${empleado}_${hora}`;

              if (bloque > tInicio && bloque <= tFin) {
                updates[celdaID] = "1";
              } else if (bloque === tInicio) {
                updates[celdaID] = "0.5";
              } else {
                updates[celdaID] = "";
              }
            }
          }

if (!window.cambiosPendientes[`${dia}_${empleado}`]) {
  window.cambiosPendientes[`${dia}_${empleado}`] = {};
}
window.marcarCambioPendiente(dia, empleado, updates);
td.style.backgroundColor = "#fff3cd";


        });
      }

      fila.appendChild(td);
    }

    tabla.appendChild(fila);
  }

  contenedor.appendChild(tabla);

  const resumenDiv = document.getElementById("resumenEmpleado");
  if (!resumenDiv) {
    alert("❌ No se encontró el contenedor resumenEmpleado");
    return;
  }

  resumenDiv.appendChild(contenedor);
}
document.getElementById("diaAnterior").addEventListener("click", () => {
  cambiarDia(-1);
});
document.getElementById("diaSiguiente").addEventListener("click", () => {
  cambiarDia(1);
});

function cambiarDia(direccion) {
  const dias = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
  const actual = selectorDia.value;
  const index = dias.indexOf(actual);
  if (index === -1) return;

  let nuevoIndex = index + direccion;
  if (nuevoIndex < 0) nuevoIndex = dias.length - 1;
  if (nuevoIndex >= dias.length) nuevoIndex = 0;

  selectorDia.value = dias[nuevoIndex];
  diaActual = dias[nuevoIndex];
  renderizarTabla();

  console.log("➡️ Día cambiado a:", diaActual);
}

window.mostrarNotificacion = function(titulo, cuerpo = "") {
  if (Notification.permission !== "granted") {
    console.warn("🚫 Notificación no lanzada: sin permisos");
    return;
  }

  console.log("📨 Lanzando notificación:", titulo, cuerpo);

  try {
    navigator.vibrate?.([200, 100, 200]);
    new Notification(titulo, {
      body: cuerpo,
      icon: "recursos/img/calendario.png",
      tag: "notificacion-prueba",
      renotify: false
    });
  } catch (e) {
    console.error("❌ Error al lanzar notificación:", e);
  }
};

window.reproducirSonido = function() {
  const audio = new Audio("recursos/sonido.mp3");
  audio.play().then(() => {
    console.log("🔊 Sonido reproducido");
  }).catch((e) => {
    console.warn("🔇 No se pudo reproducir sonido:", e);
  });
};
window.guardarCambiosPendientes = async function () {
  const entradas = Object.entries(window.cambiosPendientes);
  if (entradas.length === 0) {
    console.log("➡️ Guardando", entradas)
    alert("No hay cambios pendientes.");
    return;
  }

  for (let [clave, cambios] of entradas) {
    const [dia, empleado] = clave.split("_");
    await db.ref(`${semanaActual}/${dia}`).update(cambios);
  }

  window.cambiosPendientes = {};
  alert("✅ Cambios guardados.");
  renderizarTabla();

  // 🔄 Limpia visualmente las celdas modificadas (opcional)
  document.querySelectorAll("td[style*='background-color: #fff3cd']")
    .forEach(td => td.style.backgroundColor = "");
};
