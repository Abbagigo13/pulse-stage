# PulseStage --- Testing Strategy

## 1. Purpose

Verify that PulseStage captures genuine SmartSpectra session data,
stores it correctly, and produces Qwen reports without leaking
credentials or inventing measurements.

## 2. Test environment

- Development OS: Windows 11.
- Runtime: Electron.
- SDK: `@smartspectra/node-sdk` 3.4.0.
- AI: Alibaba Cloud Qwen via DashScope-compatible endpoint.
- Hardware: built-in webcam and any additional supported camera
    available.
- Use versions recorded by the project's lockfile.

Record OS, Node, npm, Electron, SDK, and camera details for each test
run.

## 3. Test levels

### Unit tests

- Sanitize nested objects and arrays.
- Remove fields with names indicating keys, passwords, tokens, or
    secrets.
- Bound nesting, item counts, string lengths, and payload size.
- Preserve null/missing values.
- Validate timestamps, durations, and report/session association.

### Integration tests

- Main process loads `.env`.
- Preload retains the SmartSpectra preload bridge.
- Preload exposes only intended PulseStage functions.
- Renderer invokes AI analysis IPC.
- Main process calls Qwen and returns a valid response.
- SDK metrics reach the Command Center.
- Session start, metrics, stop, and reset events are handled
    correctly.

### End-to-end tests

1. Launch the desktop app.
2. Grant camera permission.
3. Start a session.
4. Wait for valid SDK measurements.
5. Stop the session.
6. Confirm it appears in history.
7. Select it in Reports.
8. Request AI analysis.
9. Confirm report content and persistence after restart.

## 4. Functional test cases

  -----------------------------------------------------------------------
  ID                      Scenario                Expected result
  ----------------------- ----------------------- -----------------------
  T-01                    Launch app              Main window opens
                                                  without fatal error

  T-02                    Camera permission       Clear error state; no
                          denied                  false success

  T-03                    Start session           Start time is recorded

  T-04                    Valid SDK metrics       UI updates with decoded
                                                  values

  T-05                    No metrics              UI indicates
                                                  unavailable data

  T-06                    Stop session            Duration and summary
                                                  are saved

  T-07                    Restart app             Saved sessions remain
                                                  available

  T-08                    Select session          Correct session is
                                                  selected

  T-09                    Qwen success            Report is displayed and
                                                  saved

  T-10                    Missing Qwen key        Safe configuration
                                                  error

  T-11                    Qwen HTTP error         Safe error; app remains
                                                  usable

  T-12                    Qwen timeout            Request fails
                                                  gracefully

  T-13                    Empty Qwen response     Empty-response error is
                                                  handled

  T-14                    Reset session           Active capture is
                                                  cleared correctly

T-15                    Malformed payload       Request is rejected
                                                  safely
  -----------------------------------------------------------------------

## 5. SmartSpectra pipeline checks

- Verify frames are delivered to the SDK.
- Distinguish preview FPS from SDK processing throughput.
- Capture SDK status, validation codes, and dropped-frame counts.
- Test suitable face position, lighting, distance, and stable camera
    placement.
- Confirm metrics are emitted before treating a session as analyzable.
- Investigate previous `dropped frame` / invalid-state messages before
    claiming reliability.

## 6. AI quality checks

Test valid, missing, empty, low-quality, outlier, and short-session
data. Expected behavior: - Never invent values. - State when data is
missing. - Avoid diagnosis, treatment, and medication claims. -
Distinguish observations from interpretations. - Avoid claiming trends
without historical data. - Explain when sample count or quality limits
interpretation.

AI output is non-deterministic. Review representative outputs manually.

## 7. Security tests

- Search source and built bundles for credentials; none should appear.
- Confirm `.env` is ignored by Git.
- Confirm renderer Node integration is disabled.
- Confirm context isolation is enabled.
- Confirm only intended IPC channels are exposed.
- Confirm Qwen payload excludes raw camera frames and credentials.
- Confirm logs do not print secrets or full sensitive payloads.

## 8. Build checks

From the project root:

``` powershell
npm install
npm run build
npm start
```

Before release, test a clean checkout, verify `.env.example` has
placeholders only, confirm `.env` is not committed, and test the
packaged app.

## 9. Defect template

``` text
Title:
Environment:
Steps to reproduce:
Expected result:
Actual result:
Relevant logs:
Frequency:
Severity:
Screenshots / recording:
```

## 10. Known verification item

Previous development logs showed SmartSpectra dropped-frame messages
with an invalid-state error. Re-test current code and record whether
this persists. Do not mark the measurement pipeline fully verified until
genuine measurements are received consistently.
