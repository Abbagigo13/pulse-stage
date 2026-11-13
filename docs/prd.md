# PulseStage --- Product Requirements Document

**Product:** PulseStage\
**Status:** Active prototype / hackathon build\
**Platform:** Electron desktop application; web direction is planned\
**Measurement SDK:** Presage SmartSpectra Node SDK 3.4.0\
**AI provider:** Alibaba Cloud Qwen, via DashScope-compatible API
(Singapore endpoint)

## 1. What we're building

PulseStage is a camera-based physiological session measurement and
performance-insights application. Presage SmartSpectra processes camera
input and supplies supported measurements. PulseStage presents session
information in a desktop Command Center. PulseStage AI uses Qwen to
explain a completed session using only the structured measurements and
session information supplied to it.

PulseStage is an informational performance-awareness product, not a
medical diagnostic system.

## 2. Why we're building it

Raw measurements and charts can be difficult to interpret. Generic
chatbot advice is not grounded in a person's actual session. PulseStage
connects real SDK-produced session data to an AI explanation, while
making missing data and limitations visible.

## 3. Intended users

- People who rehearse, present, perform, train, or practise and want
    session feedback.
- Coaches and facilitators exploring session-level performance
    indicators.
- Developers and evaluators interested in camera-based physiological
    measurement workflows.
- Hackathon judges assessing a practical SDK and AI integration.

These are intended audiences, not claims of clinical suitability.

## 4. Product goals

- Integrate SmartSpectra into a secure Electron application.
- Display supported measurements and SDK validation/status.
- Let users start and stop sessions.
- Store session summaries and measurement samples locally.
- Let users request a Qwen explanation for a completed session.
- Keep AI credentials in the Electron main process.
- Communicate data quality, missing values, and limitations.
- Deliver a reliable, demonstrable prototype.

## 5. Non-goals

- Diagnosing diseases or detecting medical conditions.
- Recommending medication or treatment.
- Replacing clinicians or validated medical devices.
- Inventing missing readings or claiming unsupported accuracy.
- Sending raw camera footage to Qwen in the intended analysis
    workflow.
- Building cloud accounts or synchronization unless separately scoped.

## 6. Main user journey

1. User opens PulseStage and grants camera permission.
2. User starts a rehearsal or practice session.
3. SmartSpectra processes camera input and emits supported measurements
    and status events.
4. PulseStage displays available measurements and records session
    information.
5. User stops the session.
6. User opens Reports and selects the completed session.
7. User chooses **Analyse session**.
8. The Electron main process sends a sanitized structured payload to
    Qwen.
9. Qwen returns a cautious explanation.
10. PulseStage displays and stores the report locally.

## 7. Functional requirements

### FR-01 --- Camera and SDK

- Use the supported SmartSpectra integration for camera processing.
- Surface SDK startup, running, stop, validation, and error states.
- Do not treat camera preview FPS as proof of SDK processing FPS.

### FR-02 --- Sessions

- Record start time, end time, duration, and available measurement
    updates.
- Preserve missing readings as missing; never silently convert them to
    zero.
- Support session start, stop, and reset.

### FR-03 --- Measurement display

- Display only values actually emitted and decoded by the SDK.
- Use units and definitions only when confirmed by SDK documentation.
- Indicate unavailable or invalid readings.

### FR-04 --- History

- Display completed session summaries.
- Persist summaries locally.
- Provide an empty state when no sessions exist.

### FR-05 --- AI analysis

- Allow analysis of a selected completed session.
- Send structured data to Qwen through main-process IPC.
- Distinguish measured facts from possible interpretations.
- Handle missing configuration, timeout, API errors, and empty
    responses.

### FR-06 --- Reports

- Associate each report with its source session.
- Store reports locally and allow the user to revisit them.

### FR-07 --- Privacy

- Explain what session data is sent for AI analysis.
- Do not send raw video to Qwen in the planned workflow.
- Require an explicit user action to request analysis.

## 8. Quality requirements

- Electron context isolation enabled and renderer Node integration
    disabled.
- Credentials excluded from renderer bundles and source control.
- UI remains responsive during analysis.
- Loading, empty, success, and error states are clear.
- Measurement precision and health significance are not overstated.

## 9. Success criteria

A successful prototype demonstration shows the app launching, camera/SDK
initialization, a session starting and stopping, genuine SDK
measurements arriving when signal conditions permit, a saved session, a
Qwen report generated from that session, and visible limitations/privacy
messaging.

## 10. Current implementation status

Based on the latest development information: - Electron application and
Command Center UI exist. - SmartSpectra SDK 3.4.0 is installed and
integrated. - Camera preview has been demonstrated. - Session
navigation, summaries, and local history have been implemented. - Qwen
connectivity was successfully tested with model `qwen3.8-max` using the
configured DashScope-compatible endpoint. - Qwen analysis service, IPC
bridge, and Reports workflow code have been prepared; confirm they are
present and tested before calling them complete. - Previous SmartSpectra
logs showed dropped-frame / invalid-state messages. Stable end-to-end
measurement processing remains an item to verify.

## 11. Open questions

- Confirm the official hackathon name, track, deadline, rubric, and
    required deliverables.
- Confirm SmartSpectra metric definitions, units, and validation
    meanings from official documentation.
- Decide whether export and deletion controls are required.
- Retest the SDK frame-processing lifecycle on supported cameras.
