const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

const db = admin.database();

// Tu Server Key de Firebase Cloud Messaging
const SERVER_KEY = "AAA..."; // <- REEMPLAZÁ ESTO

const horas = [
  "7-8", "8-9", "9-10", "10-11", "11-12", "12-13", "13-14",
  "14-15", "15-16", "16-17", "17-18", "18-19", "19-20", "20-21", "21-22"
];

function horaBloqueToDecimal(bloque) {
  const [h1] = bloque.split("-").map(Number);
  return h1 + 0.5;
}

function minutosHasta(horaDecimal) {
  const ahora = new Date();
  const actual = ahora.getHours() + ahora.getMinutes() / 60;
  return (horaDecimal - actual) * 60;
}

async function enviarNotificacion(token, nombre) {
  await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      "Authorization": "key=" + SERVER_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      to: token,
      notification: {
        title: `⏰ ${nombre}, tu turno empieza pronto`,
        body: "Faltan 30 minutos para que empiece tu turno",
        icon: "https://charlydob.github.io/EroskiApp/icon-192.png"
      }
    })
  });
}

// 🔁 Función programada cada 5 minutos
exports.verificarTurnos = functions.pubsub.schedule("every 5 minutes").onRun(async () => {
  const ahora = new Date();
  const dia = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][ahora.getDay()];

  const snap = await db.ref().once("value");
  const semanas = Object.keys(snap.val() || {}).filter(k => k.startsWith("horario_semana_"));
  const semanaActual = semanas.sort().at(-1);
  if (!semanaActual) return console.warn("❌ No hay semanas cargadas");

  const datosSemana = snap.val()[semanaActual]?.[dia];
  if (!datosSemana) return;

  const tokensSnap = await db.ref("tokens").once("value");
  const tokens = tokensSnap.val() || {};

  for (const [nombre, token] of Object.entries(tokens)) {
    for (const bloque of horas) {
      const key = `${nombre}_${bloque}`;
      const valor = datosSemana[key];
      if (valor === "1" || valor === "0.5") {
        const horaDecimal = horaBloqueToDecimal(bloque);
        const minutos = minutosHasta(horaDecimal);
        if (minutos > 29 && minutos < 31) {
          console.log(`🔔 Notificando a ${nombre}`);
          await enviarNotificacion(token, nombre);
          break;
        }
      }
    }
  }

  return null;
});
