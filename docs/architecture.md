# PulseStage --- Technical Architecture

## 1. Overview

PulseStage is an Electron desktop application. The renderer presents the
Command Center and receives measurement events from the Presage
SmartSpectra integration. Completed sessions are summarized and stored
locally. When the user requests analysis, structured session data
travels through a narrow IPC bridge to the Electron main process, which
calls Alibaba Cloud Qwen and returns the report.

## 2. Data flow

``` text
Camera
  -> Presage SmartSpectra SDK
  -> Electron / SDK integration
  -> Renderer measurement handler
      -> Live measurement UI
      -> Session events
          -> Command Center
              -> Session summaries (localStorage)
              -> Bounded samples (localStorage)
                  -> Reports page
                      -> User requests analysis
                      -> Preload IPC bridge
                      -> Electron main process
                      -> qwen-service.js
                      -> Alibaba Cloud Qwen API
                      -> Report returned to UI
                      -> Report stored locally
```

## 3. Components

### `main.js` --- Electron main process

Creates the BrowserWindow, loads environment configuration, configures
secure preferences, binds SmartSpectra main-process integration,
registers IPC handlers, and calls Qwen without exposing credentials.

### `preload.js` --- Bridge

Loads the SmartSpectra SDK preload and exposes a narrow PulseStage API
through `contextBridge`. The analysis method should invoke
`pulsestage:analyze-session`.

**Security:** if an existing `pulsestage:get-api-key` handler returns
the actual key to renderer code, remove or redesign it. The main process
should use Qwen credentials directly.

### `renderer.js` --- SmartSpectra renderer

Initializes the SDK integration, receives and decodes SDK metrics,
updates live readouts/charts, and dispatches events such as: -
`pulsestage:metrics` - `pulsestage:session-start` -
`pulsestage:session-stop` - `pulsestage:validation` -
`pulsestage:status`

### `command-center.js`

Handles navigation, dashboard pages, live session state, session
summaries, history, and the Reports page container.

### `command-center-ai.js`

Proposed AI capture/UI module. It captures bounded samples from metrics
events, associates them with a session, populates Reports, calls
`window.pulsestage.analyzeSession`, and stores reports locally. Confirm
it exists and has been tested before treating it as deployed.

### `qwen-service.js`

Main-process service that reads Qwen configuration, sanitizes/bounds
session data, calls the DashScope-compatible endpoint, enforces a
timeout, and returns safe result metadata.

## 4. Environment configuration

Project-root `.env` (private; never commit):

``` env
PRESAGE_API_KEY=your_presage_key
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen3.8-max
QWEN_API_KEY=your_qwen_key
```

Safe `.env.example`:

``` env
PRESAGE_API_KEY=replace_with_your_presage_key
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen3.8-max
QWEN_API_KEY=replace_with_your_qwen_key
```

## 5. Local data model

Illustrative session summary:

``` json
{
  "startedAt": "ISO-8601 timestamp",
  "endedAt": "ISO-8601 timestamp",
  "durationSeconds": 0,
  "lastBreathing": null,
  "lastPulse": null,
  "breathingUpdates": 0,
  "pulseUpdates": 0
}
```

The proposed sample capture stores bounded samples associated with the
session start timestamp. Keep missing values missing.

Illustrative report:

``` json
{
  "sessionStartedAt": "ISO-8601 timestamp",
  "model": "qwen3.8-max",
  "analysis": "Report text",
  "generatedAt": "ISO-8601 timestamp"
}
```

## 6. API interaction

Renderer-to-main: - IPC channel: `pulsestage:analyze-session`. - Input:
selected session's structured data. - Output: model name, analysis,
optional usage metadata, generation timestamp.

Main-to-Qwen: - `POST {QWEN_BASE_URL}/chat/completions`. - Bearer
authentication from `QWEN_API_KEY`. - Request includes model, system
instructions, and sanitized session data. - Enforce a timeout and handle
provider errors safely.

## 7. Build and runtime

Current scripts build the renderer and preload bundles, then launch
Electron. Run from project root:

``` powershell
npm start
```

## 8. Security boundaries

- Renderer never receives provider credentials.
- Main process owns the outbound Qwen request.
- Preload exposes only approved functions.
- Validate IPC payloads and cap their size.
- Keep `.env` out of Git.
- Do not send camera frames to Qwen in the intended workflow.
- Render model output as text, never executable HTML.

## 9. Known risks and open items

- Previous SmartSpectra logs showed dropped frames / invalid-state
    errors.
- Confirm SDK bridge behavior against SDK 3.4.0 documentation.
- Verify event ordering and session/sample association.
- Review whether localStorage is sufficient for expected session
    volume.
- Review provider data handling and regional processing terms.
- Confirm AI IPC code is present in current `main.js` and
    `preload.js`.
- Remove any IPC method that exposes an API key to renderer code.
