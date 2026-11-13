# PulseStage --- Hackathon Plan

## 1. Project pitch

**PulseStage turns camera-based physiological session measurements into
understandable, evidence-bounded performance insights.** It combines
Presage SmartSpectra for supported signal processing with Alibaba Cloud
Qwen for structured explanations of completed sessions.

The differentiator is the workflow: capture a real session, retain
actual measurements and validation context, and ask AI to explain only
the data it receives. It is not a generic chatbot.

## 2. Problem

People may finish a rehearsal, practice, or performance session with raw
numbers but no useful interpretation. Generic AI advice is not connected
to that session, while charts alone may not explain missing data or
measurement limitations.

## 3. Solution

- Camera-based measurement through SmartSpectra.
- Command Center for live session status and supported measurements.
- Local session history and reports.
- Qwen explanation of selected completed sessions.
- Explicit data-quality and safety limitations.

## 4. Intended users

Performers, presenters, people who practise, coaches, facilitators, and
developers evaluating camera-based physiological data workflows.
PulseStage is not positioned as a medical device.

## 5. Technology

  -----------------------------------------------------------------------
  Layer                   Technology              Purpose
  ----------------------- ----------------------- -----------------------
  Desktop shell           Electron                Desktop app

  UI                      HTML, CSS, JavaScript   Command Center and
                                                  reports

  Measurement             Presage SmartSpectra    Camera-based signal
                          Node SDK 3.4.0          processing

  AI                      Alibaba Cloud Qwen      Session explanation

  AI API                  DashScope               Qwen access
                          compatible-mode
                          endpoint

  Local persistence       localStorage            Prototype
                                                  session/sample/report
                                                  storage

Build                   npm / esbuild           Build renderer and
                                                  preload bundles
  -----------------------------------------------------------------------

Configured Qwen model: `qwen3.8-max`. Keep the API key private in
`.env`.

## 6. Demo story

1. Launch PulseStage.
2. Show camera preview and SDK status.
3. Start a practice/rehearsal session.
4. Show genuine SDK measurements and validation state.
5. Stop and save the session.
6. Open Reports and select the session.
7. Request Qwen analysis.
8. Explain how the report uses supplied measurements and identifies
    missing data.

Never fabricate measurements for a live demo. If the SDK does not
produce valid data, disclose that limitation.

## 7. Differentiation

- Measurement-grounded AI, not generic advice.
- Capture-to-report workflow in one desktop application.
- Prompt rules that prohibit invented readings and diagnostic claims.
- Main-process credential handling.
- Structured session data rather than raw camera video in the planned
    AI request.
- Transparent data limitations.

## 8. Milestones

### A --- Reliable measurement pipeline

Verify camera permissions, SDK initialization, frame delivery, decoded
metrics, validation events, and repeated start/stop.

### B --- Session capture

Verify session metadata, bounded sample capture, null/missing-value
handling, and persistence after restart.

### C --- Qwen analysis

Verify `.env`, main-process IPC, payload sanitation/size limits,
timeout/error handling, report storage, and report retrieval.

### D --- Submission readiness

Run clean build/install checks, prepare demo recording and screenshots,
document known limitations, and check official submission rules.

## 9. Demo checklist

- [ ] App launches.
- [ ] Camera permission works.
- [ ] SDK starts/stops without invalid-state errors.
- [ ] Genuine SDK measurements are received in a suitable test.
- [ ] Session summary is saved.
- [ ] Qwen analysis succeeds through main-process IPC.
- [ ] Report is associated with the correct session.
- [ ] API key is absent from renderer bundles and Git history.
- [ ] Raw video is not sent to Qwen.
- [ ] Safety and data limitations are visible.

## 10. Submission integrity

The official hackathon name, track, deadline, judging criteria, prize
categories, and deliverables have not been confirmed here. Add them only
after checking organizer materials. Do not claim endorsement,
certification, clinical validation, or eligibility without evidence.
