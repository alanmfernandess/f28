document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DADOS DE PERFORMANCE DIGITALIZADOS DOS GRÁFICOS ---
    const performanceData = {
        flap6: {
            weights: [24000, 26000, 28000, 30000, 32000],
            thrustIndices: [50, 70, 90, 110, 130, 150, 170],
            indications: [ // Matriz de Thrust Indication para Flap 6
                [58.0, 60.5, 63.0, 65.5, 68.0], // TI 50
                [59.0, 61.5, 64.0, 66.5, 69.0], // TI 70
                [60.0, 62.5, 65.0, 67.5, 70.0], // TI 90
                [61.0, 63.5, 66.0, 68.5, 71.0], // TI 110
                [62.0, 64.5, 67.0, 69.5, 72.0], // TI 130
                [63.0, 65.5, 68.0, 70.5, 73.0], // TI 150
                [64.0, 66.5, 69.0, 71.5, 74.0]  // TI 170
            ]
        },
        flap11: {
            weights: [24000, 26000, 28000, 30000, 32000],
            thrustIndices: [50, 70, 90, 110, 130, 150, 170],
            indications: [ // Matriz de Thrust Indication para Flap 11
                [55.0, 57.7, 60.3, 63.0, 65.7], // TI 50
                [56.8, 59.5, 62.1, 64.8, 67.5], // TI 70
                [58.6, 61.3, 63.9, 66.6, 69.3], // TI 90
                [60.4, 63.1, 65.7, 68.4, 71.1], // TI 110
                [62.2, 64.9, 67.5, 70.2, 72.9], // TI 130
                [64.0, 66.7, 69.3, 72.0, 74.7], // TI 150
                [65.8, 68.5, 71.1, 73.8, 76.5]  // TI 170
            ]
        },
        flap18: {
            weights: [24000, 26000, 28000, 30000, 32000],
            thrustIndices: [50, 70, 90, 110, 130, 150, 170],
            indications: [ // Matriz de Thrust Indication para Flap 18
                [52.0, 54.8, 57.5, 60.2, 63.0], // TI 50
                [54.0, 56.8, 59.5, 62.2, 65.0], // TI 70
                [56.0, 58.8, 61.5, 64.2, 67.0], // TI 90
                [58.0, 60.8, 63.5, 66.2, 69.0], // TI 110
                [60.0, 62.8, 65.5, 68.2, 71.0], // TI 130
                [62.0, 64.8, 67.5, 70.2, 73.0], // TI 150
                [64.0, 66.8, 69.5, 72.2, 75.0]  // TI 170
            ]
        }
    };

    // --- 2. REFERÊNCIAS AOS ELEMENTOS DO DOM ---
    const flapInput = document.getElementById('flap-setting');
    const weightInput = document.getElementById('aircraft-weight');
    const thrustIndexInput = document.getElementById('thrust-index');
    const elevationInput = document.getElementById('airport-elevation');
    const calculateBtn = document.getElementById('calculate-btn');
    const thrustResultSpan = document.getElementById('thrust-result');
    const thrustIndexGroup = document.getElementById('thrust-index-group');

    // --- 3. FUNÇÕES DE CÁLCULO (INTERPOLAÇÃO) ---
    const linearInterpolate = (x, x1, y1, x2, y2) => {
        if (x1 === x2) return y1;
        return y1 + (x - x1) * (y2 - y1) / (x2 - x1);
    };

    const bilinearInterpolate = (weight, tIndex, data) => {
        let w_idx1 = data.weights.findIndex(w => w >= weight);
        if (w_idx1 === -1) w_idx1 = data.weights.length - 1;
        if (w_idx1 === 0) w_idx1 = 1;
        let w_idx0 = w_idx1 - 1;

        let ti_idx1 = data.thrustIndices.findIndex(ti => ti >= tIndex);
        if (ti_idx1 === -1) ti_idx1 = data.thrustIndices.length - 1;
        if (ti_idx1 === 0) ti_idx1 = 1;
        let ti_idx0 = ti_idx1 - 1;

        const q11 = data.indications[ti_idx0][w_idx0];
        const q12 = data.indications[ti_idx1][w_idx0];
        const q21 = data.indications[ti_idx0][w_idx1];
        const q22 = data.indications[ti_idx1][w_idx1];

        const w1 = data.weights[w_idx0];
        const w2 = data.weights[w_idx1];
        const ti1 = data.thrustIndices[ti_idx0];
        const ti2 = data.thrustIndices[ti_idx1];
        
        const r1 = linearInterpolate(weight, w1, q11, w2, q21);
        const r2 = linearInterpolate(weight, w1, q12, w2, q22);

        return linearInterpolate(tIndex, ti1, r1, ti2, r2);
    };
    
    // --- 4. FUNÇÃO PRINCIPAL E EVENTOS ---
    const calculateProcedure = () => {
        const flaps = parseInt(flapInput.value, 10);
        const weight = parseFloat(weightInput.value);
        const tIndex = parseFloat(thrustIndexInput.value);
        const elevation = parseFloat(elevationInput.value) || 0;

        let data;
        if (flaps === 6) {
            data = performanceData.flap6;
        } else if (flaps === 11) {
            data = performanceData.flap11;
        } else if (flaps === 18) {
            data = performanceData.flap18;
        }

        if (data) {
            if (isNaN(weight) || isNaN(tIndex) ||
                weight < data.weights[0] || weight > data.weights[data.weights.length-1] ||
                tIndex < data.thrustIndices[0] || tIndex > data.thrustIndices[data.thrustIndices.length-1]) {
                alert(`Por favor, insira valores dentro da faixa do gráfico:\nPeso: ${data.weights[0]} - ${data.weights[data.weights.length-1]} kg\nThrust Index: ${data.thrustIndices[0]} - ${data.thrustIndices[data.thrustIndices.length-1]}`);
                thrustResultSpan.textContent = "-";
                return;
            }
            
            const baseIndication = bilinearInterpolate(weight, tIndex, data);
            const altitudeCorrection = (elevation / 1000) * 0.1;
            const finalIndication = baseIndication + altitudeCorrection;
            
            thrustResultSpan.textContent = finalIndication.toFixed(1);

        } else {
            thrustResultSpan.textContent = "-";
            alert("Configuração de flap não suportada ou dados indisponíveis.");
        }
    };
    
    // O campo "Thrust Index" é relevante para todos os flaps com gráficos
    const toggleThrustIndexVisibility = () => {
        const flaps = parseInt(flapInput.value, 10);
        thrustIndexGroup.style.display = (flaps === 6 || flaps === 11 || flaps === 18) ? 'flex' : 'none';
    };

    // --- 5. ADICIONAR EVENT LISTENERS ---
    calculateBtn.addEventListener('click', calculateProcedure);
    flapInput.addEventListener('change', toggleThrustIndexVisibility);
    toggleThrustIndexVisibility();
});
