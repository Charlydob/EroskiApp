window.addEventListener("DOMContentLoaded", () => {
  const monedas = [
    { valor: 2.00, peso: 8.5 },
    { valor: 1.00, peso: 7.5 },
    { valor: 0.50, peso: 7.8 },
    { valor: 0.20, peso: 5.7 },
    { valor: 0.10, peso: 4.1 },
    { valor: 0.05, peso: 3.9 },
    { valor: 0.02, peso: 3.0 },
    { valor: 0.01, peso: 2.3 },
  ];

  const billetes = [
    { valor: 500 }, { valor: 200 }, { valor: 100 },
    { valor: 50 },  { valor: 20 },  { valor: 10 }, { valor: 5 }
  ];

  const totalEl =
    document.getElementById("totalEuros") ||
    document.getElementById("total-estimado") ||
    document.getElementById("totalEstimado");

  const fmt = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function calcular() {
    let total = 0;

    // MONEDAS (por peso)
    monedas.forEach((m, i) => {
      const pesoInput = document.getElementById(`peso-${i}`);
      const cantidadSpan = document.getElementById(`cantidad-${i}`);
      if (!pesoInput) return;

      const w = parseFloat(pesoInput.value);
      if (!isNaN(w) && w > 0) {
        const cantidad = Math.round(w / m.peso);
        if (cantidadSpan) cantidadSpan.textContent = String(cantidad);
        total += cantidad * m.valor;
        localStorage.setItem(`peso-${i}`, pesoInput.value);
      } else {
        if (cantidadSpan) cantidadSpan.textContent = "0";
        localStorage.removeItem(`peso-${i}`);
      }
    });

    // BILLETES (por cantidad)
    billetes.forEach((b, i) => {
      const cantInput = document.getElementById(`billete-${i}`);
      if (!cantInput) return;
      const n = parseInt(cantInput.value, 10) || 0;
      total += n * b.valor;
      if (n > 0) localStorage.setItem(`billete-${i}`, String(n));
      else localStorage.removeItem(`billete-${i}`);
    });

    if (totalEl) totalEl.textContent = `${fmt.format(total)} €`;
  }

  // Cargar guardados + listeners
  monedas.forEach((_, i) => {
    const el = document.getElementById(`peso-${i}`);
    if (!el) return;
    const saved = localStorage.getItem(`peso-${i}`);
    if (saved) el.value = saved;
    el.addEventListener("input", calcular);
  });

  billetes.forEach((_, i) => {
    const el = document.getElementById(`billete-${i}`);
    if (!el) return;
    const saved = localStorage.getItem(`billete-${i}`);
    if (saved) el.value = saved;
    el.addEventListener("input", calcular);
  });

  // Reset
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      monedas.forEach((_, i) => {
        const p = document.getElementById(`peso-${i}`);
        const c = document.getElementById(`cantidad-${i}`);
        if (p) p.value = "";
        if (c) c.textContent = "0";
        localStorage.removeItem(`peso-${i}`);
      });
      billetes.forEach((_, i) => {
        const b = document.getElementById(`billete-${i}`);
        if (b) b.value = "";
        localStorage.removeItem(`billete-${i}`);
      });
      if (totalEl) totalEl.textContent = "0,00 €";
    });
  }

  calcular();
});
