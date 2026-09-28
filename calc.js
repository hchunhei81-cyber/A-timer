(function () {
'use strict';

/* ============================================================
   STATE
   ============================================================ */
var state = {
    display: '0',
    angleUnit: 'DEG',
    memory: 0,
    history: [],
    inverseTrig: false,
    hypTrig: false,
    chart: null,
    matrixDim: 2
};

/* ============================================================
   HELPERS
   ============================================================ */
function $(id) { return document.getElementById(id) }
function mathEval(expr) { return math.evaluate(expr) }

/* ============================================================
   DISPLAY
   ============================================================ */
var mainInput = $('mainDisplay');
var exprHistory = $('exprHistory');
var livePreview = $('livePreview');
var evalError = $('evalError');

function updateDisplay() {
    mainInput.value = state.display;
    updatePreview();
}

function updatePreview() {
    if (!state.display || state.display === '0') {
        livePreview.textContent = '';
        evalError.classList.add('hidden');
        return;
    }
    try {
        var result = mathEval(preprocess(state.display));
        if (typeof result === 'number' || typeof result === 'boolean') {
            livePreview.textContent = '= ' + math.format(result, { precision: 10 });
            evalError.classList.add('hidden');
        } else {
            livePreview.textContent = '';
        }
    } catch (e) {
        livePreview.textContent = '';
    }
}

function preprocess(expr) {
    var s = String(expr)
        .replace(/pi/g, 'pi')
        .replace(/phi/g, '1.618033988749895')
        .replace(/x/g, '*')
        .replace(/X/g, '*');

    if (state.angleUnit === 'DEG') {
        s = s.replace(/sin\(([^)]+)\)/g, 'sin(($1) * pi / 180)');
        s = s.replace(/cos\(([^)]+)\)/g, 'cos(($1) * pi / 180)');
        s = s.replace(/tan\(([^)]+)\)/g, 'tan(($1) * pi / 180)');
    } else if (state.angleUnit === 'GRAD') {
        s = s.replace(/sin\(([^)]+)\)/g, 'sin(($1) * pi / 200)');
        s = s.replace(/cos\(([^)]+)\)/g, 'cos(($1) * pi / 200)');
        s = s.replace(/tan\(([^)]+)\)/g, 'tan(($1) * pi / 200)');
    }

    return s;
}

function appendNum(n) {
    if (state.display === '0' && n !== '.') state.display = n;
    else state.display += n;
    updateDisplay();
}

function appendOp(op) {
    state.display += ' ' + op + ' ';
    updateDisplay();
}

function appendSymbol(s) {
    if (state.display === '0') state.display = '';
    state.display += s;
    updateDisplay();
}

function appendFunc(f) {
    if (state.display === '0') state.display = '';
    state.display += f + '(';
    updateDisplay();
}

function clearAll() {
    state.display = '0';
    exprHistory.textContent = '0';
    evalError.classList.add('hidden');
    updateDisplay();
}

function deleteLast() {
    state.display = state.display.length <= 1 ? '0' : state.display.slice(0, -1).trimEnd();
    updateDisplay();
}

function toggleSign() {
    if (!state.display) return;
    state.display = state.display.charAt(0) === '-' ? state.display.slice(1) : '-' + state.display;
    updateDisplay();
}

function evaluate() {
    try {
        var raw = state.display;
        var result = mathEval(preprocess(raw));
        var formatted = math.format(result, { precision: 12 });

        exprHistory.textContent = raw + ' =';
        state.display = formatted;
        mainInput.value = formatted;
        evalError.classList.add('hidden');

        addHistory(raw, formatted);
        updateProgrammerDisplay();
    } catch (e) {
        evalError.classList.remove('hidden');
    }
}

/* ============================================================
   HISTORY
   ============================================================ */
function addHistory(expr, res) {
    state.history.unshift({ expr: expr, res: res });
    if (state.history.length > 30) state.history.pop();
    renderHistory();
}

function renderHistory() {
    var list = $('historyList');
    if (!state.history.length) {
        list.innerHTML = '<div class="history-empty">No calculations yet</div>';
        return;
    }
    list.innerHTML = state.history.map(function (item, i) {
        return '<div class="history-item" data-idx="' + i + '">' +
               '<div class="history-item-expr">' + escapeHtml(item.expr) + '</div>' +
               '<div class="history-item-result">' + escapeHtml(item.res) + '</div>' +
               '</div>';
    }).join('');
}

function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function recallHistory(idx) {
    var item = state.history[idx];
    if (!item) return;
    state.display = item.res;
    exprHistory.textContent = item.expr + ' =';
    updateDisplay();
}

/* ============================================================
   ANGLE
   ============================================================ */
function setAngle(unit) {
    state.angleUnit = unit;
    $('angleBadge').textContent = unit;
    document.querySelectorAll('.angle').forEach(function (b) {
        b.classList.toggle('active', b.dataset.angle === unit);
    });
    updatePreview();
}

/* ============================================================
   MEMORY
   ============================================================ */
function memClear() {
    state.memory = 0;
    $('memoryBadge').classList.add('hidden');
}

function memRecall() {
    appendNum(String(state.memory));
}

function memAdd() {
    try { state.memory += Number(mathEval(preprocess(state.display))); $('memoryBadge').classList.remove('hidden'); } catch (e) {}
}

function memSub() {
    try { state.memory -= Number(mathEval(preprocess(state.display))); $('memoryBadge').classList.remove('hidden'); } catch (e) {}
}

/* ============================================================
   CALCULUS
   ============================================================ */
function computeDerivative() {
    try {
        var fxStr = $('calcFx').value;
        var x0 = parseFloat($('calcX0').value);
        var h = 0.00001;
        var f = function (x) { return math.evaluate(fxStr, { x: x }) };
        var d = (f(x0 + h) - f(x0 - h)) / (2 * h);
        $('derivOut').textContent = "f'(" + x0 + ") = " + d.toFixed(6);
    } catch (e) {
        $('derivOut').textContent = 'Error';
    }
}

function computeIntegral() {
    try {
        var fxStr = $('calcFx').value;
        var a = parseFloat($('calcA').value);
        var b = parseFloat($('calcB').value);
        var n = 200;
        var f = function (x) { return math.evaluate(fxStr, { x: x }) };
        var h = (b - a) / n;
        var sum = f(a) + f(b);
        for (var i = 1; i < n; i++) {
            var x = a + i * h;
            sum += f(x) * (i % 2 === 0 ? 2 : 4);
        }
        var integral = (h / 3) * sum;
        $('integralOut').textContent = 'Integral (' + a + ' to ' + b + ') = ' + integral.toFixed(6);
    } catch (e) {
        $('integralOut').textContent = 'Error';
    }
}

/* ============================================================
   GRAPH
   ============================================================ */
function plotGraph() {
    try {
        var fxStr = $('calcFx').value;
        var canvas = $('graphCanvas');
        var ctx = canvas.getContext('2d');

        var labels = [], dataFx = [], dataDf = [];
        var h = 0.001;
        var f = function (x) { return math.evaluate(fxStr, { x: x }) };

        for (var x = -5; x <= 5; x += 0.2) {
            labels.push(x.toFixed(1));
            try {
                dataFx.push(f(x));
                dataDf.push((f(x + h) - f(x - h)) / (2 * h));
            } catch (e) {
                dataFx.push(null);
                dataDf.push(null);
            }
        }

        if (state.chart) state.chart.destroy();

        state.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'f(x)',
                        data: dataFx,
                        borderColor: '#6366f1',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.3
                    },
                    {
                        label: "f'(x)",
                        data: dataDf,
                        borderColor: '#c084fc',
                        borderWidth: 1.5,
                        borderDash: [4, 4],
                        pointRadius: 0,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 } } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 } } }
                }
            }
        });
    } catch (e) {}
}

/* ============================================================
   PROGRAMMER
   ============================================================ */
function updateProgrammerDisplay() {
    try {
        var num = parseInt(mathEval(preprocess(state.display)), 10);
        if (isNaN(num)) return;
        $('hexDisplay').textContent = num.toString(16).toUpperCase();
        $('decDisplay').textContent = num.toString(10);
        $('octDisplay').textContent = num.toString(8);
        $('binDisplay').textContent = num.toString(2);
    } catch (e) {}
}

function convertBase(target) {
    try {
        var num = parseInt(mathEval(preprocess(state.display)), 10);
        if (isNaN(num)) return;
        if (target === 'HEX') state.display = '0x' + num.toString(16).toUpperCase();
        if (target === 'BIN') state.display = '0b' + num.toString(2);
        updateDisplay();
    } catch (e) {}
}

/* ============================================================
   STATS
   ============================================================ */
function calculateStats() {
    try {
        var raw = $('statsInput').value;
        var arr = raw.split(/[\s,]+/).map(Number).filter(function (v) { return !isNaN(v) });
        if (!arr.length) return;
        $('statMean').textContent = math.mean(arr).toFixed(4);
        $('statMedian').textContent = math.median(arr).toFixed(4);
        $('statStd').textContent = math.std(arr).toFixed(4);
        $('statVar').textContent = math.variance(arr).toFixed(4);
    } catch (e) {}
}

function factorial(n) {
    if (n < 0) return 0;
    if (n === 0 || n === 1) return 1;
    var r = 1;
    for (var i = 2; i <= n; i++) r *= i;
    return r;
}

function calcPerm() {
    var n = parseInt($('permN').value), r = parseInt($('permR').value);
    if (n >= r && n >= 0) $('permOut').textContent = 'Result: ' + (factorial(n) / factorial(n - r));
    else $('permOut').textContent = 'Invalid n or r';
}

function calcComb() {
    var n = parseInt($('combN').value), r = parseInt($('combR').value);
    if (n >= r && n >= 0) $('combOut').textContent = 'Result: ' + (factorial(n) / (factorial(r) * factorial(n - r)));
    else $('combOut').textContent = 'Invalid n or r';
}

/* ============================================================
   MATRIX
   ============================================================ */
function setMatrixDim(d) {
    state.matrixDim = d;
    $('btnMat2').className = d === 2 ? 'btn-primary-pink' : 'btn-outline';
    $('btnMat3').className = d === 3 ? 'btn-primary-pink' : 'btn-outline';
    initMatrixInputs();
}

function initMatrixInputs() {
    ['matrixA', 'matrixB'].forEach(function (id) {
        var c = $(id);
        c.style.gridTemplateColumns = 'repeat(' + state.matrixDim + ', minmax(0, 1fr))';
        var html = '';
        for (var i = 0; i < state.matrixDim * state.matrixDim; i++) {
            var v = (i % (state.matrixDim + 1) === 0) ? 1 : 0;
            html += '<input type="number" class="matrix-input" value="' + v + '">';
        }
        c.innerHTML = html;
    });
}

function getMatrix(id) {
    var inputs = document.querySelectorAll('#' + id + ' .matrix-input');
    var m = [];
    for (var i = 0; i < state.matrixDim; i++) {
        var row = [];
        for (var j = 0; j < state.matrixDim; j++) {
            row.push(parseFloat(inputs[i * state.matrixDim + j].value) || 0);
        }
        m.push(row);
    }
    return m;
}

function calcMatrix(op) {
    try {
        var A = getMatrix('matrixA');
        var B = getMatrix('matrixB');
        var result;
        if (op === 'detA') result = 'Determinant(A) = ' + math.det(A);
        else if (op === 'invA') result = math.inv(A);
        else if (op === 'add') result = math.add(A, B);
        else if (op === 'mult') result = math.multiply(A, B);

        var out = $('matrixOut');
        out.textContent = typeof result === 'string' ? result : math.format(result, { precision: 4 });
    } catch (e) {
        $('matrixOut').textContent = 'Matrix error (singular matrix?)';
    }
}

/* ============================================================
   TABS
   ============================================================ */
function switchTab(name) {
    document.querySelectorAll('.tab').forEach(function (b) {
        b.classList.toggle('active', b.dataset.tab === name);
    });
    document.querySelectorAll('.view').forEach(function (v) {
        v.classList.add('hidden');
    });
    var view = $('view-' + name);
    if (view) view.classList.remove('hidden');

    var baseBadge = $('baseBadge');
    if (name === 'programmer') {
        baseBadge.classList.remove('hidden');
        updateProgrammerDisplay();
    } else {
        baseBadge.classList.add('hidden');
    }

    if (name === 'calculus') {
        setTimeout(plotGraph, 50);
    }
}

/* ============================================================
   EVENTS
   ============================================================ */
function bindEvents() {
    mainInput.addEventListener('input', function (e) {
        state.display = e.target.value;
        updatePreview();
    });

    /* Keypad */
    document.querySelector('.keypad').addEventListener('click', function (e) {
        var b = e.target.closest('.key');
        if (!b) return;
        if (b.dataset.num) appendNum(b.dataset.num);
        else if (b.dataset.op) appendOp(b.dataset.op);
        else if (b.dataset.symbol) appendSymbol(b.dataset.symbol);
        else if (b.dataset.func) appendFunc(b.dataset.func);
        else if (b.dataset.action === 'clear') clearAll();
        else if (b.dataset.action === 'delete') deleteLast();
        else if (b.dataset.action === 'sign') toggleSign();
        else if (b.dataset.action === 'equals') evaluate();
    });

    /* Tabs */
    document.querySelectorAll('.tab').forEach(function (b) {
        b.addEventListener('click', function () { switchTab(b.dataset.tab); });
    });

    /* Angle */
    document.querySelectorAll('.angle').forEach(function (b) {
        b.addEventListener('click', function () { setAngle(b.dataset.angle); });
    });

    /* Inverse trig */
    $('btnInv').addEventListener('click', function () {
        state.inverseTrig = !state.inverseTrig;
        $('btnInv').classList.toggle('active', state.inverseTrig);
        document.querySelectorAll('.trig-normal').forEach(function (e) { e.classList.toggle('hidden', state.inverseTrig); });
        document.querySelectorAll('.trig-inv').forEach(function (e) { e.classList.toggle('hidden', !state.inverseTrig); });
    });

    /* Hyperbolic */
    $('btnHyp').addEventListener('click', function () {
        state.hypTrig = !state.hypTrig;
        $('btnHyp').classList.toggle('active', state.hypTrig);
    });

    /* Memory */
    document.querySelectorAll('[data-mem]').forEach(function (b) {
        b.addEventListener('click', function () {
            var m = b.dataset.mem;
            if (m === 'clear') memClear();
            else if (m === 'recall') memRecall();
            else if (m === 'add') memAdd();
            else if (m === 'sub') memSub();
        });
    });

    /* Bitwise */
    document.querySelector('.bit-grid').addEventListener('click', function (e) {
        var b = e.target.closest('.key');
        if (!b) return;
        if (b.dataset.op) appendOp(b.dataset.op);
        else if (b.dataset.func) appendFunc(b.dataset.func);
        else if (b.dataset.convert) convertBase(b.dataset.convert);
    });

    /* History */
    $('historyList').addEventListener('click', function (e) {
        var item = e.target.closest('.history-item');
        if (!item) return;
        recallHistory(parseInt(item.dataset.idx, 10));
    });

    $('btnClearHistory').addEventListener('click', function () {
        state.history = [];
        renderHistory();
    });

    /* Calculus */
    $('btnDeriv').addEventListener('click', computeDerivative);
    $('btnIntegral').addEventListener('click', computeIntegral);
    $('btnPlot').addEventListener('click', plotGraph);

    /* Stats */
    $('btnStats').addEventListener('click', calculateStats);
    $('btnPerm').addEventListener('click', calcPerm);
    $('btnComb').addEventListener('click', calcComb);

    /* Matrix */
    $('btnMat2').addEventListener('click', function () { setMatrixDim(2); });
    $('btnMat3').addEventListener('click', function () { setMatrixDim(3); });
    document.querySelectorAll('[data-matrix]').forEach(function (b) {
        b.addEventListener('click', function () { calcMatrix(b.dataset.matrix); });
    });

    /* Keyboard */
    document.addEventListener('keydown', function (e) {
        var tag = (document.activeElement.tagName || '').toLowerCase();
        var typing = tag === 'input' || tag === 'textarea' || tag === 'select';
        var isMain = document.activeElement === mainInput;

        if (typing && !isMain) return;

        if (e.key >= '0' && e.key <= '9') { if (!isMain) appendNum(e.key); }
        else if (e.key === '.') { if (!isMain) appendNum('.'); }
        else if (['+', '-', '*', '/'].indexOf(e.key) !== -1) { if (!isMain) { e.preventDefault(); appendOp(e.key); } }
        else if (e.key === '(' || e.key === ')') { if (!isMain) appendSymbol(e.key); }
        else if (e.key === 'Enter') { e.preventDefault(); evaluate(); }
        else if (e.key === 'Backspace') { if (!isMain) { e.preventDefault(); deleteLast(); } }
        else if (e.key === 'Escape') { e.preventDefault(); clearAll(); }
    });
}

/* ============================================================
   INIT
   ============================================================ */
function init() {
    bindEvents();
    initMatrixInputs();
    setMatrixDim(2);
    updateDisplay();
    plotGraph();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
