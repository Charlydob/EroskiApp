// scripts/bajas.js

(function () {
  const productoInput = document.getElementById("productoInput");
  const cantidadInput = document.getElementById("cantidadInput");
  const bajaForm      = document.getElementById("bajaForm");
  const listaBajas    = document.getElementById("listaBajas");
  const fechaHoyEl    = document.getElementById("fechaHoy");

  // Clave de hoy tipo 2025-12-01
  const hoy = new Date();
  const hoyKey = hoy.toISOString().slice(0, 10); // YYYY-MM-DD

  // Texto bonito para mostrar la fecha
  const opcionesFecha = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  fechaHoyEl.textContent = hoy.toLocaleDateString("es-ES", opcionesFecha);

  // Referencia en Firebase: /bajas/2025-12-01
  const bajasRef = db.ref("bajas").child(hoyKey);

  // Enviar nuevo producto
  bajaForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const producto = productoInput.value.trim();
    const cantidad = cantidadInput.value.trim();

    if (!producto) return;

    const nuevo = {
      producto,
      cantidad: cantidad || null,
      timestamp: Date.now()
    };

    bajasRef.push(nuevo)
      .then(() => {
        productoInput.value = "";
        cantidadInput.value = "";
        productoInput.focus();
      })
      .catch(err => {
        console.error("❌ Error al guardar baja:", err);
        alert("No se ha podido guardar. Revisa la conexión.");
      });
  });

  // Escucha en tiempo real para que todos vean lo mismo
  bajasRef.orderByChild("timestamp").on("value", snapshot => {
    listaBajas.innerHTML = "";

    if (!snapshot.exists()) {
      const li = document.createElement("li");
      li.style.opacity = 0.7;
      li.textContent = "No hay productos de baja añadidos aún.";
      listaBajas.appendChild(li);
      return;
    }

    snapshot.forEach(child => {
      const key  = child.key;
      const data = child.val();

      const li = document.createElement("li");
      li.style.padding = ".5rem .75rem";
      li.style.borderRadius = ".5rem";
      li.style.background = "rgba(255,255,255,0.05)";
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";
      li.style.gap = ".5rem";

      // Bloque izquierdo: texto + hora
      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.flexDirection = "column";

      const texto = document.createElement("span");
      texto.textContent = (data.cantidad ? `${data.cantidad}× ` : "") + data.producto;

      const hora = document.createElement("span");
      hora.style.fontSize = ".75rem";
      hora.style.opacity = 0.7;
      if (data.timestamp) {
        const d = new Date(data.timestamp);
        hora.textContent = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      }

      left.appendChild(texto);
      left.appendChild(hora);

      // Bloque derecho: acciones (editar / borrar)
      const actions = document.createElement("div");
      actions.style.display = "flex";
      actions.style.gap = ".25rem";

      const editarBtn = document.createElement("button");
      editarBtn.type = "button";
      editarBtn.textContent = "✏️";
      editarBtn.style.fontSize = "1rem";
      editarBtn.style.padding = ".25rem .4rem";

      editarBtn.addEventListener("click", () => {
        const nuevoProducto = prompt("Producto:", data.producto || "");
        if (nuevoProducto === null) return; // cancel

        const nuevaCantidad = prompt("Cantidad (opcional):", data.cantidad || "");
        if (nuevaCantidad === null) return; // cancel

        const updateData = {
          producto: nuevoProducto.trim() || data.producto,
          cantidad: (nuevaCantidad.trim() || "").length ? nuevaCantidad.trim() : null
        };

        bajasRef.child(key).update(updateData).catch(err => {
          console.error("❌ Error al editar baja:", err);
          alert("No se ha podido modificar el producto.");
        });
      });

      const borrarBtn = document.createElement("button");
      borrarBtn.type = "button";
      borrarBtn.textContent = "🗑";
      borrarBtn.style.fontSize = "1rem";
      borrarBtn.style.padding = ".25rem .4rem";

      borrarBtn.addEventListener("click", () => {
        if (!confirm("¿Eliminar este producto de la lista?")) return;
        bajasRef.child(key).remove().catch(err => {
          console.error("❌ Error al borrar baja:", err);
          alert("No se ha podido borrar el producto.");
        });
      });

      actions.appendChild(editarBtn);
      actions.appendChild(borrarBtn);

      li.appendChild(left);
      li.appendChild(actions);

      listaBajas.appendChild(li);
    });
  });

})();