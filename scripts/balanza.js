window.addEventListener("DOMContentLoaded", () => {
    const monedas = [
        { valor: 2.00, peso: 8.5 },
        { valor: 1.00, peso: 7.5 },
        { valor: 0.50, peso: 7.8 },
        { valor: 0.20, peso: 5.7 },
        { valor: 0.10, peso: 4.1 },
    ];

    const totalEuros = document.getElementById("totalEuros");
    const resetBtn = document.getElementById("resetBtn");

    function calcular() {
        let total = 0;

        monedas.forEach((moneda, i) => {
        const pesoInput = document.getElementById(`peso-${i}`);
        const cantidadSpan = document.getElementById(`cantidad-${i}`);

        const pesoTotal = parseFloat(pesoInput.value);
        if (!isNaN(pesoTotal) && pesoTotal > 0) {
            const cantidad = Math.floor(pesoTotal / moneda.peso);
            cantidadSpan.textContent = cantidad;
            total += cantidad * moneda.valor;
            localStorage.setItem(`peso-${i}`, pesoInput.value);
        } else {
            cantidadSpan.textContent = "0";
            localStorage.removeItem(`peso-${i}`);
        }
        });

        totalEuros.textContent = total.toFixed(2) + " €";
    }

    // Cargar valores guardados y añadir eventos
    monedas.forEach((_, i) => {
        const pesoInput = document.getElementById(`peso-${i}`);
        const guardado = localStorage.getItem(`peso-${i}`);
        if (guardado) pesoInput.value = guardado;

        pesoInput.addEventListener("input", calcular);
    });

    // Botón reiniciar
    resetBtn.addEventListener("click", () => {
        monedas.forEach((_, i) => {
        const pesoInput = document.getElementById(`peso-${i}`);
        pesoInput.value = "";
        document.getElementById(`cantidad-${i}`).textContent = "0";
        localStorage.removeItem(`peso-${i}`);
        });
        totalEuros.textContent = "0,00 €";
    });

  calcular(); // Cálculo inicial
});
