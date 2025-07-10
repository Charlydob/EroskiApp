// === DATOS ===
const tareas = {
    mañana: [
        "Abrir caja registradora",
        "Limpiar entrada",
        "Reposición de panadería",
        "Comprobar precios de ofertas"
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
        "Glovo",
    ]
};

const empleados = ["Leti", "Sergio", "Brian", "Rocío", "Juan", "Charly", "Natalia", "Lorena"];
let turnoActual = "mañana";

// === RENDER ===
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

// === FUNCIONES ===
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
    const base = BigInt(empleados.length);
    let numero = BigInt(0);

    selects.forEach(select => {
        const valor = BigInt(select.selectedIndex || 0);
        numero = numero * base + valor;
    });

    return numero.toString(36).toUpperCase();  // Ej: "1Z8K9R"
}

function aplicarCodigoAlfanumerico(codigo) {
    const selects = document.querySelectorAll("#lista-tareas select");
    const base = BigInt(empleados.length);
    let numero;

    try {
        numero = BigInt(`0x${BigInt(`0x${codigo}`, 36).toString(16)}`);
    } catch {
        alert("Código inválido");
        return;
    }

    const valores = [];

    for (let i = selects.length - 1; i >= 0; i--) {
        valores[i] = Number(numero % base);
        numero = numero / base;
    }

    selects.forEach((select, i) => {
        select.selectedIndex = valores[i];
    });
}

function copiarCodigoConfiguracion() {
    const codigo = generarCodigoAlfanumerico();
    navigator.clipboard.writeText(codigo)
        .then(() => alert(`Código copiado: ${codigo}`))
        .catch(() => alert("No se pudo copiar el código."));
}

function mostrarCodigoConfiguracion() {
    const codigo = generarCodigoAlfanumerico();
    const output = document.getElementById("codigo-generado");
    output.textContent = `Código actual: ${codigo}`;
}

function aplicarDesdeInput() {
    const input = document.getElementById("input-codigo");
    const valor = input.value.trim().toUpperCase();
    if (valor) {
        aplicarCodigoAlfanumerico(valor);
    } else {
        alert("Introduce un código válido.");
    }
}

window.onload = renderizarTareas;
