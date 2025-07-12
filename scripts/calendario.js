// Este objeto guardará los horarios en memoria (pueden venir de un código copiado y aplicado)
let horarios = {};

// Cargar horarios desde localStorage si existen
if (localStorage.getItem("horarios")) {
  try {
    horarios = JSON.parse(localStorage.getItem("horarios"));
  } catch (e) {
    console.error("Error al cargar horarios:", e);
    horarios = {};
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const empleadoSelect = document.getElementById("empleadoSelect");
  const horarioVisualizado = document.getElementById("horarioVisualizado");

  empleadoSelect.addEventListener("change", () => {
    const nombre = empleadoSelect.value;
    if (!nombre) {
      horarioVisualizado.innerHTML = "<p>Selecciona tu nombre para ver tu horario.</p>";
      return;
    }

    const datos = horarios[nombre];

    if (!datos) {
      horarioVisualizado.innerHTML = `<p>No hay horario registrado para ${nombre}.</p>`;
      return;
    }

    // Mostrar horario en formato de tabla simple
    let tabla = `<h3>Horario de ${nombre}</h3><table><thead><tr><th>Día</th><th>Turno</th><th>Compañeros</th></tr></thead><tbody>`;
    datos.forEach(item => {
      tabla += `<tr><td>${item.dia}</td><td>${item.turno}</td><td>${item.companeros}</td></tr>`;
    });
    tabla += "</tbody></table>";

    horarioVisualizado.innerHTML = tabla;
  });

  // Si eres la jefa, puedes generar el código del horario
  const crearHorarioDiv = document.getElementById("crearHorario");
  if (crearHorarioDiv) {
    crearHorarioDiv.innerHTML += `
      <textarea id="inputCodigo" placeholder="Pega aquí el código del horario..." rows="6" style="width: 100%; margin-top: 10px;"></textarea>
      <button id="aplicarCodigo">Aplicar código</button>
      <p id="resultadoAplicacion" style="margin-top:10px;"></p>
    `;

    const aplicarBtn = document.getElementById("aplicarCodigo");
    const inputCodigo = document.getElementById("inputCodigo");
    const resultadoAplicacion = document.getElementById("resultadoAplicacion");

    aplicarBtn.addEventListener("click", () => {
      try {
        const nuevo = JSON.parse(inputCodigo.value);
        if (typeof nuevo !== "object") throw "Formato inválido";
        horarios = nuevo;
        localStorage.setItem("horarios", JSON.stringify(horarios));
        resultadoAplicacion.textContent = "✅ Código aplicado correctamente.";
        resultadoAplicacion.style.color = "green";
      } catch (err) {
        resultadoAplicacion.textContent = "❌ Error al aplicar el código. Asegúrate de que esté bien formado.";
        resultadoAplicacion.style.color = "red";
        console.error("Error:", err);
      }
    });
  }
});
const empleados = ["Charly", "Juan", "Leti", "Lorena", "Rocío", "Bryant", "Natalia", "Sergio"];
const horas = Array.from({ length: 15 }, (_, i) => `${7 + i}-${8 + i}`);
const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

let diaActual = 0; // 0 = Lunes
let datosHorario = {}; // Guardamos todos los días aquí

diasSemana.forEach(dia => {
  datosHorario[dia] = {}; // datosHorario["Lunes"]["Charly"]["7-8"] = 1
  empleados.forEach(emp => {
    datosHorario[dia][emp] = {};
    horas.forEach(hora => {
      datosHorario[dia][emp][hora] = ""; // Vacío inicialmente
    });
  });
});

function renderTabla() {
  const tabla = document.getElementById("tablaHorario");
  const nombreDia = document.getElementById("nombreDia");
  const dia = diasSemana[diaActual];
  nombreDia.textContent = dia;

  let html = `<thead><tr><th>Empleado</th>`;
  horas.forEach(h => html += `<th>${h}</th>`);
  html += `</tr></thead><tbody>`;

  empleados.forEach(emp => {
    html += `<tr><td>${emp}</td>`;
    horas.forEach(hora => {
      const valor = datosHorario[dia][emp][hora] || "";
      html += `<td><input type="text" class="turnoInput" data-dia="${dia}" data-emp="${emp}" data-hora="${hora}" value="${valor}" /></td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody>`;
  tabla.innerHTML = html;

  document.querySelectorAll('.turnoInput').forEach(input => {
    input.addEventListener("input", e => {
      const dia = e.target.dataset.dia;
      const emp = e.target.dataset.emp;
      const hora = e.target.dataset.hora;
      datosHorario[dia][emp][hora] = e.target.value;
    });
  });
}

document.getElementById("diaAnterior").addEventListener("click", () => {
  diaActual = (diaActual - 1 + 7) % 7;
  renderTabla();
});
document.getElementById("diaSiguiente").addEventListener("click", () => {
  diaActual = (diaActual + 1) % 7;
  renderTabla();
});

document.addEventListener("DOMContentLoaded", () => {
  const rol = localStorage.getItem("rol");
  if (rol === "jefa") {
    renderTabla();
  }
});
