
'use strict';

(() => {
    const SESSION_KEY = 'pulsestage.command-center.sessions.v1';
    const SAMPLE_KEY = 'pulsestage.ai.samples.v1';
    const REPORT_KEY = 'pulsestage.ai.reports.v1';

    const $ = id => document.getElementById(id);

    let activeCapture = null;
    let selectedSession = null;

    function readStorage(key, fallback = []) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || 'null');
            return Array.isArray(value) ? value : fallback;
        } catch {
            return fallback;
        }
    }

    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('[PulseStage AI] Storage error:', error);
        }
    }

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);
    }

    function formatDate(value) {
        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? 'Unknown date'
            : date.toLocaleString();
    }

    function readSessions() {
        return readStorage(SESSION_KEY);
    }

    function readSamples() {
        return readStorage(SAMPLE_KEY);
    }

    function readReports() {
        return readStorage(REPORT_KEY);
    }

    function saveReport(report) {
        const reports = readReports();

        const existingIndex = reports.findIndex(
            item => item.startedAt === report.startedAt
        );

        if (existingIndex >= 0) {
            reports[existingIndex] = report;
        } else {
            reports.push(report);
        }

        writeStorage(REPORT_KEY, reports.slice(-100));
    }

    // --------------------------------------------------
    // CAPTURE REAL SMARTSPECTRA MEASUREMENTS
    // --------------------------------------------------

    window.addEventListener('pulsestage:session-start', event => {
        const startedAt =
            event.detail?.startedAt || new Date().toISOString();

        activeCapture = {
            startedAt,
            breathingSamples: [],
            pulseSamples: []
        };

        console.log('[PulseStage AI] Measurement capture started.');
    });

    window.addEventListener('pulsestage:metrics', event => {
        if (!activeCapture) return;

        const detail = event.detail || {};
        const timestamp = detail.receivedAt || Date.now();

        const breathing = Number(detail.breathing);
        const pulse = Number(detail.pulse);

        if (Number.isFinite(breathing) && breathing > 0) {
            activeCapture.breathingSamples.push({
                value: breathing,
                timestamp
            });
        }

        if (Number.isFinite(pulse) && pulse > 0) {
            activeCapture.pulseSamples.push({
                value: pulse,
                timestamp
            });
        }

        // Limit local sample storage during long sessions.
        activeCapture.breathingSamples =
            activeCapture.breathingSamples.slice(-300);

        activeCapture.pulseSamples =
            activeCapture.pulseSamples.slice(-300);
    });

    window.addEventListener('pulsestage:session-stop', () => {
        if (!activeCapture) return;

        const samples = readSamples();

        samples.push({
            ...activeCapture,
            endedAt: new Date().toISOString()
        });

        writeStorage(SAMPLE_KEY, samples.slice(-100));

        console.log('[PulseStage AI] Session samples saved:', {
            breathing: activeCapture.breathingSamples.length,
            pulse: activeCapture.pulseSamples.length
        });

        activeCapture = null;
        renderSessionSelector();
    });

    window.addEventListener('pulsestage:session-reset', () => {
        activeCapture = null;
    });

    // --------------------------------------------------
    // AI REPORT INTERFACE
    // --------------------------------------------------

    function ensurePanel() {
        const page = $('page-reports');

        if (!page || $('cc-ai-report-panel')) return;

        const panel = document.createElement('section');

        panel.id = 'cc-ai-report-panel';
        panel.className = 'cc-panel cc-ai-report-panel';

        panel.innerHTML = `
            <div class="cc-ai-header">
                <div>
                    <span class="section-kicker">PULSESTAGE INTELLIGENCE</span>
                    <h2>AI session analysis</h2>
                    <p>
                        Generate an evidence-based report from your
                        recorded SmartSpectra measurements.
                    </p>
                </div>

                <span class="cc-ai-provider">
                    QWEN 3.8 MAX
                </span>
            </div>

            <div class="cc-ai-controls">
                <select id="cc-ai-session-select"
                        aria-label="Select session">
                    <option value="">Select a completed session</option>
                </select>

                <button id="cc-ai-analyze"
                        class="cc-primary-button"
                        type="button">
                    Analyse session
                </button>
            </div>

            <div id="cc-ai-status" class="cc-ai-status" aria-live="polite">
                Select a completed session to begin.
            </div>

            <article id="cc-ai-result"
                     class="cc-ai-result"
                     hidden>
            </article>

            <p class="cc-ai-disclaimer">
                AI-generated insights are informational, not medical
                diagnoses. Results depend on measurement quality and
                the data available for the selected session.
            </p>
        `;

        page.prepend(panel);

        $('cc-ai-analyze').addEventListener('click', analyzeSelectedSession);

        $('cc-ai-session-select').addEventListener('change', event => {
            selectedSession = event.target.value || null;
            showSavedReport();
        });
    }

    function renderSessionSelector() {
        ensurePanel();

        const select = $('cc-ai-session-select');

        if (!select) return;

        const sessions = readSessions();
        const previous = select.value;

        select.innerHTML = `
            <option value="">Select a completed session</option>
            ${sessions.map((session, index) => `
                <option value="${index}">
                    ${escapeHTML(formatDate(session.startedAt))}
                    — ${escapeHTML(session.durationSeconds || 0)} sec
                </option>
            `).join('')}
        `;

        if (
            previous !== '' &&
            sessions[Number(previous)]
        ) {
            select.value = previous;
        }

        selectedSession = select.value || null;
    }

    function setStatus(message, state = '') {
        const node = $('cc-ai-status');

        if (!node) return;

        node.textContent = message;
        node.className = `cc-ai-status ${state}`;
    }

    function showSavedReport() {
        const result = $('cc-ai-result');

        if (!result) return;

        const sessions = readSessions();
        const session = sessions[Number(selectedSession)];

        if (!session) {
            result.hidden = true;
            setStatus('Select a completed session to begin.');
            return;
        }

        const report = readReports().find(
            item => item.startedAt === session.startedAt
        );

        if (!report) {
            result.hidden = true;
            setStatus('No AI report exists for this session yet.');
            return;
        }

        result.hidden = false;
        result.textContent = report.analysis;

        setStatus(
            `Report generated ${formatDate(report.generatedAt)}`,
            'success'
        );
    }

    // --------------------------------------------------
    // QWEN ANALYSIS
    // --------------------------------------------------

    async function analyzeSelectedSession() {
        const sessions = readSessions();
        const index = Number(selectedSession);
        const session = sessions[index];

        if (!session) {
            setStatus('Please select a valid completed session.', 'error');
            return;
        }

        const button = $('cc-ai-analyze');
        const result = $('cc-ai-result');

        const samples = readSamples().find(
            item => item.startedAt === session.startedAt
        );

        const payload = {
            session: {
                startedAt: session.startedAt,
                endedAt: session.endedAt,
                durationSeconds: session.durationSeconds,
                lastBreathing: session.lastBreathing,
                lastPulse: session.lastPulse,
                breathingUpdates: session.breathingUpdates,
                pulseUpdates: session.pulseUpdates
            },

            measurements: {
                breathingSamples: samples?.breathingSamples || [],
                pulseSamples: samples?.pulseSamples || []
            },

            dataQuality: {
                breathingSampleCount:
                    samples?.breathingSamples?.length || 0,
                pulseSampleCount:
                    samples?.pulseSamples?.length || 0,
                historicalSamplesAvailable: Boolean(samples)
            }
        };

        if (
            !payload.session.breathingUpdates &&
            !payload.session.pulseUpdates
        ) {
            setStatus(
                'This session has no recorded physiological measurements. AI analysis is unavailable.',
                'error'
            );
            return;
        }

        button.disabled = true;
        button.textContent = 'Analysing...';

        result.hidden = true;

        setStatus('Qwen is analysing the recorded session...', 'loading');

        try {
            if (
                !window.pulsestage ||
                typeof window.pulsestage.analyzeSession !== 'function'
            ) {
                throw new Error(
                    'PulseStage AI bridge is unavailable. Check preload.js.'
                );
            }

            const response =
                await window.pulsestage.analyzeSession(payload);

            if (!response || !response.analysis) {
                throw new Error('Qwen returned an empty report.');
            }

            const report = {
                startedAt: session.startedAt,
                generatedAt: response.generatedAt || new Date().toISOString(),
                model: response.model || 'Qwen',
                analysis: response.analysis
            };

            saveReport(report);

            result.textContent = report.analysis;
            result.hidden = false;

            setStatus(
                'AI session analysis completed successfully.',
                'success'
            );

            console.log('[PulseStage AI] Report generated:', {
                model: report.model,
                startedAt: report.startedAt
            });

        } catch (error) {
            console.error('[PulseStage AI] Analysis failed:', error);

            setStatus(
                error.message || 'Unable to generate the AI report.',
                'error'
            );

        } finally {
            button.disabled = false;
            button.textContent = 'Analyse session';
        }
    }

    // --------------------------------------------------
    // INITIALIZATION
    // --------------------------------------------------

    function initialize() {
        ensurePanel();
        renderSessionSelector();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    window.addEventListener('storage', event => {
        if (event.key === SESSION_KEY) {
            renderSessionSelector();
        }
    });
})();
