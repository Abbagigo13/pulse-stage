
'use strict';

(() => {
  const STORAGE_KEY = 'pulsestage.command-center.sessions.v1';

  const pages = [
    'overview',
    'rehearsal',
    'history',
    'reports',
    'settings',
    'privacy'
  ];

  const pageNodes = Object.fromEntries(
    pages.map(name => [
      name,
      document.getElementById(`page-${name}`)
    ])
  );

  const navButtons = [
    ...document.querySelectorAll('[data-page]')
  ];

  let activeSession = null;
  let timerHandle = null;

  let latestValidation = {
    valid: false,
    label: 'Waiting for camera'
  };

  const byId = id => document.getElementById(id);

  const safeNumber = value => {
    if (value == null || value === '') return null;

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
  };

  // --------------------------------------------------
  // LOCAL SESSION STORAGE
  // --------------------------------------------------

  function readSessions() {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeSessions(sessions) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(sessions.slice(-100))
      );
    } catch (error) {
      console.warn(
        '[PulseStage] Could not save session history:',
        error
      );
    }
  }

  // --------------------------------------------------
  // FORMATTING
  // --------------------------------------------------

  function formatDuration(seconds) {
    const total = Math.max(
      0,
      Math.floor(Number(seconds) || 0)
    );

    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;

    if (hours) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function formatTotalDuration(seconds) {
    const minutes = Math.round(
      (Number(seconds) || 0) / 60
    );

    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    return remaining
      ? `${hours} hr ${remaining} min`
      : `${hours} hr`;
  }

  function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Unknown date';
    }

    return date.toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  function escapeText(value) {
    return String(value ?? '').replace(
      /[&<>"']/g,
      char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char]
    );
  }

  // --------------------------------------------------
  // SESSION INTELLIGENCE UI
  // --------------------------------------------------

  function ensureIntelligencePanels() {
    const overview = pageNodes.overview;
    const rehearsal = pageNodes.rehearsal;

    if (overview && !byId('cc-live-overview')) {
      const panel = document.createElement('section');

      panel.id = 'cc-live-overview';
      panel.className = 'cc-live-overview cc-panel';

      panel.innerHTML = `
        <div class="cc-live-overview-heading">
          <div>
            <span class="section-kicker">
              SESSION INTELLIGENCE
            </span>
            <h2>Live session monitor</h2>
          </div>

          <span id="cc-live-state" class="cc-live-pill">
            NO ACTIVE SESSION
          </span>
        </div>

        <div class="cc-live-metrics">

          <div>
            <small>SESSION DURATION</small>
            <strong id="cc-live-duration">00:00</strong>
          </div>

          <div>
            <small>BREATHING RATE</small>
            <strong>
              <span id="cc-live-breathing">—</span>
              <em>BR/min</em>
            </strong>
          </div>

          <div>
            <small>HEART RATE</small>
            <strong>
              <span id="cc-live-pulse">—</span>
              <em>BPM</em>
            </strong>
          </div>

          <div>
            <small>SIGNAL QUALITY</small>
            <strong id="cc-live-signal">Waiting</strong>
          </div>

        </div>

        <p id="cc-live-caption" class="cc-live-caption">
          Start a rehearsal to see genuine SmartSpectra measurements here.
        </p>
      `;

      const statGrid = overview.querySelector('.cc-stat-grid');

      if (statGrid) {
        statGrid.insertAdjacentElement('afterend', panel);
      } else {
        overview.prepend(panel);
      }
    }

    if (rehearsal && !byId('cc-session-toolbar')) {
      const toolbar = document.createElement('section');

      toolbar.id = 'cc-session-toolbar';
      toolbar.className = 'cc-session-toolbar';

      toolbar.innerHTML = `
        <div class="cc-session-toolbar-main">

          <span class="section-kicker">
            SESSION CONTROL
          </span>

          <strong id="cc-session-state">
            Ready to rehearse
          </strong>

          <small id="cc-session-started">
            Camera sensing begins only after you start.
          </small>

        </div>

        <div class="cc-session-toolbar-stats">

          <div>
            <small>ELAPSED</small>
            <strong id="cc-session-duration">00:00</strong>
          </div>

          <div>
            <small>BREATHING</small>
            <strong>
              <span id="cc-session-breathing">—</span>
              <em>BR/min</em>
            </strong>
          </div>

          <div>
            <small>PULSE</small>
            <strong>
              <span id="cc-session-pulse">—</span>
              <em>BPM</em>
            </strong>
          </div>

          <div>
            <small>VALIDATION</small>
            <strong id="cc-session-validation">
              Waiting
            </strong>
          </div>

        </div>
      `;

      const heading = rehearsal.querySelector(
        '.studio-section-heading'
      );

      if (heading) {
        heading.insertAdjacentElement('afterend', toolbar);
      } else {
        rehearsal.prepend(toolbar);
      }
    }
  }

  // --------------------------------------------------
  // DASHBOARD AND SESSION HISTORY
  // --------------------------------------------------

  function renderSessionRows(
    target,
    sessions,
    emptyTitle,
    emptyText
  ) {
    if (!target) return;

    if (!sessions.length) {
      target.innerHTML = `
        <span class="cc-empty-icon">◷</span>
        <strong>${emptyTitle}</strong>
        <p>${emptyText}</p>
      `;

      target.classList.add('cc-empty-state');
      return;
    }

    target.classList.remove('cc-empty-state');

    target.innerHTML = sessions
      .slice()
      .reverse()
      .map(session => {

        const readings = [
          session.lastBreathing != null
            ? `${Math.round(session.lastBreathing)} BR/min`
            : null,

          session.lastPulse != null
            ? `${Math.round(session.lastPulse)} BPM`
            : null

        ].filter(Boolean).join(' · ');

        const signalCount =
          (Number(session.breathingUpdates) || 0) +
          (Number(session.pulseUpdates) || 0);

        return `
          <div class="cc-session-row">

            <div>
              <strong>Rehearsal session</strong>

              <small>
                ${escapeText(formatDate(session.startedAt))}
                ·
                ${escapeText(formatDuration(session.durationSeconds))}
                ·
                ${signalCount} valid signal updates
              </small>
            </div>

            <div class="cc-session-metrics">
              ${escapeText(readings || 'No valid readings recorded')}
            </div>

          </div>
        `;
      })
      .join('');
  }

  function refreshDashboard() {
    const sessions = readSessions();

    const totalSeconds = sessions.reduce(
      (sum, item) =>
        sum + (Number(item.durationSeconds) || 0),
      0
    );

    const latest = sessions[sessions.length - 1] || {};

    const set = (id, value) => {
      const node = byId(id);

      if (node) node.textContent = value;
    };

    set('cc-total-sessions', String(sessions.length));

    set(
      'cc-total-time',
      formatTotalDuration(totalSeconds)
    );

    set(
      'cc-last-breathing',
      latest.lastBreathing == null
        ? '—'
        : String(Math.round(latest.lastBreathing))
    );

    set(
      'cc-last-pulse',
      latest.lastPulse == null
        ? '—'
        : String(Math.round(latest.lastPulse))
    );

    renderSessionRows(
      byId('cc-recent-sessions'),
      sessions.slice(-4),
      'No sessions yet',
      'Your completed rehearsals will appear here.'
    );

    renderSessionRows(
      byId('cc-history-list'),
      sessions,
      'No signal history yet',
      'Complete a rehearsal to build your personal history.'
    );

    renderSessionRows(
      byId('cc-reports-list'),
      sessions,
      'No reports available',
      'Your completed sessions will appear here.'
    );
  }

  // --------------------------------------------------
  // LIVE TIMER
  // --------------------------------------------------

  function updateTimer() {
    if (!activeSession) return;

    const elapsed = Math.max(
      0,
      Math.floor(
        (Date.now() - activeSession.startedAtMs) / 1000
      )
    );

    const value = formatDuration(elapsed);

    [
      'cc-live-duration',
      'cc-session-duration'
    ].forEach(id => {
      const node = byId(id);

      if (node) node.textContent = value;
    });
  }

  function setLiveText(id, value) {
    const node = byId(id);

    if (node) node.textContent = value;
  }

  // --------------------------------------------------
  // LIVE SESSION DISPLAY
  // --------------------------------------------------

  function updateLivePanels() {
    ensureIntelligencePanels();

    const running = Boolean(activeSession);

    const state = running
      ? 'SESSION ACTIVE'
      : 'NO ACTIVE SESSION';

    const signalText = latestValidation.valid
      ? 'Valid'
      : latestValidation.label;

    const overviewState = byId('cc-live-state');

    if (overviewState) {
      overviewState.textContent = state;

      overviewState.classList.toggle(
        'is-live',
        running
      );
    }

    setLiveText(
      'cc-live-signal',
      running ? signalText : 'Waiting'
    );

    setLiveText(
      'cc-live-caption',
      running
        ? (
            latestValidation.valid
              ? 'SmartSpectra reports valid measurement conditions.'
              : latestValidation.label
          )
        : 'Start a rehearsal to see genuine SmartSpectra measurements here.'
    );

    setLiveText(
      'cc-session-state',
      running
        ? 'Rehearsal in progress'
        : 'Ready to rehearse'
    );

    setLiveText(
      'cc-session-started',
      running
        ? `Started ${formatDate(activeSession.startedAt)}`
        : 'Camera sensing begins only after you start.'
    );

    setLiveText(
      'cc-session-validation',
      running ? signalText : 'Waiting'
    );

    const breathing =
      activeSession?.lastBreathing == null
        ? '—'
        : String(Math.round(activeSession.lastBreathing));

    const pulse =
      activeSession?.lastPulse == null
        ? '—'
        : String(Math.round(activeSession.lastPulse));

    setLiveText('cc-live-breathing', breathing);
    setLiveText('cc-session-breathing', breathing);

    setLiveText('cc-live-pulse', pulse);
    setLiveText('cc-session-pulse', pulse);

    updateTimer();
  }

  // --------------------------------------------------
  // PAGE NAVIGATION
  // --------------------------------------------------

  function showPage(name) {
    if (!pageNodes[name]) {
      name = 'overview';
    }

    pages.forEach(page => {
      const node = pageNodes[page];

      if (node) {
        node.hidden = page !== name;
      }
    });

    navButtons.forEach(button => {
      const selected = button.dataset.page === name;

      button.classList.toggle(
        'active',
        selected && button.classList.contains('cc-nav-item')
      );

      if (button.classList.contains('cc-nav-item')) {
        button.setAttribute(
          'aria-current',
          selected ? 'page' : 'false'
        );
      }
    });

    if (
      name === 'overview' ||
      name === 'history' ||
      name === 'reports'
    ) {
      refreshDashboard();
    }

    updateLivePanels();

    document
      .querySelector('.cc-workspace')
      ?.scrollTo({ top: 0, behavior: 'instant' });

    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });
  }

  // --------------------------------------------------
  // SESSION LIFECYCLE
  // --------------------------------------------------

  function startSession(detail = {}) {
    if (activeSession) return;

    const startedAt =
      detail.startedAt || new Date().toISOString();

    activeSession = {
      startedAt,

      startedAtMs: new Date(startedAt).getTime(),

      durationSeconds: 0,

      lastBreathing: null,
      lastPulse: null,

      breathingUpdates: 0,
      pulseUpdates: 0
    };

    latestValidation = {
      valid: false,
      label: 'Waiting for valid signal'
    };

    if (timerHandle) {
      clearInterval(timerHandle);
    }

    timerHandle = setInterval(updateTimer, 250);

    updateLivePanels();
  }

  function recordMetrics(detail = {}) {
    if (!activeSession) return;

    const breathing = safeNumber(detail.breathing);
    const pulse = safeNumber(detail.pulse);

    if (breathing != null) {
      activeSession.lastBreathing = breathing;
      activeSession.breathingUpdates += 1;
    }

    if (pulse != null) {
      activeSession.lastPulse = pulse;
      activeSession.pulseUpdates += 1;
    }

    updateLivePanels();
  }

  function stopSession() {
    if (!activeSession) return;

    activeSession.durationSeconds = Math.max(
      0,
      Math.round(
        (Date.now() - activeSession.startedAtMs) / 1000
      )
    );

    activeSession.endedAt = new Date().toISOString();

    const saved = { ...activeSession };

    delete saved.startedAtMs;

    const sessions = readSessions();

    sessions.push(saved);

    writeSessions(sessions);

    activeSession = null;

    if (timerHandle) {
      clearInterval(timerHandle);
    }

    timerHandle = null;

    updateLivePanels();
    refreshDashboard();
  }

  function resetSession() {
    activeSession = null;

    if (timerHandle) {
      clearInterval(timerHandle);
    }

    timerHandle = null;

    latestValidation = {
      valid: false,
      label: 'Session reset'
    };

    updateLivePanels();
  }

  // --------------------------------------------------
  // EVENT CONNECTIONS
  // --------------------------------------------------

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      showPage(button.dataset.page);
    });
  });

  byId('cc-clear-history')?.addEventListener('click', () => {
    if (!window.confirm(
      'Clear all locally saved PulseStage session summaries on this device?'
    )) return;

    writeSessions([]);

    refreshDashboard();
  });

  window.addEventListener(
    'pulsestage:session-start',
    event => startSession(event.detail || {})
  );

  window.addEventListener(
    'pulsestage:metrics',
    event => recordMetrics(event.detail || {})
  );

  window.addEventListener(
    'pulsestage:session-stop',
    stopSession
  );

  window.addEventListener(
    'pulsestage:session-reset',
    resetSession
  );

  window.addEventListener(
    'pulsestage:validation',
    event => {
      const detail = event.detail || {};

      latestValidation = {
        valid: Boolean(detail.valid),
        label:
          detail.label ||
          detail.hint ||
          'Checking signal'
      };

      updateLivePanels();
    }
  );

  window.addEventListener(
    'pulsestage:status',
    event => {
      const detail = event.detail || {};

      const badge = byId('status-badge');

      if (badge && detail.label) {
        badge.textContent = detail.label;

        badge.className =
          `status status-${String(detail.label).toLowerCase()}`;
      }
    }
  );

  window.addEventListener(
    'pulsestage:open-command-center',
    () => showPage('overview')
  );

  // --------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------

  ensureIntelligencePanels();

  refreshDashboard();

  updateLivePanels();

  window.addEventListener('beforeunload', () => {
    if (timerHandle) {
      clearInterval(timerHandle);
    }
  });

})();
