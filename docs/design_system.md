# PulseStage --- Design System

## 1. Design direction

PulseStage uses a restrained premium dark interface for focused session
monitoring. It should feel like a professional measurement workspace,
not a generic AI dashboard.

Principles: - Clarity before decoration. - Meaningful information
density. - Typography, spacing, and alignment create hierarchy. - Subtle
borders and restrained accents. - Honest states: unavailable,
validating, live, complete, and error. - Motion communicates state
rather than distracting.

## 2. Brand personality

**Precise · Calm · Technical · Trustworthy**

Avoid excessive gradients, glowing cards, decorative charts without real
data, overuse of glassmorphism, fake live indicators, and unsupported
medical-looking claims.

## 3. Color tokens

  Token                   Value       Usage
  ----------------------- ----------- ------------------------------
  `--ps-bg`               `#080B12`   Main background
  `--ps-surface`          `#0E1420`   Primary panels
  `--ps-surface-raised`   `#121B2A`   Raised controls
  `--ps-border`           `#202B3B`   Borders and dividers
  `--ps-text`             `#E8EEF7`   Primary text
  `--ps-muted`            `#8B98AA`   Secondary text
  `--ps-blue`             `#4D8DFF`   Primary action / focus
  `--ps-cyan`             `#42C7D5`   Secondary data accent
  `--ps-success`          `#43B581`   Confirmed success
  `--ps-warning`          `#D9A441`   Caution / validation
  `--ps-danger`           `#E16B72`   Errors / destructive actions

Never communicate status through color alone.

## 4. Typography

Use a system UI font stack. Use tabular numerals for measurements,
timestamps, and durations. Keep labels concise and readable.

Suggested hierarchy: - Page title: 24--30 px, semibold. - Section title:
15--18 px, semibold. - Body: 13--15 px. - Metadata: 11--12 px. -
Measurement value: 28--36 px, tabular numerals.

## 5. Layout

-   Navigation: Overview, Rehearsal, History, Reports, Settings,
    Privacy.
-   Keep content aligned and spacing consistent.
-   Group related information; do not turn every field into a card.
-   Keep session state and important measurements visible.
-   Reflow for smaller desktop windows and avoid horizontal overflow.

## 6. Components

### Measurement readout

Show metric name, value, verified unit, and status/timestamp where
useful. Show unavailable state when no valid value exists.

### Session status

Distinguish idle, initializing, running, stopping, completed, and error.
Do not show Live before the SDK confirms the running state.

### Charts

Plot actual samples only. Label axes and units. Handle
empty/insufficient data. Avoid smoothing that implies unsupported
precision.

### AI report

Show selected session and model. Provide loading, success, and error
states. Separate measured facts, observations, recommendations, and
limitations. Keep the informational-use disclaimer near the analysis.

### Buttons and forms

Make primary actions distinct. Provide focus, hover, disabled, and error
states. Disable duplicate submissions while a request is running.

## 7. Accessibility

-   Support keyboard navigation and visible focus.
-   Use semantic HTML and accessible names.
-   Maintain adequate contrast.
-   Do not rely only on color, motion, or sound.
-   Respect reduced-motion preferences.

## 8. Motion and loading

Use subtle transitions. Use skeleton loading only when content is
genuinely loading. Avoid continuous decorative animations.

## 9. Responsive behavior

Collapse navigation when needed, reflow measurement panels, keep reports
readable, and test minimum window size and high-DPI scaling.

## 10. Acceptance checklist

-   [ ] No fabricated metrics or fake charts.
-   [ ] Restrained dark surfaces and accent colors.
-   [ ] Clear type hierarchy and spacing.
-   [ ] Visible focus and readable contrast.
-   [ ] Empty, loading, error, and success states.
-   [ ] Responsive layout tested.
-   [ ] Reduced motion respected.
