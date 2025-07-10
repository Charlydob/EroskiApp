const tareas = {
  mañana: [
    "CARGA VARIACIONES DIA",
"CARGA PARAMETROS",
"CARGA BALANZAS",
"COLOCAR VARIACIONES",
"REVISION CALIDAD FRUTERIA",
"REPOSICION FRUTERIA",
"PRODUCCION PANADERIA",
"REPOSICIÓN CAMARA REFRIGERADO",
"REPOSICION CAMARA CONGELADO",
"LIMPIEZA PUERTA ENTRADA",
"LIMPIEZA CRISTALES PUERTAS NEVERAS FRIO",
"LIMPIEZA DE HUECOS SECO",
"REPOSICIÓN ALMACEN SECO",
"LLENADO NEVERAS VENTA CRUZADA",
"CAJERA 1",
"CAJERA 2",
"REALIZAR HOJA DE CAJA",
"REVISION PEDIDO DETALLADO",
"REALIZAR PEDIDO MASAS CONGELADAS (M-J-S)",
"REALIZAR PEDIDO CONSUMIBLES (M-J-S)",
"REALIZAR PEDIDOS PROVEEDORES LOCALES (LUNES)",
"REPOSICIÓN CONGELADO CAMIÓN (M-J-S)",
"REPOSICIÓN FRUTERIA CAMIÓN (M-J-S)",
"REPOSICIÓN CARNICERIA CAMIÓN (M-J-S)",
"REPOSICIÓN PESCA CAMIÓN (M-J-S)",
"REPOSICIÓN CHARCUTERIA CAMIÓN (M-J-S)",
"REPOSICIÓN YOGURES CAMIÓN (M-J-S)",
"REPOSICION PALETS SECO CAMIÓN (M-J-S)",
"FRENTEO Y ADELANTAMIENTO TIENDA",
"LIMPIEZA DE CAJA1",
"LIMPIEZA DE CAJA 2",
"LIMPIEZA OBRADOR",
"ACTUALIZAR STOCK FRUTERIA (LUNES)",
"ACTUALIZAR STOCK CARNICERIA (LUNES)",
"COLOCAR ETIQUETAS OFERTAS (SEGÚN FECHA INICIO)",
"PISTOLEAR ETIQUETAS SIN EAN (MIERCOLES)",
"GLOVO"
],

    tarde: [
    "Caja Principal 1",
    "Caja Apoyo",
    "Reposicion palets seco camión",
    "Hacer negativos",
    "Revisión frutería",
    "Reposición frutería + ensaladas",
    "Llenado neveras venta cruzada",
    "Producción panadería lineal",
    "Reposición cámara refrigerado",
    "Reposición cámara congelado",
    "Reposición almacén seco",
    "Realizar revisión fechas herramienta caducados",
    "Preparación carro panadería día siguiente",
    "Hacer huecos",
    "Hacer negativos al cierre después del APPC",
    "Introducir temperaturas",
    "Hacer APPC",
    "Hacer blisters abono-rutura",
    "Revisión fechas para venta anticipada",
    "Fronteo y adelantamiento de tienda",
    "Llenado de neveras bebida fría al cierre",
    "Cierre y limpieza de caja 1",
    "Cierre y limpieza de caja 2",
    "Limpieza huecos nevera",
    "Limpieza rampas panadería",
    "Limpieza de suelo tienda",
    "Limpieza baños cliente",
    "Limpieza rampas frutería (Lunes)",
    "Limpieza cristales fachada (lunes, miércoles y viernes)",
    "Limpieza horno y bandejas (miércoles)",
    "Limpieza carros y cestas (miércoles)",
    "Imprimir listado ofertas futura (viernes)",
    "Imprimir etiqueta oferta futura (viernes)",
    "Realizar en carros productos oferta futura (viernes)",
    "Emblistar etiquetas oferta futura en Glasspack (lunes)",
    "Quitar etiquetas ofertas finalizadas (según fecha fin)",
    "Realizar auditorías de precios (viernes un pasillo)",
    "Glovo"
  ]
};

const empleados = ["Leti", "Sergio", "Brian", "Rocío", "Juan", "Charly", "Natalia", "Lorena"];
let turnoActual = "mañana";

function renderizarTareas() {
  const lista = document.getElementById("lista-tareas");
  const titulo = document.getElementById("turno-label");
  lista.innerHTML = "";
  titulo.textContent = `📝 Checklist – Turno de ${turnoActual.charAt(0).toUpperCase() + turnoActual.slice(1)}`;

  tareas[turnoActual].forEach(tarea => {
    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    const spanTarea = document.createElement("span");
    spanTarea.textContent = tarea;
    spanTarea.className = "tarea-texto";

    checkbox.addEventListener("change", () => {
      spanTarea.classList.toggle("tachado", checkbox.checked);
    });

    const select = document.createElement("select");
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "-- Empleado --";
    select.appendChild(defaultOption);

    empleados.forEach(nombre => {
      const option = document.createElement("option");
      option.value = nombre;
      option.textContent = nombre;
      select.appendChild(option);
    });

    li.appendChild(checkbox);
    li.appendChild(spanTarea);
    li.appendChild(select);

    lista.appendChild(li);
  });
}

function alternarTurno() {
  turnoActual = turnoActual === "mañana" ? "tarde" : "mañana";
  renderizarTareas();
}

function reiniciarLista() {
  document.querySelectorAll("#lista-tareas input[type='checkbox']").forEach(cb => cb.checked = false);
  document.querySelectorAll("#lista-tareas .tarea-texto").forEach(span => span.classList.remove("tachado"));
  document.querySelectorAll("#lista-tareas select").forEach(sel => sel.selectedIndex = 0);
}

function generarCodigoAlfanumerico() {
  const selects = document.querySelectorAll("#lista-tareas select");
  const base = BigInt(empleados.length + 1);
  let numero = BigInt(0);

  selects.forEach(select => {
    const valor = BigInt(select.selectedIndex);
    numero = numero * base + valor;
  });

  return `${turnoActual}|${numero.toString(36).toUpperCase()}`;
}

function mostrarCodigo() {
  const codigo = generarCodigoAlfanumerico();
  const div = document.getElementById("codigo-generado");
  const input = document.getElementById("input-codigo");
  div.textContent = codigo;
  input.value = codigo;
}

function copiarCodigo() {
  const codigo = document.getElementById("codigo-generado").textContent.trim();
  if (!codigo) return alert("No hay código para copiar.");

  navigator.clipboard.writeText(codigo)
    .then(() => alert("Código copiado al portapapeles."))
    .catch(err => {
      console.error("Error al copiar:", err);
      alert("Error al copiar el código.");
    });
}

function aplicarCodigoAlfanumerico(codigoCompleto) {
  const [turno, cod] = codigoCompleto.split("|");
  if (!turno || !cod || !tareas[turno]) {
    alert("Código inválido");
    return;
  }

  turnoActual = turno;
  renderizarTareas();

  const base = BigInt(empleados.length + 1);
  let numero;
  try {
    numero = BigInt(`0x${parseInt(cod, 36).toString(16)}`);
  } catch {
    alert("Código inválido");
    return;
  }

  const selects = document.querySelectorAll("#lista-tareas select");
  const valores = [];

  for (let i = selects.length - 1; i >= 0; i--) {
    valores[i] = Number(numero % base);
    numero = numero / base;
  }

  selects.forEach((select, i) => {
    select.selectedIndex = valores[i] || 0;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderizarTareas();

  document.getElementById("boton-generar").addEventListener("click", mostrarCodigo);
  document.getElementById("boton-copiar").addEventListener("click", copiarCodigo);
  document.getElementById("boton-aplicar").addEventListener("click", () => {
    const codigo = document.getElementById("input-codigo").value.trim();
    if (!codigo) {
      alert("Introduce un código válido");
      return;
    }
    aplicarCodigoAlfanumerico(codigo);
  });
});
