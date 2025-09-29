/* == Mantiene lógica original; añade: dataset para modos, ARIA, fix IDs duplicados, lock scroll modal, teclado en celdas == */

const usuarios = window.usuarios || {};
window.usuarios = {};
window.empleados = [];

db.ref().once("value").then((snap) => {
  const root = snap.val() || {};
  const mapa = root.empleados || {};
  const orden = Array.isArray(root[ORDEN_PATH]) ? root[ORDEN_PATH] : [];
  window.usuarios = mapa;

  const entries = Object.entries(mapa);
  const idx = Object.fromEntries(orden.map((c,i)=>[String(c),i]));
  entries.sort(([aCod,aNom],[bCod,bNom])=>{
    const ai = idx[String(aCod)], bi = idx[String(bCod)];
    if (ai===undefined && bi===undefined) return aNom.localeCompare(bNom);
    if (ai===undefined) return 1;
    if (bi===undefined) return -1;
    return ai-bi;
  });

  window.empleados = entries.map(([,nombre]) => nombre);

  cargarSelectorEmpleado?.();
  renderizarTabla?.();
  cargarIntercambioTurno?.();
});

const horas = ["7-8","8-9","9-10","10-11","11-12","12-13","13-14","14-15","15-16","16-17","17-18","18-19","19-20","20-21","21-22"];
const __norm = (s) => (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();

let modoSeleccion = null;
let semanaActual = null;
let diaActual = "lunes";
let celdasTocadas = new Set();
let tocando = false;
let empleadoPintando = null;
let colorPersonalizado = "#00cc66";

const tablaContainer = document.getElementById("tablaHorarioContainer");
const selectorSemana = document.getElementById("selectorSemana");
const selectorDia = document.getElementById("selectorDia");

const diasSemana = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const hoy = new Date();
const diaActualNombre = diasSemana[hoy.getDay()];
selectorDia.value = diaActualNombre;
diaActual = diaActualNombre;

const OCULTOS_PATH = "empleados_ocultos";
window.empleadosOcultos = new Set();

async function cargarEmpleadosOcultos() {
  const mapa = (await db.ref(OCULTOS_PATH).once("value")).val() || {};
  window.empleadosOcultos = new Set(
    Object.entries(mapa).filter(([,v])=>!!v).map(([k])=>String(k))
  );
}

function codigoPorNombre(nombre) {
  nombre = (nombre||"").trim().toLowerCase();
  for (const [cod, nom] of Object.entries(window.usuarios||{})) {
    if ((nom||"").trim().toLowerCase() === nombre) return String(cod);
  }
  return null;
}
function esEmpleadoOcultoPorNombre(nombre){
  const cod = codigoPorNombre(nombre);
  return cod ? window.empleadosOcultos.has(cod) : false;
}

// API para ocultar/mostrar desde consola o UI
window.setEmpleadoOculto = async function(codigo, oculto=true){
  await db.ref(`${OCULTOS_PATH}/${String(codigo)}`).set(!!oculto);
  await cargarEmpleadosOcultos();
  // refrescar UI
  try { await window.cargarSelectorEmpleado?.(); } catch {}
  try { await window.renderizarTabla?.(); } catch {}
};

window.cambiosPendientes = {};
window.timeoutAutoGuardar = null;

window.guardarCambiosPendientes = async function () {
  const entradas = Object.entries(window.cambiosPendientes);
  if (entradas.length === 0) { alert("No hay cambios pendientes."); return; }
  for (let [clave, cambios] of entradas) {
    const [dia, empleado] = clave.split("_");
    await db.ref(`${semanaActual}/${dia}`).update(cambios);
  }
  window.cambiosPendientes = {};
  alert("✅ Cambios guardados.");
  renderizarTabla();
  document.querySelectorAll("td[style*='#fff3cd']").forEach(td => td.style.backgroundColor = "");
};

window.marcarCambioPendiente = function (dia, empleado, updates) {
  const clave = `${dia}_${empleado}`;
  if (!window.cambiosPendientes[clave]) window.cambiosPendientes[clave] = {};
  Object.assign(window.cambiosPendientes[clave], updates);
  clearTimeout(window.timeoutAutoGuardar);
  window.timeoutAutoGuardar = setTimeout(() => window.guardarCambiosPendientes(), 10000);
};

selectorDia.addEventListener("change", () => { diaActual = selectorDia.value; renderizarTabla(); });

/* ====== MODOS (dataset + ARIA + IDs únicos) ====== */
const contModo = document.getElementById("modoSeleccion");
const colorWrapperMain = document.getElementById("colorWrapperMain");
const colorWrapperGhost = document.getElementById("colorWrapperGhost");
const colorPicker = document.getElementById("colorPicker");

function activarBoton(btn){
  contModo?.querySelectorAll("button").forEach(b => { b.classList.remove("modo-activo"); b.setAttribute("aria-pressed","false"); });
  if (btn){ btn.classList.add("modo-activo"); btn.setAttribute("aria-pressed","true"); }
}

function setModo(modo) {
  modoSeleccion = modo;
  if (modo === "personalizado") {
    colorPersonalizado = colorPicker?.value || "#00cc66";
    colorWrapperMain && (colorWrapperMain.classList.add("modo-activo"));
  } else {
    colorWrapperMain && colorWrapperMain.classList.remove("modo-activo");
  }
  const btn = contModo?.querySelector(`button[data-modo="${modo}"]`);
  activarBoton(btn);
}

contModo?.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-modo]");
  if (!b) return;
  setModo(b.dataset.modo);
});

colorPicker?.addEventListener("change", () => {
  colorPersonalizado = colorPicker.value;
  if (colorWrapperMain) colorWrapperMain.style.backgroundColor = colorPersonalizado;
  setModo("personalizado");
});
[colorWrapperMain, colorWrapperGhost].forEach(el => el?.addEventListener("click", () => setModo("personalizado")));

/* ====== PINTADO ====== */
function aplicarModo(td, celdaID) {
  if (!semanaActual || !diaActual || !modoSeleccion || celdasTocadas.has(celdaID)) return;

  let valor = "", color = "transparent";
  switch (modoSeleccion) {
    case "uno": valor = "1"; color = "orange"; break;
    case "ceroCinco": valor = "0.5"; color = "orange"; break;
    case "personalizado": color = colorPersonalizado || "#00cc66"; valor = color; break;
    case "borrar": valor = ""; color = "transparent"; break;
  }

  td.textContent = ["1","0.5"].includes(valor) ? valor : "";
  td.style.backgroundColor = color;
  db.ref(`${semanaActual}/${diaActual}/${celdaID}`).set(valor);
  celdasTocadas.add(celdaID);
}

async function aplicarModoFilaCompleta(nombreEmpleado, valor) {
  if (!semanaActual || !diaActual) return;
  const updates = {};
  for (const h of (window.horas||[])) {
    updates[`${semanaActual}/${diaActual}/${nombreEmpleado}_${h}`] = valor;
  }
  await db.ref().update(updates);
  renderizarTabla?.();
}

/* ====== CREAR SEMANA ====== */
function crearNuevaSemana() {
  let fecha = prompt("Introduce la fecha de inicio de semana (dd/mm/aaaa):");
  if (!fecha) return;
  const fechaNormalizada = fecha.replaceAll("/", "-");
  const nombreSemana = `horario_semana_${fechaNormalizada}`;
  if ([...selectorSemana.options].some(opt => opt.value === nombreSemana)) { alert("Ya existe un horario para esa semana."); return; }
  const opt = document.createElement("option"); opt.value = nombreSemana; opt.textContent = fecha;
  selectorSemana.appendChild(opt); selectorSemana.value = nombreSemana;
  semanaActual = nombreSemana;
  inicializarSemana(nombreSemana);
  db.ref(`${nombreSemana}/_fecha`).set(fecha);
  renderizarTabla(); renderizarResumenEmpleado();
}

function inicializarSemana(nombreSemana) {
  const dias = ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"];
  for (let dia of dias) for (let empleado of empleados) for (let hora of horas) {
    db.ref(`${nombreSemana}/${dia}/${empleado}_${hora}`).set("");
  }
}

selectorSemana.addEventListener("change", () => { semanaActual = selectorSemana.value; renderizarTabla(); });

/* ====== RENDER TABLA ====== */
function renderizarTabla() {
  if (!semanaActual) return;
  tablaContainer.innerHTML = "";

  const tabla = document.createElement("table");
  tabla.className = "tabla-horarios";

  const filaHoras = document.createElement("tr");
  filaHoras.innerHTML = `<th>Empleado</th>`;
  for (let hora of horas) { const th = document.createElement("th"); th.textContent = hora; filaHoras.appendChild(th); }
  tabla.appendChild(filaHoras);

  for (let empleado of empleados) {
    const fila = document.createElement("tr");
    const tdNombre = document.createElement("td");
    tdNombre.textContent = empleado;
    tdNombre.style.cursor = "pointer";

    tdNombre.addEventListener("click", () => {
      if (!semanaActual || !diaActual || !modoSeleccion) return;
      let color, valor;
      switch (modoSeleccion) {
        case "borrar": color = "transparent"; valor = ""; break;
        case "personalizado": color = colorPersonalizado || "#00cc66"; valor = color; break;
        default: return;
      }
      for (let hora of horas) {
        const celdaID = `${empleado}_${hora}`;
        const celda = tabla.querySelector(`[data-celda-id='${celdaID}']`);
        if (celda) {
          celda.style.backgroundColor = color;
          celda.textContent = "";
          db.ref(`${semanaActual}/${diaActual}/${celdaID}`).set(valor);
        }
      }
    });
    fila.appendChild(tdNombre);

    for (let hora of horas) {
      const td = document.createElement("td");
      td.tabIndex = 0; // foco teclado
      const celdaID = `${empleado}_${hora}`;
      td.dataset.celdaId = celdaID;

      db.ref(`${semanaActual}/${diaActual}/${celdaID}`).once("value", (snap) => {
        const valor = snap.val();
        if (valor === "1") { td.style.backgroundColor = "orange"; td.textContent = "1"; }
        else if (valor === "0.5") { td.style.backgroundColor = "orange"; td.textContent = "0.5"; }
        else if (valor === "verde") { td.style.backgroundColor = "green"; }
        else if (typeof valor === "string" && valor.startsWith("#")) { td.style.backgroundColor = valor; td.textContent = ""; }
      });

      // táctil
      td.addEventListener("touchstart", (e) => { e.preventDefault(); tocando = true; celdasTocadas.clear(); empleadoPintando = celdaID.split("_")[0]; aplicarModo(td, celdaID); }, {passive:false});
      td.addEventListener("touchmove", (e) => {
        if (!tocando) return;
        const t = e.touches[0];
        const elem = document.elementFromPoint(t.clientX, t.clientY);
        if (elem && elem.tagName === "TD" && elem.dataset.celdaId) {
          const emp = elem.dataset.celdaId.split("_")[0];
          if (emp === empleadoPintando) aplicarModo(elem, elem.dataset.celdaId);
        }
      }, {passive:true});
      td.addEventListener("touchend", () => { tocando = false; empleadoPintando = null; });

      // ratón
      td.addEventListener("mousedown", (e) => { e.preventDefault(); tocando = true; celdasTocadas.clear(); empleadoPintando = celdaID.split("_")[0]; aplicarModo(td, celdaID); });
      td.addEventListener("mousemove", () => { if (!tocando) return; const emp = celdaID.split("_")[0]; if (emp === empleadoPintando) aplicarModo(td, celdaID); });

      fila.appendChild(td);
    }
    tabla.appendChild(fila);
  }

  tablaContainer.appendChild(tabla);
  cargarSelectorEmpleado();
  renderizarResumenEmpleado();
}
document.addEventListener("mouseup", () => { tocando = false; empleadoPintando = null; });

/* ====== SEMANAS EXISTENTES ====== */
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
    semanas.sort((a,b) => {
      const [d1,m1,y1] = a.fecha.split("/").map(Number);
      const [d2,m2,y2] = b.fecha.split("/").map(Number);
      return new Date(y1,m1-1,d1) - new Date(y2,m2-1,d2);
    });

    selectorSemana.innerHTML = "";
    for (let {key,fecha} of semanas) {
      const opt = document.createElement("option");
      opt.value = key; opt.textContent = fecha; selectorSemana.appendChild(opt);
    }

    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const offset = diaSemana === 0 ? -6 : 1 - diaSemana;
    const lunes = new Date(hoy); lunes.setDate(hoy.getDate()+offset);
    const dd = String(lunes.getDate()).padStart(2,"0");
    const mm = String(lunes.getMonth()+1).padStart(2,"0");
    const yyyy = lunes.getFullYear();
    const lunesStr = `${dd}/${mm}/${yyyy}`;

    const semanaHoy = semanas.find(s => s.fecha === lunesStr);
    const ultimaSeleccion = localStorage.getItem("semanaSeleccionada");

    if (ultimaSeleccion && [...selectorSemana.options].some(opt => opt.value === ultimaSeleccion)) {
      selectorSemana.value = ultimaSeleccion;
    } else if (semanaHoy) {
      selectorSemana.value = semanaHoy.key;
    } else if (semanas.length > 0) {
      selectorSemana.value = semanas.at(-1).key;
    } else {
      console.warn("❌ No hay semanas válidas.");
      return;
    }

    semanaActual = selectorSemana.value;
    renderizarTabla();
    renderizarResumenEmpleado();
      iniciarTemporizadorTurno?.()
  });
}

/* ====== UTIL ====== */

function esVerde(valor) {
  if (!valor || typeof valor !== "string") return false;
  const v = valor.trim().toLowerCase();
  if (v === "verde" || v === "green" || v === "lime" || v === "seagreen" || v === "forestgreen") return true;
  if (v.startsWith("rgb")) {
    const [r,g,b] = v.replace(/rgba?\(|\)|\s/g,"").split(",").map(Number);
    return Number.isFinite(r)&&Number.isFinite(g)&&Number.isFinite(b) && g >= 110 && g > r + 10 && g > b + 10;
  }
  if (v.startsWith("#")) {
    let hex = v.slice(1);
    if (hex.length === 3) hex = hex.split("").map(ch=>ch+ch).join("");
    if (/^[0-9a-f]{6}$/i.test(hex)) {
      const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
      return g >= 110 && g > r + 10 && g > b + 10;
    }
  }
  return false;
}


function eliminarSemanaActual() {
  if (!semanaActual) return;
  if (!confirm("¿Seguro que quieres eliminar esta semana?")) return;
  db.ref(semanaActual).remove().then(() => {
    const opcion = [...selectorSemana.options].find(opt => opt.value === semanaActual);
    if (opcion) opcion.remove();
    semanaActual = null;
    tablaContainer.innerHTML = "";
    alert("Semana eliminada correctamente.");
  });
}
/* ====== TEMPORIZADOR DE TURNO (hoy, usuario logueado) ====== */
// Helpers
function _pad(n){ return String(n).padStart(2,"0"); }
function _formatHMS(totalSeg){
  if (totalSeg < 0) totalSeg = 0;
  const h = Math.floor(totalSeg/3600);
  const m = Math.floor((totalSeg%3600)/60);
  const s = Math.floor(totalSeg%60);
  return `${_pad(h)}:${_pad(m)}:${_pad(s)}`;
}
function _dec2hm(d){
  const hrs = Math.floor(d);
  const mins = Math.round((d - hrs) * 60);
  return `${_pad(hrs)}:${_pad(mins)}`;
}

// Calcula turno de HOY para un empleado leyendo las celdas 1 / 0.5
async function calcularTurnoHoy(nombreEmpleado){
  try{
    // Semana seleccionada ya apunta por defecto a la semana actual al cargar. :contentReference[oaicite:4]{index=4}
    if (!semanaActual) return null;

    // Día real de HOY (no el selector visual)
    const _dias = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
    const diaHoy = _dias[new Date().getDay()];

    const snap = await db.ref(`${semanaActual}/${diaHoy}`).once("value");
    const celdas = snap.val() || {};

    // Recorremos bloques horarios definidos en 'horas' tipo "13-14"… :contentReference[oaicite:5]{index=5}
    const bloques = [];
    for (const h of horas){
      const v = celdas[`${nombreEmpleado}_${h}`];
      if (v === "1" || v === "0.5"){
        bloques.push({ hora: h, peso: parseFloat(v) });
      }
    }
    if (!bloques.length) return null;

    const inicioHora = parseInt(bloques[0].hora.split("-")[0], 10);
    const finHora    = parseInt(bloques[bloques.length-1].hora.split("-")[1], 10);

    const tInicio = inicioHora + (bloques[0].peso === 0.5 ? 0.5 : 0);
    // si el último bloque es 0.5, terminamos media hora antes del fin del bloque
    const lastPeso = bloques[bloques.length-1].peso;
    const tFin = finHora - (lastPeso === 0.5 ? 0.5 : 0);

    if (tFin <= tInicio) return null;

    return { dia: diaHoy, inicio: tInicio, fin: tFin };
  } catch(e){
    console.warn("Temporizador: error calculando turno:", e);
    return null;
  }
}

let __timerInt = null;
async function iniciarTemporizadorTurno(){
  const box = document.getElementById("temporizadorTurno");
  const big = document.getElementById("timerBig");
  const sub = document.getElementById("timerSub");
  if (!box || !big || !sub) return;

  // Usuario logueado: se usa el nombre del LS y no el selector. :contentReference[oaicite:6]{index=6}
  const nombre = (localStorage.getItem("nombre") || "").trim();
  if (!nombre){ box.hidden = true; return; }

  const turno = await calcularTurnoHoy(nombre);
  if (!turno){ box.hidden = true; if (__timerInt) clearInterval(__timerInt); return; }

  box.hidden = false;
  box.classList.remove("finalizado");

  // Subtítulo: “Hoy 13:30–22:00”
  const hIniTxt = _dec2hm(turno.inicio);
  const hFinTxt = _dec2hm(turno.fin);
  sub.textContent = `Hoy ${hIniTxt}–${hFinTxt}`;

  function _tick(){
    const now = new Date();
    const decNow = now.getHours() + (now.getMinutes()/60) + (now.getSeconds()/3600);

    const durTotalSeg = Math.round((turno.fin - turno.inicio) * 3600);

    if (decNow < turno.inicio){
      // Antes de empezar: muestra duración total (estático)
      big.textContent = _formatHMS(durTotalSeg);
    } else if (decNow >= turno.inicio && decNow < turno.fin){
      // En curso: cuenta atrás hasta fin
      const restSeg = Math.round((turno.fin - decNow) * 3600);
      big.textContent = _formatHMS(restSeg);
    } else {
      // Después del fin
      big.textContent = "00:00:00";
      box.classList.add("finalizado");
    }
  }

  if (__timerInt) clearInterval(__timerInt);
  _tick();
  __timerInt = setInterval(_tick, 1000);
}

// Re-inicializa al cambiar de semana o al cargar
selectorSemana?.addEventListener("change", () => iniciarTemporizadorTurno());
/* ====== Temporizador de turno (inyecta UI + lógica) ====== */
(function(){
  // UI: crea el bloque si no existe (debajo del H2 "Horarios")
  function ensureTimerUI(){
    if (document.getElementById("temporizadorTurno")) return;
    const h2 = [...document.querySelectorAll("#pagina-horarios h2")].find(el => el.textContent.includes("Horarios"));
    if (!h2) return;
    const wrap = document.createElement("div");
    wrap.id = "temporizadorTurno";
    wrap.hidden = true;
    wrap.innerHTML = `<div id="timerBig">--:--:--</div><div id="timerSub">—</div>`;
    h2.insertAdjacentElement("afterend", wrap);
  }

  const _dias = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const pad  = n => String(n).padStart(2,"0");
  const fmtH = d => `${pad(Math.floor(d))}:${pad(Math.round((d%1)*60))}`;
  const fmtS = s => { s=Math.max(0, s|0); const h=pad(s/3600|0), m=pad((s%3600)/60|0), ss=pad(s%60); return `${h}:${m}:${ss}`; };

  async function calcularTurnoHoy(nombreEmpleado){
    if (!window.semanaActual) return null;
    const diaHoy = _dias[new Date().getDay()];
    const snap = await db.ref(`${semanaActual}/${diaHoy}`).once("value");
    const celdas = snap.val() || {};

    // Usa tu array global `horas` con formato "13-14"
    const bloques = [];
    for (const h of (window.horas||[])){
      const v = celdas[`${nombreEmpleado}_${h}`];
      if (v==="1"||v==="0.5") bloques.push({ hora:h, peso: parseFloat(v) });
    }
    if (!bloques.length) return null;

    const hIni = parseInt(bloques[0].hora.split("-")[0],10);
    const hFin = parseInt(bloques.at(-1).hora.split("-")[1],10);
    const inicio = hIni + (bloques[0].peso===0.5?0.5:0);
    const fin    = hFin - (bloques.at(-1).peso===0.5?0.5:0);
    if (fin<=inicio) return null;
    return { inicio, fin, dia: diaHoy };
  }

  let tInt=null;
  async function iniciarTemporizadorTurno(){
    ensureTimerUI();
    const box = document.getElementById("temporizadorTurno");
    const big = document.getElementById("timerBig");
    const sub = document.getElementById("timerSub");
    if (!box||!big||!sub) return;

    const nombre = (localStorage.getItem("nombre")||"").trim();
    if (!nombre) { box.hidden=true; return; }

    const turno = await calcularTurnoHoy(nombre);
    if (!turno) { box.hidden=true; if(tInt) clearInterval(tInt); return; }

    box.hidden=false; box.classList.remove("finalizado");
    sub.textContent = `Hoy ${fmtH(turno.inicio)}–${fmtH(turno.fin)}`;

    function tick(){
      const now = new Date();
      const dec = now.getHours() + now.getMinutes()/60 + now.getSeconds()/3600;
      const totalSeg = Math.round((turno.fin - turno.inicio)*3600);

      if (dec < turno.inicio) {
        // Antes de empezar: duración total (estático)
        big.textContent = fmtS(totalSeg);
      } else if (dec < turno.fin) {
        // En curso: cuenta atrás
        big.textContent = fmtS(Math.round((turno.fin - dec)*3600));
      } else {
        big.textContent = "00:00:00";
        box.classList.add("finalizado");
      }
    }
    if (tInt) clearInterval(tInt);
    tick(); tInt = setInterval(tick, 1000);
  }

  // Hooks: reintenta al cargar semanas o al cambiar de semana/día
  document.addEventListener("DOMContentLoaded", () => {
    ensureTimerUI();
    // si tu app ya decide `semanaActual` en cargarSemanasExistentes(), esperamos un poco y arrancamos
    setTimeout(iniciarTemporizadorTurno, 300);
  });
  window.addEventListener("focus", iniciarTemporizadorTurno);
  (window.selectorSemana||document).addEventListener?.("change", iniciarTemporizadorTurno);
})();

/* ====== DOM READY ====== */
window.addEventListener("DOMContentLoaded", () => {
  const rol = localStorage.getItem("rol");
  const nombre = localStorage.getItem("nombre");

  // Solo jefa si el rol es "jefa" (p.ej. código 1306 en login)
  window.esJefa = (rol === "jefa");

  if (!window.esJefa) {
    document.querySelectorAll(".zona-edicion").forEach(el => el.style.display = "none");
    const modo = document.getElementById("modoSeleccion");
    if (modo) modo.style.display = "none";
    if (typeof window.modoSeleccion !== "undefined") window.modoSeleccion = null;
  }

  ["selectorEmpleado","resumenEmpleado","miniTurnoEmpleado"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.hidden = false; el.style.removeProperty("display"); }
  });

  // Inicializaciones
  if (typeof cargarSemanasExistentes === "function") cargarSemanasExistentes();
  if (typeof cargarSelectorEmpleado === "function") cargarSelectorEmpleado();
  if (typeof iniciarTemporizadorTurno === "function") iniciarTemporizadorTurno();

  // Ocultar empleado por código al arrancar (seguro si las funciones no existen)
  (async () => {
    try {
      if (typeof cargarEmpleadosOcultos === "function") await cargarEmpleadosOcultos();
      if (typeof setEmpleadoOculto === "function") await setEmpleadoOculto(1306, true);
    } catch (e) { console.warn("setEmpleadoOculto:", e); }
  })();

  const btnCrear = document.getElementById("crearSemanaBtn");
  const inputFecha = document.getElementById("fechaLunes");
  const modalFecha = document.getElementById("modalFecha");

  const lockScroll = (on) => { document.body.style.overflow = on ? "hidden" : ""; };

  document.addEventListener("click", (e) => {
    if (!modalFecha) return;
    if (modalFecha.style.display === "block" && !modalFecha.contains(e.target) && e.target !== btnCrear) {
      modalFecha.style.display = "none"; lockScroll(false);
    }
  });
  btnCrear?.addEventListener("click", () => { modalFecha.style.display = "block"; lockScroll(true); });

  inputFecha?.addEventListener("input", () => {
    const fecha = new Date(inputFecha.value);
    if (isNaN(fecha)) return;
    if (fecha.getDay() !== 1) { alert("🚫 La fecha seleccionada no es un lunes."); return; }
    const dd = String(fecha.getDate()).padStart(2,'0');
    const mm = String(fecha.getMonth()+1).padStart(2,'0');
    const yyyy = fecha.getFullYear();
    const fechaFormateada = `${dd}/${mm}/${yyyy}`;
    const clave = `horario_semana_${dd}-${mm}-${yyyy}`;
    db.ref(clave).set({ _fecha: fechaFormateada })
      .then(() => { alert("✅ Semana creada."); inputFecha.value=""; modalFecha.style.display="none"; lockScroll(false); if (typeof cargarSemanasExistentes==="function") cargarSemanasExistentes(); })
      .catch((err) => { console.error("❌ Crear semana:", err); alert("Error al crear la semana."); });
  });

  const btnAnterior = document.getElementById("diaAnterior");
  const btnSiguiente = document.getElementById("diaSiguiente");
  btnAnterior?.addEventListener("click", () => cambiarDia(-1));
  btnSiguiente?.addEventListener("click", () => cambiarDia(1));

  // Color inicial (evita ReferenceError si no existen)
  if (window.colorWrapperMain && window.colorPicker) {
    window.colorWrapperMain.style.backgroundColor = window.colorPicker.value;
  }

  // Modal empleados scroll lock
  const modalEmp = document.getElementById("modalEmpleado");
  if (modalEmp) {
    const obs = new MutationObserver(() => {
      if (getComputedStyle(modalEmp).display === "block") document.body.style.overflow = "hidden";
      else document.body.style.overflow = "";
    });
    obs.observe(modalEmp, { attributes:true, attributeFilter:["style","class"] });
  }
});


/* ====== SELECTOR EMPLEADO + RESÚMENES ====== */
const selectorEmpleado = document.getElementById("selectorEmpleado");
const resumenEmpleado = document.getElementById("resumenEmpleado");

function cargarSelectorEmpleado() {
  if (!Array.isArray(empleados) || empleados.length === 0 || !selectorEmpleado) return;

  const prev = selectorEmpleado.value; // recuerda selección previa
  const nombreUsuarioRaw = localStorage.getItem("nombre") || "";
  const nombreUsuario = __norm(nombreUsuarioRaw);

  selectorEmpleado.innerHTML = "";

  // opción general
  const optGen = document.createElement("option");
  optGen.value = "__general__";
  optGen.textContent = "Resumen general";
  selectorEmpleado.appendChild(optGen);

  // opciones empleados
  empleados.forEach(nombre => {
    const opt = document.createElement("option");
    opt.value = nombre;
    opt.textContent = nombre;
    selectorEmpleado.appendChild(opt);
  });

  // 1) intentar restaurar selección previa si existe
  if ([...selectorEmpleado.options].some(o => o.value === prev)) {
    selectorEmpleado.value = prev;
  } else {
    // 2) intentar matchear usuario logueado normalizado
    const match = empleados.find(n => __norm(n) === nombreUsuario);
    selectorEmpleado.value = match || "__general__";
  }

  renderizarResumenEmpleado();
}

selectorEmpleado.addEventListener("change", renderizarResumenEmpleado);
selectorSemana.addEventListener("change", renderizarResumenEmpleado);

/* ... (resto de funciones de resumen, sin cambios sustanciales) ... */

function renderizarResumenEmpleado() {
  const nombre = selectorEmpleado.value;
  if (!semanaActual || !nombre) return;
  if (nombre === "__general__") { renderizarResumenGeneral(); return; }

  const fechaSemana = selectorSemana.selectedOptions[0]?.textContent;
  const [diaInicio, mesSeleccionado, anioSeleccionado] = fechaSemana.split("/");

  let totalSemana = 0, diasLibres = 0, resumenDiario = [];
  let totalMes = 0, totalAnio = 0, totalGeneral = 0, mañanasMes = 0, tardesMes = 0, diasLibresListado = [];

  db.ref().once("value", (snapTodas) => {
    const semanas = snapTodas.val();

    for (let key in semanas) {
      if (!key.startsWith("horario_semana_")) continue;
      const datosSemana = semanas[key];
      const fechaGuardada = datosSemana._fecha;
      if (!fechaGuardada) continue;

      const [d, mm, aaaa] = fechaGuardada.split("/");
      const baseDate = new Date(`${aaaa}-${mm}-${d}`);
      const datosDias = Object.entries(datosSemana).filter(([k]) => !k.startsWith("_"));

      for (let [dia, celdas] of datosDias) {
        if (!celdas) continue;
        let horasDia = 0; let ultimaHora = null;

        for (let hora of horas) {
          const celdaID = `${nombre}_${hora}`;
          const valor = celdas[celdaID];
          if (valor === "1" || valor === "0.5") { horasDia += parseFloat(valor); ultimaHora = hora; }
        }

        const indexDia = ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"].indexOf(dia);
        const fechaReal = new Date(baseDate); fechaReal.setDate(baseDate.getDate()+indexDia);

        if (fechaReal.getFullYear() === parseInt(anioSeleccionado)) totalAnio += horasDia;
        if (fechaReal.getMonth()+1 === parseInt(mesSeleccionado) && fechaReal.getFullYear() === parseInt(anioSeleccionado)) {
          totalMes += horasDia;
          if (ultimaHora) { const fin = parseInt(ultimaHora.split("-")[1]); if (fin <= 16) mañanasMes++; else tardesMes++; }
        }
        totalGeneral += horasDia;
      }
    }

    const datosSemanaActual = semanas[semanaActual];
    if (!datosSemanaActual) return;

    const diasValidos = ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"];
    for (let dia of diasValidos) {
      const celdas = datosSemanaActual[dia];
      if (!celdas) continue;

      let horasDia = 0, compañeros = {}, verdes = 0, totalCeldas = 0;
      for (let key in celdas) {
        if (key.startsWith(nombre+"_")) {
          totalCeldas++;
          const valor = celdas[key];
          if (valor === "1") horasDia += 1;
          else if (valor === "0.5") horasDia += 0.5;
          if (esVerde(valor)) verdes++;
        }
      }

      if (verdes === totalCeldas && totalCeldas > 0) { diasLibres++; if (!diasLibresListado.includes(dia)) diasLibresListado.push(dia); }
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
        .filter(([_, h]) => h > 2).map(([n]) => n);
      resumenDiario.push(`• ${dia}: ${horasDia}h ${coincidenciasFiltradas.length ? `(con: ${coincidenciasFiltradas.join(", ")})` : ""}`);
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

    let tablaMini = "<table><tr><th>Día</th>" + horas.map(h => `<th>${h}</th>`).join("") + "</tr>";
    for (let dia of ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"]) {
      const celdas = datosSemanaActual[dia]; if (!celdas) continue;
      let total = 0, verdes = 0;
      for (let hora of horas) {
        const celdaID = `${nombre}_${hora}`;
        const valor = celdas?.[celdaID];
        if (valor) total++;
        if (esVerde(valor)) verdes++;
      }
      const esDiaLibre = total > 0 && verdes === total;
      const iniciales = { lunes:"L", martes:"M", miércoles:"X", jueves:"J", viernes:"V", sábado:"S", domingo:"D" };
      tablaMini += `<tr class="${esDiaLibre ? "dia-libre" : ""}"><td>${iniciales[dia]}</td>`;
      for (let hora of horas) {
        const celdaID = `${nombre}_${hora}`;
        const valor = celdas?.[celdaID];
        let clase = ""; if (valor === "1" || valor === "0.5") clase = "trabajo";
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
  if (!fechaSemana) return;
  const [, mesActual, anioActual] = fechaSemana.split("/");

  db.ref().once("value", (snap) => {
    const todas = snap.val() || {};
    const resumen = {};
    for (let e of empleados) resumen[e] = { semana:0, mes:0, mañanas:0, tardes:0, libresTotal:0 };

    for (let key in todas) {
      if (!key.startsWith("horario_semana_")) continue;
      const semana = todas[key];
      const fecha = semana._fecha; if (!fecha) continue;
      const [, mm, aaaa] = (fecha || "").split("/");
      const esMismaSemana = key === semanaActual;
      const esMismoMes = mm === mesActual && aaaa === anioActual;

      const dias = Object.entries(semana).filter(([k]) => !k.startsWith("_"));
      for (let [, celdas] of dias) {
        for (let empleado of empleados) {
          let horasDia = 0, totalCeldas = 0, verdes = 0, ultimaHora = null;

          for (let hora of horas) {
            const id = `${empleado}_${hora}`;
            const valor = celdas?.[id];

            if (valor === "1" || valor === "0.5") {
              horasDia += parseFloat(valor);
              ultimaHora = hora;
              totalCeldas++; // celda ocupada
            } else if (valor) {
              totalCeldas++; // celda marcada (color, verde, etc.)
              if (esVerde(valor)) verdes++;
            }
          }

          if (esMismaSemana) resumen[empleado].semana += horasDia;
          if (esMismoMes)   resumen[empleado].mes    += horasDia;

          if (esMismoMes && ultimaHora && horasDia > 0) {
            const fin = parseInt(ultimaHora.split("-")[1], 10);
            if (fin <= 16) resumen[empleado].mañanas++; else resumen[empleado].tardes++;
          }

          // Día libre TOTAL: todas las celdas marcadas para ese día están en verde
          if (totalCeldas > 0 && verdes === totalCeldas) {
            resumen[empleado].libresTotal++;
          }
        }
      }
    }

    const yo = (localStorage.getItem("nombre") || "").trim().toLowerCase();
    let tabla = `
      <table class="tabla-resumen-general">
        <thead><tr>
          <th>👤</th><th>🕓 Semana</th><th>📆 Mes</th><th>🌅 Mañanas</th><th>🌇 Tardes</th><th>💤 Libres</th>
        </tr></thead><tbody>
    `;
    for (let e of empleados) {
      const r = resumen[e];
      const clase = (e.trim().toLowerCase() === yo) ? ' class="fila-actual"' : '';
      tabla += `<tr${clase}>
        <td><strong>${e}</strong></td>
        <td>${r.semana}</td>
        <td>${r.mes}</td>
        <td>${r.mañanas}</td>
        <td>${r.tardes}</td>
        <td>${r.libresTotal}</td>
      </tr>`;
    }
    tabla += `</tbody></table>`;
    resumenEmpleado.innerHTML = tabla;

    const datosSemanaActual = todas[semanaActual];
    if (datosSemanaActual) generarTablaResumenHorariosPorDia(datosSemanaActual);
    document.getElementById("miniTurnoEmpleado").innerHTML = "";
  });
}


/* ====== INTERCAMBIO TURNOS (quita duplicado) ====== */
function cargarIntercambioTurno() {
  const semanaSel = document.getElementById("semanaIntercambio");
  const origenSel = document.getElementById("empleadoOrigen");
  const destinoSel = document.getElementById("empleadoDestino");

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

  if (typeof empleados !== "undefined") {
    [origenSel, destinoSel].forEach(sel => {
      sel.innerHTML = "";
      empleados.forEach(nombre => {
        const opt = document.createElement("option");
        opt.value = nombre; opt.textContent = nombre; sel.appendChild(opt);
      });
    });
  }
}

function intercambiarTurno() {
  const semana = document.getElementById("semanaIntercambio").value;
  const dia = document.getElementById("diaIntercambio").value;
  const de = document.getElementById("empleadoOrigen").value;
  const a = document.getElementById("empleadoDestino").value;

  if (!semana || !dia || !de || !a || de === a) { alert("Selecciona empleados distintos y todos los campos."); return; }

  db.ref(`${semana}/${dia}`).once("value", (snap) => {
    const datos = snap.val(); if (!datos) return;
    const actualizaciones = {};
    for (let hora of horas) {
      const idDe = `${de}_${hora}`, idA = `${a}_${hora}`;
      const valorDe = datos[idDe] || "", valorA = datos[idA] || "";
      actualizaciones[idDe] = valorA;
      actualizaciones[idA] = valorDe;
    }
    db.ref(`${semana}/${dia}`).update(actualizaciones).then(() => { alert("🔁 Turno intercambiado correctamente."); renderizarTabla(); });
  });
}

/* ====== MODAL EMPLEADOS ====== */
function agregarNuevoEmpleado(nombre) {
  if (!nombre || typeof nombre !== 'string') return;
  if (!empleados.includes(nombre)) empleados.push(nombre);

  const sel = document.getElementById("selectorEmpleado");
  if (sel && ![...sel.options].some(opt => opt.value === nombre)) {
    const opt = document.createElement("option"); opt.value = nombre; opt.textContent = nombre; sel.appendChild(opt);
  }

  if (!Object.values(usuarios).includes(nombre)) {
    const nuevoCodigo = generarCodigoLibre();
    usuarios[nuevoCodigo] = nombre;
    db.ref(`empleados/${nuevoCodigo}`).set(nombre);
  }
  renderizarTabla?.();
}
function generarCodigoLibre() { let c = 1000; while (usuarios[c]) c++; return c; }
function agregarDesdeInput() {
  const nombre = document.getElementById("nuevoNombre").value.trim();
  const codigo = document.getElementById("nuevoCodigo").value.trim();
  if (!nombre || !codigo) { alert("Introduce nombre y código."); return; }
  if (usuarios[codigo]) { alert("Ese código ya está en uso."); return; }

  db.ref(`empleados/${codigo}`).set(nombre).then(() => {
    alert("Empleado añadido.");
    usuarios[codigo] = nombre;
    if (!empleados.includes(nombre)) empleados.push(nombre);
    cargarSelectorEmpleado?.(); renderizarTabla?.(); cerrarModalEmpleado();
  }).catch(err => alert("Error en Firebase: " + err.message));
}
async function abrirModalEmpleado() {
  const modal = document.getElementById("modalEmpleado");
  const tabla = document.getElementById("tablaEmpleados");
  if (!modal || !tabla) return;

  const snap = await db.ref().once("value");
  const root = snap.val() || {};
  const mapa = root.empleados || {};
  const orden = Array.isArray(root[ORDEN_PATH]) ? root[ORDEN_PATH] : [];
  window.usuarios = mapa;

  // Ordenamos por empleados_orden si existe, si no alfabético
  const entries = Object.entries(mapa);
  const idx = Object.fromEntries(orden.map((c,i)=>[String(c), i]));
  entries.sort(([aC,aN],[bC,bN])=>{
    const ai = idx[String(aC)], bi = idx[String(bC)];
    if (ai===undefined && bi===undefined) return aN.localeCompare(bN);
    if (ai===undefined) return 1;
    if (bi===undefined) return -1;
    return ai - bi;
  });

  const tbody = tabla.querySelector("tbody");
  tbody.innerHTML = "";

  for (const [codigo, nombre] of entries) {
    const tr = document.createElement("tr");
    tr.dataset.codigo = String(codigo);
    tr.draggable = true; // ← activamos DnD

    // Grip
    const tdGrip = document.createElement("td");
    const grip = document.createElement("button");
    grip.type = "button";
    grip.className = "grip";
    grip.textContent = "↕️";
    grip.style.cssText = "background:transparent;border:none;cursor:grab;font-size:1rem;touch-action:none;user-select:none";
    tdGrip.appendChild(grip);

    // Nombre
    const tdNombre = document.createElement("td");
    const inputNombre = document.createElement("input");
    inputNombre.type = "text";
    inputNombre.value = nombre;
    tdNombre.appendChild(inputNombre);

    // Código
    const tdCodigo = document.createElement("td");
    const inputCodigo = document.createElement("input");
    inputCodigo.type = "number";
    inputCodigo.value = codigo;
    tdCodigo.appendChild(inputCodigo);

    // Eliminar
    const tdEliminar = document.createElement("td");
    const btnX = document.createElement("button");
    btnX.textContent = "❌";
    btnX.style.cssText = "background:transparent;border:none;cursor:pointer";
    btnX.title = `Eliminar ${nombre}`;
    btnX.onclick = () => eliminarEmpleado(nombre);
    tdEliminar.appendChild(btnX);

    tr.append(tdGrip, tdNombre, tdCodigo, tdEliminar);
    tbody.appendChild(tr);
  }

  habilitarDragSortEmpleados(tbody); // activa DnD
  modal.style.display = "block";
}



async function guardarCambiosTabla() {
  const tbody = document.querySelector("#tablaEmpleados tbody");
  if (!tbody) return alert("No existe la tabla.");

  // Construimos mapa empleados y orden actual según DOM
  const nuevos = {};
  const orden = [];

  for (const tr of tbody.querySelectorAll("tr")) {
    const inputNombre = tr.children[1].querySelector("input");
    const inputCodigo = tr.children[2].querySelector("input");
    const nombre = (inputNombre?.value || "").trim();
    const codigo = String((inputCodigo?.value || "").trim());

    if (!nombre || !codigo) {
      alert("Hay filas con nombre/código vacío.");
      return;
    }
    if (nuevos[codigo]) {
      alert(`Código duplicado: ${codigo}`);
      return;
    }
    nuevos[codigo] = nombre;
    orden.push(codigo);
  }

  // Persistimos TODO en una sola operación
  await db.ref().update({
    empleados: nuevos,
    [ORDEN_PATH]: orden
  });

  // Estado local + UI
  window.usuarios = nuevos;
  window.empleados = orden.map(c => nuevos[c]); // respeta orden
  cargarSelectorEmpleado?.();
  renderizarTabla?.();
  alert("✅ Cambios guardados.");
}
function cerrarModalEmpleado() { document.getElementById("modalEmpleado").style.display = "none"; }
window.addEventListener("click", function (e) { const modal = document.getElementById("modalEmpleado"); if (e.target === modal) cerrarModalEmpleado(); });

/* Exponer */
window.abrirModalEmpleado = abrirModalEmpleado;
window.agregarDesdeInput = agregarDesdeInput;
window.guardarCambiosTabla = guardarCambiosTabla;
window.cerrarModalEmpleado = cerrarModalEmpleado;

/* ====== RESUMEN POR DÍA (sin cambios de medidas) ====== */
function generarTablaResumenHorariosPorDia(datosSemana) {
  if (!datosSemana) { console.warn("⚠️ Sin datos semana actual"); return; }

  const dias = ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"];
  const diaSeleccionado = selectorDia?.value;
  const yo = (localStorage.getItem("nombre") || "").trim().toLowerCase();

  document.getElementById("tablaResumenPorDia")?.remove();

  const contenedor = document.createElement("div");
  contenedor.id = "tablaResumenPorDia";

  const tabla = document.createElement("table");
  tabla.className = "tabla-resumen-por-dia";

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
    const esYo = empleado.trim().toLowerCase() === yo;

    const tdNombre = document.createElement("td");
    tdNombre.textContent = empleado;
    if (esYo) { tdNombre.style.borderLeft = "0.25rem solid #3b82f6"; tdNombre.style.fontWeight = "800"; }

    tdNombre.onclick = () => {
      const celdas = fila.querySelectorAll("td:not(:first-child)");
      celdas.forEach((td, i) => {
        const celdaID = `${empleado}_${dias[i]}`; // decorativo aquí
        aplicarModo(td, celdaID);
      });
    };
    fila.appendChild(tdNombre);

    for (let dia of dias) {
      const td = document.createElement("td");
      if (dia === diaSeleccionado) td.classList.add("columna-actual");

      const bloques = [];
      let tieneBloques = false, todasVerdes = true, colorPersonal = null;

      for (let hora of horas) {
        const celdaID = `${empleado}_${hora}`;
        const valor = datosSemana?.[dia]?.[celdaID];
        if (valor === "1" || valor === "0.5") { bloques.push({ hora, peso: parseFloat(valor) }); tieneBloques = true; todasVerdes = false; }
        else if (typeof valor === "string" && valor.startsWith("#")) { colorPersonal = valor; if (!esVerde(valor)) todasVerdes = false; }
        else if (valor === "verde") { /* mantiene todasVerdes */ }
        else { todasVerdes = false; }
      }

if (tieneBloques) {
  const inicioHora = parseInt(bloques[0].hora.split("-")[0], 10);
  const finHora    = parseInt(bloques.at(-1).hora.split("-")[1], 10);

  const tInicio = inicioHora + (bloques[0].peso === 0.5 ? 0.5 : 0);
  const tFin    = finHora    - (bloques.at(-1).peso === 0.5 ? 0.5 : 0);

  const fmt = (t) => Number.isInteger(t) ? String(t) : `${Math.floor(t)},5`;

  td.textContent = `${fmt(tInicio)}–${fmt(tFin)}`;
  td.style.backgroundColor = "transparent";
} else if (todasVerdes) {
        td.textContent = "Libre"; td.style.backgroundColor = "transparent";
      } else if (colorPersonal) {
        td.textContent = ""; td.style.backgroundColor = colorPersonal;
      }

      // Overlay de resaltado de fila (no pisa backgrounds existentes)
      if (esYo) td.style.boxShadow = (td.style.boxShadow ? td.style.boxShadow + "," : "") + "inset 0 0 0 2px rgba(246, 59, 59, 0.6)";

      if (window.esJefa) {
        td.contentEditable = true;
        td.style.backgroundColor = "#ffffe00a";
        td.dataset.dia = dia;
        td.dataset.empleado = empleado;

td.addEventListener("blur", async () => {
  const texto = td.textContent.trim().toLowerCase();
  const dia = td.dataset.dia;
  const empleado = td.dataset.empleado;
  const updates = {};

  // helper: parsea "11", "7:30", "7,5", "14.5" → horas en pasos de 0.5
  const parseHalfHour = (s) => {
    if (!s) return null;
    s = s.replace(",", "."); // admite coma decimal
    if (s.includes(":")) {
      const [h, mRaw] = s.split(":");
      const hNum = parseInt(h, 10);
      const mNum = parseInt(mRaw || "0", 10);
      if (!Number.isFinite(hNum)) return null;
      if (mNum === 0) return hNum;
      if (mNum === 30) return hNum + 0.5;
      return null; // solo 00 o 30
    }
    const f = Number(s);
    if (!Number.isFinite(f)) return null;
    const h = Math.floor(f + 1e-9);
    const frac = Math.round((f - h) * 10); // admite .5
    if (frac === 0) return h;
    if (frac === 5) return h + 0.5;
    return null; // solo .0 o .5
  };

  if (texto === "" || texto === "libre") {
    for (let hora of horas) updates[`${empleado}_${hora}`] = "verde";
  } else {
    const limpio = texto.replace(/\s+/g, "");
    const partes = limpio.split(/[–-]/); // guion o en dash
    if (partes.length !== 2) { alert("Formato inválido. Ej: 7:30–14:00, 11-13, 7,5-13, 14,5-21,5"); return; }

    const tInicio = parseHalfHour(partes[0]);
    const tFin    = parseHalfHour(partes[1]);
    if (tInicio == null || tFin == null || tFin <= tInicio) {
      alert("Formato inválido. Usa tramos en pasos de 30 min. Ej: 7:30–14:00, 11-13, 7,5-13, 14,5-21,5");
      return;
    }

    for (let hora of horas) {
      const [h1] = hora.split("-").map(Number);
      const bloque = h1 + 0.5;
      const id = `${empleado}_${hora}`;
      if (bloque > tInicio && bloque <= tFin) updates[id] = "1";
      else if (bloque === tInicio) updates[id] = "0.5";
      else updates[id] = "";
    }
  }

  if (!window.cambiosPendientes[`${dia}_${empleado}`]) window.cambiosPendientes[`${dia}_${empleado}`] = {};
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
  if (!resumenDiv) { alert("❌ Falta contenedor resumenEmpleado"); return; }
  resumenDiv.appendChild(contenedor);
}


let __navLock = false;

document.getElementById("diaAnterior").onclick  = () => cambiarDia(-1);
document.getElementById("diaSiguiente").onclick = () => cambiarDia(1);

function cambiarDia(direccion) {
  if (__navLock) return;                // antirrebote por listeners duplicados
  __navLock = true;

  const dias = ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"];
  const actual = selectorDia.value;
  const index = dias.indexOf(actual);
  if (index === -1) { __navLock = false; return; }

  const nuevoIndex = (index + direccion + dias.length) % dias.length;
  selectorDia.value = dias[nuevoIndex];
  diaActual = dias[nuevoIndex];
  renderizarTabla();

  setTimeout(() => { __navLock = false; }, 0);
}

/* ====== Notificación ====== */
window.mostrarNotificacion = function(titulo, cuerpo = "") {
  if (Notification.permission === "default") Notification.requestPermission();
  if (Notification.permission !== "granted") { console.warn("🚫 Sin permiso notificaciones"); return; }
  try {
    navigator.vibrate?.([200,100,200]);
    new Notification(titulo, { body:cuerpo, icon:"recursos/img/calendario.png", tag:"notificacion-prueba", renotify:false });
  } catch(e){ console.error("❌ Notificación:", e); }
};

/* Sobrescribe guardarCambiosPendientes duplicada del final original (normaliza) */
window.guardarCambiosPendientes = window.guardarCambiosPendientes;
async function eliminarEmpleado(nombreEmpleado) {
  if (!nombreEmpleado) return;
  if (!confirm(`¿Eliminar a "${nombreEmpleado}" de Firebase y de todos los horarios?`)) return;

  // Código del empleado
  const mapa = (await db.ref("empleados").once("value")).val() || {};
  const codigo = Object.keys(mapa).find(c => (mapa[c]||"").trim().toLowerCase() === nombreEmpleado.trim().toLowerCase());
  if (!codigo) { alert(`No encontré a ${nombreEmpleado}`); return; }

  // Construye updates (borra /empleados, sus celdas y lo saca de empleados_orden)
  const root = (await db.ref().once("value")).val() || {};
  const updates = { [`empleados/${codigo}`]: null };
  const orden = (root[ORDEN_PATH] || []).filter(c => String(c) !== String(codigo));
  updates[ORDEN_PATH] = orden;

  for (const claveSemana of Object.keys(root).filter(k => k.startsWith("horario_semana_"))) {
    const semana = root[claveSemana] || {};
    for (const dia of Object.keys(semana).filter(k => !k.startsWith("_"))) {
      for (const k of Object.keys(semana[dia] || {})) {
        if (k.startsWith(`${nombreEmpleado}_`)) updates[`${claveSemana}/${dia}/${k}`] = null;
      }
    }
  }

  await db.ref().update(updates);

  // Estado local + UI
  if (window.usuarios) delete window.usuarios[codigo];
  if (Array.isArray(window.empleados)) window.empleados = window.empleados.filter(n => n !== nombreEmpleado);
  document.querySelectorAll("select").forEach(sel => {
    [...sel.options].forEach(opt => { if (opt.value === nombreEmpleado || opt.textContent === nombreEmpleado) opt.remove(); });
  });
  cargarSelectorEmpleado?.(); renderizarTabla?.(); renderizarResumenEmpleado?.();

  alert(`✅ "${nombreEmpleado}" eliminado correctamente`);
}

// Ruta donde guardamos el orden
const ORDEN_PATH = "empleados_orden";

// Carga empleados + orden persistido y devuelve entradas ordenadas
async function obtenerEntradasEmpleadosOrdenadas() {
  const snap = await db.ref().once("value");
  const root = snap.val() || {};
  const mapa = root.empleados || {};
  const orden = Array.isArray(root[ORDEN_PATH]) ? root[ORDEN_PATH] : [];

  const entradas = Object.entries(mapa); // [ [codigo, nombre], ... ]
  // Index para ordenar según 'empleados_orden'
  const idx = Object.fromEntries(orden.map((codigo, i) => [String(codigo), i]));
  entradas.sort(([aCod, aNom], [bCod, bNom]) => {
    const ai = idx[String(aCod)];
    const bi = idx[String(bCod)];
    if (ai === undefined && bi === undefined) return aNom.localeCompare(bNom);
    if (ai === undefined) return 1;
    if (bi === undefined) return -1;
    return ai - bi;
  });
  return entradas;
}
function guardarOrdenEmpleadosDesdeDOM(tbody) {
  const orden = [...tbody.querySelectorAll("tr")].map(tr => tr.dataset.codigo);
  // Actualiza Firebase y arrays locales
  db.ref(ORDEN_PATH).set(orden).then(() => {
    const nuevos = {};
    for (const cod of orden) if (window.usuarios?.[cod]) nuevos[cod] = window.usuarios[cod];
    for (const cod in window.usuarios) if (!nuevos[cod]) nuevos[cod] = window.usuarios[cod];
    window.usuarios = nuevos;
    window.empleados = Object.values(nuevos);
    cargarSelectorEmpleado?.();
    renderizarTabla?.();
  });
}


function habilitarDragSortEmpleados(tbody) {
  let dragging = null;

  // Solo arrastramos si empezamos sobre el grip
  tbody.addEventListener("dragstart", (e) => {
    if (!e.target.closest(".grip")) { e.preventDefault(); return; }
    const tr = e.target.closest("tr");
    dragging = tr;
    tr.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", ""); // necesario en algunos navegadores
  });

  tbody.addEventListener("dragover", (e) => {
    e.preventDefault(); // necesario para permitir drop
    if (!dragging) return;
    const target = e.target.closest("tr");
    if (!target || target === dragging) return;

    const rect = target.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    tbody.insertBefore(dragging, before ? target : target.nextSibling);
  });

  tbody.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!dragging) return;
    dragging.classList.remove("dragging");
    guardarOrdenEmpleadosDesdeDOM(tbody); // persiste nuevo orden
    dragging = null;
  });

  // Limpia estado si se cancela el drag
  tbody.addEventListener("dragend", () => {
    if (dragging) dragging.classList.remove("dragging");
    dragging = null;
  });

  // Soporte táctil simple: simula drag al tocar el grip
  tbody.addEventListener("touchstart", (e) => {
    const grip = e.target.closest(".grip");
    if (!grip) return;
    const tr = grip.closest("tr");
    dragging = tr;
    tr.classList.add("dragging");

    const move = (ev) => {
      const y = ev.touches[0].clientY;
      const rows = [...tbody.querySelectorAll("tr:not(.dragging)")];
      for (const row of rows) {
        const r = row.getBoundingClientRect();
        const before = y < r.top + r.height / 2;
        if (before) { tbody.insertBefore(dragging, row); break; }
        if (row === rows.at(-1)) tbody.appendChild(dragging);
      }
    };
    const up = () => {
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", up);
      tr.classList.remove("dragging");
      guardarOrdenEmpleadosDesdeDOM(tbody);
      dragging = null;
    };

    document.addEventListener("touchmove", move, { passive: true });
    document.addEventListener("touchend", up, { passive: true });
  }, { passive: true });
}

/* === NUEVO: util fecha + estado mensual === */
const _dow = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const _dowCap = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const _mesCap = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const labelDia = document.getElementById("labelDia");
const calWrap = document.getElementById("calendarioMes");
const calHead = document.getElementById("calHead");
const calBody = document.getElementById("calBody");
const btnToggleVista = document.getElementById("toggleVistaBtn");
const mesNav = document.getElementById("mesNav");
const mesTitulo = document.getElementById("mesTitulo");
const btnMesPrev = document.getElementById("mesPrev");
const btnMesNext = document.getElementById("mesNext");

let fechaMesActual = new Date();            // mes que se muestra en calendario
let mapaEstadoDias = new Map();             // "YYYY-MM-DD" -> "trabajo" | "libre"
let nombreEmpleadoLog = null;

/* lunes de la semana seleccionada (selectorSemana muestra dd/mm/yyyy del lunes) */
function getLunesSeleccionado() {
  const txt = selectorSemana.selectedOptions[0]?.textContent || "";
  const [dd,mm,yyyy] = txt.split("/").map(Number);
  if (!dd||!mm||!yyyy) return null;
  return new Date(yyyy, mm-1, dd);
}
function fmtDDMMYYYY(d){
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}
function ymd(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }

/* === NUEVO: cabecera de día actualizada === */
function actualizarLabelDia(){
  const lunes = getLunesSeleccionado();
  if (!lunes) { labelDia.textContent = "—"; return; }
  const idx = ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"].indexOf(selectorDia.value);
  const fecha = new Date(lunes); fecha.setDate(lunes.getDate()+idx);
  labelDia.textContent = `${_dowCap[fecha.getDay()]}, ${fmtDDMMYYYY(fecha)}`;
}
selectorSemana.addEventListener("change", actualizarLabelDia);
selectorDia.addEventListener("change", actualizarLabelDia);

/* hook al cambiar con flechas ya existente */
const _oldCambiarDia = typeof cambiarDia === "function" ? cambiarDia : null;
window.cambiarDia = function(dir){
  if (_oldCambiarDia) _oldCambiarDia(dir);
  actualizarLabelDia();
};

/* === NUEVO: precarga de estados por empleado (una sola lectura) === */
/* === precarga de estados por empleado (con M/T) === */
async function precalcularMapaEstados(nombreEmpleado){
  // Franja configurable (24h): mañana [06,14), tarde [14,22)
  const MORNING_START = 6, MORNING_END = 12;
  const AFTER_START   = 16, AFTER_END   = 22;

  const isMorning = (hIni, hFin) => hIni < MORNING_END && hFin <= MORNING_END;
  const isAfternoon = (hIni, hFin) => hIni >= AFTER_START && hIni < AFTER_END;

  mapaEstadoDias.clear();
  const snap = await db.ref().once("value");
  const root = snap.val() || {};
  for (const key in root){
    if (!key.startsWith("horario_semana_")) continue;
    const semana = root[key];
    const fecha = semana?._fecha; if (!fecha) continue;
    const [dd,mm,yy] = fecha.split("/").map(Number);
    const base = new Date(yy, mm-1, dd); // lunes

    for (const dia of ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"]){
      const idx = ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"].indexOf(dia);
      const fechaReal = new Date(base); fechaReal.setDate(base.getDate()+idx);
      const keyYmd = ymd(fechaReal);

      const celdas = semana[dia] || {};
      let total=0, verdes=0, trabajo=0, hasM=false, hasT=false;

      for (const h of horas){
        const v = celdas[`${nombreEmpleado}_${h}`];
        if (!v) continue;
        total++;
        if (esVerde(v)) verdes++;
        if (v==="1" || v==="0.5"){
          trabajo++;
          const [hIni, hFin] = h.split("-").map(Number); // ej "7-8"
          if (isMorning(hIni, hFin)) hasM = true;
          if (isAfternoon(hIni, hFin)) hasT = true;
        }
      }

      if (trabajo>0) mapaEstadoDias.set(keyYmd, { estado:"trabajo", M:hasM, T:hasT });
      else if (total>0 && verdes===total) mapaEstadoDias.set(keyYmd, { estado:"libre", M:false, T:false });
    }
  }
}


/* === NUEVO: render calendario mensual === */
function renderCabeceraCalendario(){
  calHead.innerHTML = "";
  const dows = ["L","M","X","J","V","S","D"];
  for(const l of dows){ const e = document.createElement("div"); e.className="cal-dow"; e.textContent=l; calHead.appendChild(e); }
}
function renderCalendarioMes(){
  mesTitulo.textContent = `${_mesCap[fechaMesActual.getMonth()]} ${fechaMesActual.getFullYear()}`;
  calBody.innerHTML = "";
  renderCabeceraCalendario();

  const first = new Date(fechaMesActual.getFullYear(), fechaMesActual.getMonth(), 1);
  const last  = new Date(fechaMesActual.getFullYear(), fechaMesActual.getMonth()+1, 0);
  let startOffset = (first.getDay() + 6) % 7; // lunes=0
  const hoyYMD = ymd(new Date());

  // huecos antes del día 1
  for(let i=0;i<startOffset;i++){
    const d=document.createElement("div");
    d.className="cal-cell mes-externo";
    calBody.appendChild(d);
  }

  for(let day=1; day<=last.getDate(); day++){
    const fecha = new Date(fechaMesActual.getFullYear(), fechaMesActual.getMonth(), day);
    const key = ymd(fecha);
    const cell = document.createElement("div");
    cell.className = "cal-cell";
    cell.style.position = "relative"; // para badges
    if (key===hoyYMD) cell.classList.add("hoy");
    cell.textContent = String(day);

    const info = mapaEstadoDias.get(key); // puede ser string antiguo o {estado,M,T}
    const estado = typeof info === "string" ? info : info?.estado;

    if (estado === "trabajo"){
      cell.style.backgroundColor = "#3b82f6";
      cell.style.color = "#fff";
    } else if (estado === "libre"){
      cell.style.backgroundColor = "#22c55e";
      cell.style.color = "#fff";
    }

    // Badges "M"/"T" si corresponde
    const putBadge = (txt, topRem) => {
      const b = document.createElement("span");
      b.textContent = txt;
      b.style.position = "absolute";
      b.style.top = topRem;
      b.style.left = ".25rem";
      b.style.fontSize = ".65rem";
      b.style.fontWeight = "800";
      b.style.background = "rgba(255, 255, 255, 0)";
      b.style.color = "#111827ff";
      b.style.borderRadius = ".35rem";
      b.style.padding = ".05rem .25rem";
      b.style.lineHeight = "1.1";
      b.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0)";
      b.style.pointerEvents = "none";
      cell.appendChild(b);
    };

    if (info && typeof info === "object"){
      if (info.M) putBadge("M", ".2rem");
      if (info.T) putBadge("T", info.M ? "1.1rem" : ".2rem");
    }

    cell.addEventListener("click", () => abrirDiaDesdeCalendario(fecha));
    calBody.appendChild(cell);
  }
}


/* === NUEVO: abrir día al tocar calendario === */
function abrirDiaDesdeCalendario(fecha){
  // 1) hallar lunes de esa fecha
  const dow = fecha.getDay(); // 0=Dom..6=Sab
  const offset = dow===0 ? -6 : 1 - dow;
  const lunes = new Date(fecha); lunes.setDate(fecha.getDate()+offset);
  const dd = String(lunes.getDate()).padStart(2,"0");
  const mm = String(lunes.getMonth()+1).padStart(2,"0");
  const yy = lunes.getFullYear();
  const claveSemana = `horario_semana_${dd}-${mm}-${yy}`;

  // si existe, seleccionar; si no, mantener la actual
  const opt = [...selectorSemana.options].find(o => o.value===claveSemana);
  if (opt) { selectorSemana.value = claveSemana; semanaActual = claveSemana; }

  // 2) seleccionar día de la semana
  const nombreDia = _dow[(fecha.getDay())]; // domingo..sábado
  const mapa = {domingo:"domingo", lunes:"lunes", martes:"martes", miércoles:"miércoles", jueves:"jueves", viernes:"viernes", sábado:"sábado"};
  selectorDia.value = mapa[nombreDia] || "lunes"; diaActual = selectorDia.value;

  // 3) volver a vista semana
  ocultarCalendario();
  renderizarTabla(); renderizarResumenEmpleado();
  actualizarLabelDia();
}

/* === NUEVO: toggle de vistas === */
function mostrarCalendario(){
  document.getElementById("tablaHorarioContainer").hidden = true;
  calWrap.hidden = false; mesNav.hidden = false;
  btnToggleVista.textContent = "Semana";
}
function ocultarCalendario(){
  calWrap.hidden = true; mesNav.hidden = true;
  document.getElementById("tablaHorarioContainer").hidden = false;
  btnToggleVista.textContent = "Mes";
}
btnToggleVista?.addEventListener("click", async () => {
  if (calWrap.hidden){
    // preparar calendario para el empleado logueado
    nombreEmpleadoLog = localStorage.getItem("nombre") || selectorEmpleado.value || "";
    await precalcularMapaEstados(nombreEmpleadoLog);
    const lunes = getLunesSeleccionado() || new Date();
    fechaMesActual = new Date(lunes.getFullYear(), lunes.getMonth(), 1);
    renderCalendarioMes();
    mostrarCalendario();
  } else {
    ocultarCalendario();
  }
});
btnMesPrev?.addEventListener("click", () => { fechaMesActual.setMonth(fechaMesActual.getMonth()-1); renderCalendarioMes(); });
btnMesNext?.addEventListener("click", () => { fechaMesActual.setMonth(fechaMesActual.getMonth()+1); renderCalendarioMes(); });

/* === INTEGRACIÓN: actualizar cabecera al cargar/semanas === */
const _oldRenderTabla = renderizarTabla;
renderizarTabla = function(){ _oldRenderTabla(); actualizarLabelDia(); };
window.addEventListener("DOMContentLoaded", () => {
  actualizarLabelDia();
});
// --- Filtra selector(es) de empleados (selectorEmpleado, empleadoOrigen, empleadoDestino)
(function(){
  const filtrarSelect = (id)=>{
    const sel = document.getElementById(id);
    if (!sel) return;
    [...sel.options].forEach(opt=>{
      const nombre = opt.value || opt.textContent || "";
      if (esEmpleadoOcultoPorNombre(nombre)) opt.remove();
    });
  };

  const origCargarSelector = window.cargarSelectorEmpleado;
  window.cargarSelectorEmpleado = async function(){
    await cargarEmpleadosOcultos();
    await origCargarSelector?.();
    filtrarSelect("selectorEmpleado");
    filtrarSelect("empleadoOrigen");
    filtrarSelect("empleadoDestino");
  };
})();

// --- Filtra la tabla de horario (usa empleados filtrados durante el render)
(function(){
  const origRender = window.renderizarTabla;
  window.renderizarTabla = async function(){
    await cargarEmpleadosOcultos();
    const backup = Array.isArray(window.empleados) ? [...window.empleados] : null;
    if (backup) window.empleados = backup.filter(n => !esEmpleadoOcultoPorNombre(n));
    try { return await origRender?.(); }
    finally { if (backup) window.empleados = backup; }
  };
})();
