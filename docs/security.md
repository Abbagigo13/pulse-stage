# PulseStage --- Security and Privacy

## 1. Objectives

PulseStage handles camera access, session measurements, local reports,
and an external AI credential. Minimize data collection, protect
credentials, limit renderer privileges, and explain what leaves the
device.

## 2. Data inventory

  -----------------------------------------------------------------------
  Data                    Source                  Intended handling
  ----------------------- ----------------------- -----------------------
  Camera frames           User camera             Process through
                                                  SmartSpectra; not sent
                                                  to Qwen in planned
                                                  workflow

  Physiological           SmartSpectra            Display and store
  measurements                                    samples locally

  Session metadata        PulseStage              Store locally

  AI request              Selected session        Send sanitized
                                                  structured data to Qwen
                                                  after user action

  AI response             Qwen                    Store locally and
                                                  associate with session

API credentials         `.env`                  Read in Electron main
                                                  process only
  -----------------------------------------------------------------------

Verify actual SDK behavior and vendor telemetry against official
provider documentation before making broader privacy claims.

## 3. Credential management

- Store `PRESAGE_API_KEY` and `QWEN_API_KEY` in local `.env`.
- Add `.env` to `.gitignore`.
- Commit `.env.example` with placeholders only.
- Never hard-code keys in renderer, HTML, preload, or client bundles.
- Never paste real keys into chat, issue trackers, screenshots, or
    public repositories.
- Rotate credentials if exposed.
- Do not log authorization headers.

## 4. Electron security

- Set `contextIsolation: true`.
- Set `nodeIntegration: false`.
- Keep sandboxing enabled where compatible with SDK integration.
- Use preload and `contextBridge` to expose a narrow API.
- Validate IPC inputs in the main process.
- Do not expose raw `ipcRenderer`, `require`, filesystem, shell, or
    unrestricted network access.
- Restrict navigation and unexpected windows.
- Apply an appropriate Content Security Policy.
- Keep Electron and dependencies updated.

Retain the official SmartSpectra preload if required, but review and
document its exposed capabilities.

## 5. IPC controls

The AI IPC handler should reject malformed/oversized payloads, sanitize
nested values, enforce timeouts, return safe errors, and never accept an
API key from the renderer.

**Important:** if an existing `pulsestage:get-api-key` handler returns
the actual credential to renderer code, remove or redesign it. The main
process should use Qwen credentials directly; renderer code does not
need the secret.

## 6. AI data minimization

- Send only selected-session measurements and necessary metadata.
- Do not send raw camera video or images in the planned workflow.
- Exclude credentials, unrelated user data, and local file paths.
- Bound sample count, depth, strings, and request size.
- Tell the user that selected session data is sent to Alibaba Cloud
    Qwen.
- Review current provider data handling, retention, and regional
    processing terms before public release.

## 7. Local storage

Session summaries, samples, and reports are intended for localStorage in
the prototype. - Treat localStorage as local app data, not encrypted
storage. - Never store API keys there. - Consider export and deletion
controls. - Explain that clearing app data may remove sessions and
reports. - Consider encryption at rest if the deployment threat model
requires it.

## 8. Privacy and consent

Before AI analysis, explain the selected session, categories of data
sent, the Qwen provider, and that raw camera footage is not included in
the intended request. AI output is informational, not medical advice.
Provide a clear way to stop camera processing.

## 9. Threats and mitigations

  -----------------------------------------------------------------------
  Threat                              Mitigation
  ----------------------------------- -----------------------------------
  API key in renderer bundle          Main-process-only credential
                                      access; bundle scanning

  Malformed renderer input            IPC validation and size limits

  Untrusted navigation                Navigation allowlist and window
                                      restrictions

  Sensitive logs                      Redaction and minimal logging

  Prompt injection in fields          Treat fields as data, not
                                      instructions

  Misleading AI interpretation        Evidence-bounded prompt and visible
                                      limitations

  Local data exposure                 Minimize stored data; consider
                                      encryption

Dependency compromise               Lockfile, review, updates
  -----------------------------------------------------------------------

## 10. Incident response

If a credential is exposed: revoke/rotate it, remove it from local
configuration and exposed artifacts, review Git history and distribution
artifacts, replace it securely, and verify the next build.

## 11. Limitations

This is a security plan, not a completed security audit. Production use
requires code review, dependency audit, packaged-app review, and privacy
review of third-party data flows.
