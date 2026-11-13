# PulseStage

**Camera-based physiological session insights, powered by Presage
SmartSpectra and Alibaba Cloud Qwen.**

PulseStage is a desktop application that brings camera-based
physiological measurement, session tracking, and AI-assisted
explanations into one workflow. It is being developed as a hackathon
prototype using the Presage SmartSpectra Node SDK and Alibaba Cloud
Qwen.

> **Important:** PulseStage is not a medical device. It does not
> diagnose, treat, or prevent disease. AI reports are informational
> explanations of supplied session data, not medical advice.

## What we're building

PulseStage helps a user move from a live practice or rehearsal session
to an understandable session report.

The application: 1. Uses Presage SmartSpectra to process camera input
and provide supported physiological measurements. 2. Displays available
measurements and SDK status in a desktop Command Center. 3. Records
session times, duration, and available measurement samples. 4. Keeps
session summaries and reports locally. 5. Lets the user select a
completed session and request an explanation from Qwen. 6. Presents
observations and cautious guidance while stating missing data and
limitations.

The intended AI request contains structured session measurements and
relevant metadata. It does not need raw camera footage.

## Why we're building it

Raw measurements can be difficult to interpret. A chart may show a
changing number without explaining what was measured, what data was
missing, or what conclusions are reasonable.

Generic chatbots have the opposite problem: they can give fluent answers
without being connected to a real session.

PulseStage connects actual SDK-produced session data to an AI
explanation. The goal is to make session information easier to
understand without pretending that estimates are diagnoses or incomplete
data is conclusive.

## Who it's for

- People who rehearse, present, perform, train, or practise and want
    session feedback.
- Coaches and facilitators exploring session-level performance
    indicators.
- Developers and evaluators interested in camera-based physiological
    measurement and AI workflows.
- Hackathon judges looking for a practical integration with a clear
    user problem.

PulseStage is not intended to replace medical professionals or clinical
instruments.

## Product plan

### Phase 1 --- Measurement foundation

- Integrate SmartSpectra into Electron.
- Request camera permission and show preview.
- Receive and decode SDK measurement events.
- Display SDK status and validation feedback.

### Phase 2 --- Session Command Center

- Start and stop sessions.
- Show live supported measurements.
- Store session summaries and history locally.
- Provide a Reports area.

### Phase 3 --- Qwen intelligence

- Keep Qwen credentials in the Electron main process.
- Send sanitized session measurements through IPC.
- Generate a structured session explanation.
- Save and revisit reports locally.
- Explain missing data and limitations.

### Phase 4 --- Reliability and submission

- Verify stable SDK frame processing.
- Test camera and lighting conditions.
- Test AI failure handling and output quality.
- Review Electron security and privacy.
- Prepare hackathon demo and documentation.

## Current implementation status

This reflects the latest development information available when this
README was prepared. Re-test before submission.

  -----------------------------------------------------------------------
  Area                                Current status
  ----------------------------------- -----------------------------------
  Electron desktop shell              Implemented

  Command Center UI and navigation    Implemented

  SmartSpectra SDK 3.4.0 integration  Added; end-to-end frame pipeline
                                      still needs verification

  Camera preview                      Demonstrated

  Session summary and local history   Implemented

  Qwen API connectivity               Successfully tested

  Qwen model configuration            `qwen3.8-max`

  Qwen analysis service / IPC         Code prepared; confirm merged and
                                      tested

  Reports-page AI workflow            Code prepared; confirm merged and
                                      tested

  Stable real measurement capture     Must be re-verified; prior
                                      dropped-frame / invalid-state logs
                                      observed

Production security and privacy     Not complete
  audit
  -----------------------------------------------------------------------

Do not describe a feature as complete until it has been tested in the
current build.

## Technology stack

- Electron
- JavaScript, HTML, and CSS
- Presage SmartSpectra Node SDK 3.4.0
- Alibaba Cloud Qwen via DashScope-compatible API
- Chart.js
- esbuild
- npm
- localStorage for prototype session and report persistence

## Project structure

``` text
pulsestage/
├── .env                  # Private credentials; never commit
├── .env.example          # Placeholder configuration
├── .gitignore
├── package.json
├── main.js               # Electron main process and IPC
├── preload.js            # Narrow renderer bridge + SDK preload
├── renderer.js           # SmartSpectra renderer integration
├── command-center.js     # Navigation, sessions, dashboard
├── command-center-ai.js  # AI sample capture and Reports UI
├── qwen-service.js       # Main-process Qwen service
├── index.html
├── command-center.css
├── ui.js
└── dist/
    ├── renderer.bundle.js
    └── preload.bundle.js
```

The AI files are part of the prepared integration; verify they exist in
the working tree.

## Setup

### Requirements

- Windows 11 or another OS supported by project dependencies.
- Node.js and npm compatible with the project lockfile.
- A camera supported by SmartSpectra.
- Presage credentials if required by your SDK account.
- Alibaba Cloud DashScope API access for Qwen.

### Install

Open PowerShell in the project folder:

``` powershell
cd C:\Users\PC\Downloads\pulsestage-workspace\pulsestage
npm install
```

### Configure environment

Create `.env` in the project root:

``` env
PRESAGE_API_KEY=your_presage_key
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen3.8-max
QWEN_API_KEY=your_qwen_key
```

Use your own credentials locally. Never paste real keys into this README
or commit `.env`.

### Run

``` powershell
npm start
```

The current start script builds renderer and preload bundles before
launching Electron.

## Using PulseStage

1. Launch the app.
2. Open the rehearsal / measurement experience.
3. Grant camera access and position yourself as directed.
4. Start a session.
5. Wait for valid SDK measurements.
6. Stop the session.
7. Open Reports, choose the completed session, and request analysis
    once the AI workflow is integrated.
8. Review the report, including its data limitations.

If valid SDK measurements are not produced, do not interpret the session
as a successful measurement session.

## Privacy and safety

- Camera access is used for the SmartSpectra measurement workflow.
- The intended Qwen request contains structured session data, not raw
    video.
- Qwen credentials must remain in the Electron main process.
- Session data and reports are stored locally in the prototype.
- AI output is not a diagnosis or medical advice.
- Review provider data handling and retention terms before public
    deployment.

## Documentation

- [Product Requirements](prd.md)
- [Hackathon Plan](hackathon.md)
- [Testing Strategy](testing.md)
- [Security and Privacy](security.md)
- [Design System](design_system.md)
- [Agent Guidelines](agents.md)
- [Architecture](architecture.md)

## Commands

``` powershell
npm run build
npm start
```

Run available tests before submitting. Add automated tests as the
project matures.

## Current priority

Previous logs showed SmartSpectra dropped-frame messages with an
invalid-state error. The most important technical priority is verifying
the SDK frame-processing lifecycle and confirming genuine measurements
arrive consistently. Camera preview alone does not prove the SDK is
processing frames successfully.

## Roadmap

- [ ] Verify stable SmartSpectra frame delivery and metric output.
- [ ] Verify session sample capture and association.
- [ ] Integrate and test Qwen analysis through main-process IPC.
- [ ] Verify report persistence and retrieval.
- [ ] Add user-facing disclosure before sending session data to Qwen.
- [ ] Add local data deletion / export controls if required.
- [ ] Complete security, privacy, and packaged-build checks.
- [ ] Prepare hackathon demo, screenshots, and submission materials.

## Project status

PulseStage is an active prototype. The goal is a reliable, transparent,
privacy-conscious session-insights workflow---not a medical diagnostic
product.
