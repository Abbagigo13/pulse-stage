
'use strict';

const {
    SmartSpectraSDK,
    ProcessingStatus,
    ValidationCode,
    breathingMetrics,
    cardioMetrics,
    faceMetrics,
} = require('@smartspectra/node-sdk/renderer');

const { decodeMetrics } = require('@smartspectra/node-sdk/messages');
const { Chart } = require('chart.js/auto');

// API key supplied at runtime.
// For development, Electron must expose PRESAGE_API_KEY to this renderer.
let API_KEY = '';
console.log('[PulseStage] Preload check:', {
    smartSpectra: typeof window.__smartspectraBridge,
    pulseStage: typeof window.pulsestage,
});

async function validateApiKey() {
    if (!API_KEY) {
        API_KEY = await window.pulsestage.getApiKey();
    }

    const key = API_KEY.trim();

    if (!key) {
        throw new Error(
            'Presage API key is missing. Check your .env file.'
        );
    }

    return key;
}

// DOM handles ---------------------------------------------------------------

const $ = id => document.getElementById(id);

const els = {
    preview: $('preview'),
    statusBadge: $('status-badge'),
    validation: $('validation'),
    errorBanner: $('error-banner'),
    errorCode: $('error-code'),
    errorMessage: $('error-message'),
    readoutPulse: $('readout-pulse'),
    readoutBreathing: $('readout-breathing'),
    btnStart: $('btn-start'),
    btnStop: $('btn-stop'),
    btnReset: $('btn-reset'),
    cardioToggle: $('m-cardio'),
    faceToggle: $('m-face'),
    panelPulseRate: $('panel-pulse-rate'),
    panelArterial: $('panel-arterial-pressure'),
};

const STATUS_NAMES = Object.fromEntries(
    Object.entries(ProcessingStatus).map(
        ([key, value]) => [value, key.replace(/^k/, '')]
    )
);

const VALIDATION_NAMES = Object.fromEntries(
    Object.entries(ValidationCode).map(
        ([key, value]) => [value, key.replace(/^k/, '')]
    )
);

// Charts --------------------------------------------------------------------

function makeChart(canvasId, yLabel) {
    const canvas = $(canvasId);

    if (!canvas) {
        throw new Error(`Missing chart canvas: ${canvasId}`);
    }

    return new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            datasets: [{
                data: [],
                borderColor: '#e3635f',
                backgroundColor: '#e3635f',
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0,
            }],
        },
        options: {
            animation: false,
            parsing: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'seconds',
                        color: '#7a8095',
                    },
                    ticks: {
                        color: '#7a8095',
                        maxTicksLimit: 8,
                        stepSize: 1,
                    },
                    grid: { color: '#2a2f3d' },
                },
                y: {
                    title: {
                        display: !!yLabel,
                        text: yLabel || '',
                        color: '#7a8095',
                    },
                    ticks: { color: '#7a8095' },
                    grid: { color: '#2a2f3d' },
                },
            },
        },
    });
}

const charts = {
    breathingRate: makeChart('chart-breathing-rate', 'BR/min'),
    breathingTrace: makeChart('chart-breathing-trace', null),
    pulseRate: makeChart('chart-pulse-rate', 'BPM'),
    arterialPressure: makeChart('chart-arterial-pressure', null),
};

function tsToNumber(ts) {
    if (ts == null) return 0;
    if (typeof ts === 'number') return ts;
    if (typeof ts === 'bigint') return Number(ts);
    if (typeof ts.toNumber === 'function') return ts.toNumber();
    return Number(ts);
}

const accumulated = {
    breathingRate: [],
    breathingTrace: [],
    pulseRate: [],
    arterialPressure: [],
};

function clearAccumulated() {
    Object.values(accumulated).forEach(buffer => {
        buffer.length = 0;
    });
}

function clearCharts() {
    clearAccumulated();

    Object.values(charts).forEach(chart => {
        chart.data.datasets[0].data = [];
        chart.update('none');
    });

    els.readoutPulse.textContent = '—';
    els.readoutBreathing.textContent = '—';
}

function applyCardioVisibility() {
    const enabled = els.cardioToggle.checked;

    els.panelPulseRate.classList.toggle('disabled', !enabled);
    els.panelArterial.classList.toggle('disabled', !enabled);
}

// Application state ---------------------------------------------------------

let metricsCount = 0;
let timeOriginUs = null;
let activeStream = null;
let sdk = null;
let commandCenterSessionOpen = false;

function readRequestedMetrics() {
    const codes = [...breathingMetrics];

    if (els.cardioToggle.checked) {
        codes.push(...cardioMetrics);
    }

    if (els.faceToggle.checked) {
        codes.push(...faceMetrics);
    }

    return codes;
}

function lastValue(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[arr.length - 1].value;
}

function appendAndRedraw(buffer, chart, measurements, origin) {
    if (!measurements || measurements.length === 0) return;

    for (const measurement of measurements) {
        buffer.push(measurement);
    }

    const points = buffer.map(measurement => ({
        x: (
            tsToNumber(measurement.timestamp) - origin
        ) / 1000000,
        y: measurement.value,
    }));

    chart.data.datasets[0].data = points;
    chart.update('none');
}

// Metrics processing --------------------------------------------------------

function handleMetrics(metrics) {
    const firstTimestamp = (
        metrics.breathing?.rate?.[0]?.timestamp ??
        metrics.breathing?.upperTrace?.[0]?.timestamp ??
        metrics.cardio?.pulseRate?.[0]?.timestamp ??
        metrics.cardio?.arterialPressureTrace?.[0]?.timestamp
    );

    if (timeOriginUs === null && firstTimestamp != null) {
        timeOriginUs = tsToNumber(firstTimestamp);
    }

    const origin = timeOriginUs ?? 0;

    appendAndRedraw(
        accumulated.breathingRate,
        charts.breathingRate,
        metrics.breathing?.rate,
        origin
    );

    appendAndRedraw(
        accumulated.breathingTrace,
        charts.breathingTrace,
        metrics.breathing?.upperTrace,
        origin
    );

    appendAndRedraw(
        accumulated.pulseRate,
        charts.pulseRate,
        metrics.cardio?.pulseRate,
        origin
    );

    appendAndRedraw(
        accumulated.arterialPressure,
        charts.arterialPressure,
        metrics.cardio?.arterialPressureTrace,
        origin
    );

    const breathing = lastValue(metrics.breathing?.rate);
    const pulse = lastValue(metrics.cardio?.pulseRate);

    if (breathing != null) {
        els.readoutBreathing.textContent = breathing.toFixed(0);
        els.readoutBreathing.classList.add('loaded');
    }

    if (pulse != null) {
        els.readoutPulse.textContent = pulse.toFixed(0);
        els.readoutPulse.classList.add('loaded');
    }

    window.dispatchEvent(
        new CustomEvent('pulsestage:metrics', {
            detail: {
                breathing: breathing == null ? null : Number(breathing),
                pulse: pulse == null ? null : Number(pulse),
                breathingSamples: metrics.breathing?.rate?.length || 0,
                pulseSamples: metrics.cardio?.pulseRate?.length || 0,
                receivedAt: Date.now(),
            },
        })
    );

    document.querySelectorAll('.chart-skeleton').forEach(element => {
        element.classList.add('hidden');
    });
}

// SDK initialization --------------------------------------------------------

async function buildSdk() {
    const requested = readRequestedMetrics();
    const apiKey = await validateApiKey();

    console.log('[PulseStage] Requested metrics:', requested);

    sdk = new SmartSpectraSDK({
        apiKey,
        requestedMetrics: requested,
        enableAccumulatedOutput: false,
    });

    sdk.on('processingStatus', status => {
        const label = STATUS_NAMES[status] || `Status(${status})`;

        console.log(
            `[PulseStage] processingStatus -> ${label} (${status})`
        );

        window.dispatchEvent(
            new CustomEvent('pulsestage:status', {
                detail: { status, label },
            })
        );

        els.statusBadge.textContent = label;
        els.statusBadge.className =
            `status status-${label.toLowerCase()}`;

        if (status === ProcessingStatus.kStarting) {
            els.btnStart.disabled = true;
            els.btnStop.disabled = false;
            els.btnReset.disabled = true;

        } else if (status === ProcessingStatus.kRunning) {
            if (!commandCenterSessionOpen) {
                commandCenterSessionOpen = true;

                window.dispatchEvent(
                    new CustomEvent('pulsestage:session-start', {
                        detail: {
                            startedAt: new Date().toISOString(),
                        },
                    })
                );
            }

            els.btnStart.disabled = true;
            els.btnStop.disabled = false;
            els.btnReset.disabled = true;

        } else if (status === ProcessingStatus.kStopping) {
            els.btnStart.disabled = true;
            els.btnStop.disabled = true;
            els.btnReset.disabled = true;

        } else if (status === ProcessingStatus.kError) {
            els.btnStart.disabled = true;
            els.btnStop.disabled = true;
            els.btnReset.disabled = false;

            closeCommandCenterSession();

        } else if (
            status === ProcessingStatus.kIdle ||
            status === ProcessingStatus.kUninitialized
        ) {
            els.btnStart.disabled = false;
            els.btnStop.disabled = true;
            els.btnReset.disabled = false;
        }
    });

    // Validation listener ---------------------------------------------------

    sdk.on('validationStatus', (code, timestampUs, hint) => {
        const name = VALIDATION_NAMES[code] || `Code(${code})`;

        console.log(
            `[PulseStage] validationStatus ${name} (${code}) ts=${timestampUs} hint=${hint || '-'}`
        );

        els.validation.textContent =
            `${name}${hint ? ' — ' + hint : ''}`;

        els.validation.className = 'hint ' + (
            code === ValidationCode.kOk ? 'hint-ok' :
            code === ValidationCode.kCameraTuning ? 'hint-warn' :
            'hint-err'
        );

        window.dispatchEvent(
            new CustomEvent('pulsestage:validation', {
                detail: {
                    code,
                    label: name,
                    hint: hint || '',
                    valid: code === ValidationCode.kOk,
                },
            })
        );
    });

    // Actual SmartSpectra measurements -------------------------------------

    sdk.on('metrics', (buffer, timestampUs) => {
        metricsCount++;

        try {
            const decoded = decodeMetrics(buffer);
            handleMetrics(decoded);
        } catch (error) {
            console.error(
                `[PulseStage] Failed to decode Metrics #${metricsCount} (${buffer.byteLength}B ts=${timestampUs}):`,
                error
            );
        }
    });

    // SDK errors ------------------------------------------------------------

    sdk.on('error', (code, message, retryable) => {
        console.error(
            `[PulseStage] error code=${code} retryable=${retryable}: ${message}`
        );

        els.errorBanner.hidden = false;
        els.errorCode.textContent = code;

        els.errorMessage.textContent = retryable
            ? `${message} (retryable)`
            : message;
    });

    // Camera stream ---------------------------------------------------------

    sdk.on('streamAvailable', stream => {
        activeStream = stream;

        els.preview.parentElement.classList.add('has-stream');
        els.preview.srcObject = stream;

        els.preview.play().catch(error => {
            console.warn(
                '[PulseStage] Preview playback could not start:',
                error
            );
        });
    });
}

// Session event helpers -----------------------------------------------------

function closeCommandCenterSession() {
    if (!commandCenterSessionOpen) return;

    commandCenterSessionOpen = false;

    window.dispatchEvent(
        new CustomEvent('pulsestage:session-stop')
    );
}

function setTogglesEnabled(enabled) {
    els.cardioToggle.disabled = !enabled;
    els.faceToggle.disabled = !enabled;
}

// UI handlers ---------------------------------------------------------------


async function startMeasurement() {
    els.btnStart.disabled = true;
    els.errorBanner.hidden = true;

    setTogglesEnabled(false);

    metricsCount = 0;
    timeOriginUs = null;

    clearCharts();

    try {
        if (!sdk) {
            await buildSdk();
        }

        await sdk.start();

    } catch (error) {
        console.error('[PulseStage] Startup failed:', error);

        els.errorBanner.hidden = false;
        els.errorCode.textContent = error.code ?? 'JS';
        els.errorMessage.textContent =
            error.message || 'Unable to start sensing session.';

        closeCommandCenterSession();

        if (sdk) {
            try {
                sdk.destroy();
            } catch (cleanupError) {
                console.error(
                    '[PulseStage] SDK cleanup failed:',
                    cleanupError
                );
            }

            sdk = null;
        }

        activeStream = null;
        els.preview.srcObject = null;
        els.preview.parentElement.classList.remove('has-stream');

        els.btnStart.disabled = false;
        els.btnStop.disabled = true;
        els.btnReset.disabled = false;

        setTogglesEnabled(true);

        els.readoutPulse.classList.remove('loaded');
        els.readoutBreathing.classList.remove('loaded');

        document.querySelectorAll('.chart-skeleton').forEach(element => {
            element.classList.remove('hidden');
        });
    }
}


async function stopMeasurement() {
    els.btnStop.disabled = true;

    els.preview.parentElement.classList.remove('has-stream');

    try {
        if (sdk) {
            await sdk.stop();
        }
    } catch (error) {
        console.error('[PulseStage] stop() failed:', error);
    }

    closeCommandCenterSession();

    activeStream = null;
    els.preview.srcObject = null;

    if (sdk) {
        try {
            sdk.destroy();
        } catch (error) {
            console.warn('[PulseStage] SDK destroy:', error);
        }

        sdk = null;
    }

    els.btnStart.disabled = false;
    els.btnStop.disabled = true;
    els.btnReset.disabled = false;

    setTogglesEnabled(true);
}

async function resetSession() {
    els.btnReset.disabled = true;

    els.preview.parentElement.classList.remove('has-stream');

    try {
        if (sdk) {
            await sdk.reset();
        }

        closeCommandCenterSession();

        window.dispatchEvent(
            new CustomEvent('pulsestage:session-reset')
        );

        els.errorBanner.hidden = true;

        activeStream = null;
        els.preview.srcObject = null;

        els.btnStart.disabled = false;
        els.btnStop.disabled = true;
        els.btnReset.disabled = false;

        setTogglesEnabled(true);

        clearCharts();

    } catch (error) {
        console.error('[PulseStage] reset() failed:', error);

        els.btnReset.disabled = false;
    }
}

// Event listeners -----------------------------------------------------------

els.btnStart.addEventListener('click', startMeasurement);
els.btnStop.addEventListener('click', stopMeasurement);
els.btnReset.addEventListener('click', resetSession);

els.cardioToggle.addEventListener(
    'change',
    applyCardioVisibility
);

// Initial state -------------------------------------------------------------

applyCardioVisibility();

els.btnStart.disabled = false;
els.btnStop.disabled = true;

// Clean shutdown ------------------------------------------------------------

window.addEventListener('beforeunload', () => {
    closeCommandCenterSession();

    if (sdk) {
        try {
            sdk.destroy();
        } catch (error) {
            console.warn('[PulseStage] Shutdown cleanup:', error);
        }
    }
});
