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
        "Glovo"
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

    return numero.toString(36).toUpperCase();
}

function aplicarCodigoAlfanumerico(codigo) {
    const selects = document.querySelectorAll("#lista-tareas select");
    const base = BigInt(empleados.length);
    let numero;

    try {
        numero = BigInt(codigo, 36);
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

// === QR ===
function mostrarQRConfiguracion() {
    const codigo = generarCodigoAlfanumerico();
    const contenedor = document.getElementById("qr-container");
    contenedor.innerHTML = "";
    const qr = qrcode(0, 'L');
    qr.addData(codigo);
    qr.make();
    contenedor.innerHTML = qr.createImgTag(6);
}

function escanearQRConfiguracion() {
    const video = document.getElementById("video");
    const botonCancelar = document.getElementById("cancelar-qr");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } })
        .then(stream => {
            video.srcObject = stream;
            video.setAttribute("playsinline", true); // evita pantalla completa en móviles
            video.style.display = "block";
            botonCancelar.style.display = "inline-block";
            video.play();

            let cerrado = false;

            const detenerCamara = () => {
                if (cerrado) return;
                cerrado = true;
                clearInterval(intervalo);
                video.pause();
                if (video.srcObject) {
                    video.srcObject.getTracks().forEach(track => track.stop());
                    video.srcObject = null;
                }
                video.style.display = "none";
                botonCancelar.style.display = "none";
            };

            const intervalo = setInterval(() => {
                if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const codigo = jsQR(imageData.data, imageData.width, imageData.height);

                if (codigo) {
                    detenerCamara();
                    aplicarCodigoAlfanumerico(codigo.data.trim().toUpperCase());
                }
            }, 500);

            // Timeout de seguridad
            setTimeout(() => {
                if (!cerrado) detenerCamara();
            }, 30000); // 30 segundos
        })
        .catch(() => {
            alert("No se pudo acceder a la cámara.");
        });
}

function detenerEscaneoQR() {
    const video = document.getElementById("video");
    const botonCancelar = document.getElementById("cancelar-qr");
    clearInterval(intervalo);
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    video.style.display = "none";
    botonCancelar.style.display = "none";
}

window.onload = renderizarTareas;
