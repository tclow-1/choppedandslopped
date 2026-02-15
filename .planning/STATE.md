# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** Enable anyone to create chopped and screwed remixes in their browser by loading audio files, using keyboard shortcuts to trigger crossfader chops (switching between main and ahead playback positions) while adjusting playback speed, and recording their performance as an MP3.

**Current focus:** Phase 1 - Audio Foundation

## Current Position

Phase: 1 of 4 (Audio Foundation)
Plan: 2 of 2 in current phase
Status: Phase complete
Last activity: 2026-02-14 — Completed 01-02-PLAN.md (UI components and keyboard shortcuts)

Progress: [██████████] 100% of Phase 1 ✓

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 105 min (1h 45m)
- Total execution time: 3.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Audio Foundation | 2/2 ✓ | 210 min | 105 min |

**Recent Trend:**
- Last 5 plans: 01-01 (201m), 01-02 (9m)
- Trend: Significant speedup in 01-02 (UI layer built on solid foundation)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- **Pure client-side architecture**: Everything runs in browser, no backend. This impacts audio processing capabilities but simplifies deployment.
- **File upload audio source (NOT YouTube)**: Research confirmed YouTube extraction violates ToS and is blocked by CORS. File upload via drag-and-drop is the viable v1 approach.
- **Dual-playback crossfader technique**: Authentic DJ Screw two-turntable method. App maintains main + ahead playback positions simultaneously (0.5s offset default).
- **Desktop-only**: Keyboard shortcuts are core to DJ workflow. Mobile deferred to future versions.
- **Live performance recording**: Captures performative aspect of DJ Screw technique, more authentic than timeline editing.
- **Pitch-shifted slowdown**: DJ Screw aesthetic wants pitch to drop with speed. Simplifies implementation (no time-stretching needed).
- **Native Web Audio API (01-01)**: No abstraction libraries (Howler.js, Tone.js) for full control and zero overhead.
- **Singleton AudioContext (01-01)**: Single shared context to avoid performance degradation.
- **RequestAnimationFrame position tracking (01-01)**: Stays in sync with audio clock, prevents drift from setInterval.
- **LinearRampToValueAtTime for volume (01-01)**: Supports true silence at 0 without exponential ramp workarounds.
- **Module-level AudioContext singleton (01-02)**: Prevents context closure on component unmount (React strict mode). Persists for app lifetime.
- **Speed percentage format (01-02)**: Display only number above slider (e.g. "75%"), no "Speed:" label per user decision.
- **Keyboard shortcuts disabled in text inputs (01-02)**: Filter HTMLInputElement/HTMLTextAreaElement/HTMLSelectElement targets.
- **Always-visible keyboard legend (01-02)**: Fixed bottom-right position, not modal, not toggled.

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 1 architectural discipline (COMPLETE):**
- ✅ Web Audio API timing uses AudioContext.currentTime (verified: no setTimeout/setInterval in 01-01)
- ✅ AudioNode cleanup implemented (verified: disconnect calls in useAudioPlayer)
- ✅ Autoplay policy handled (user gesture event listeners in useAudioContext)
- ✅ Module-level singleton AudioContext (verified: survives component unmount in 01-02)
- ✅ All user decisions implemented (speed format, keyboard filtering, always-visible legend)
- ✅ Phase 1 complete and user-approved via checkpoint

**Phase 3 critical implementation:**
- Crossfader via GainNode with smooth value ramping between two playback sources
- Perfect sync required between main and ahead positions (no drift)
- When chopping drums "1, 3, 1, 2" at second "1", must produce "1, 3, 2, 2"

**Research findings to apply:**
- wavesurfer.js 7.x for waveform visualization (Phase 2)
- realtime-bpm-analyzer 5.0.0 for potential BPM detection (deferred to v2)
- mp3-mediarecorder 4.0.5 for MP3 export (Phase 4)

## Session Continuity

Last session: 2026-02-14
Stopped at: Completed Phase 1 (01-02-PLAN.md - UI components and keyboard shortcuts)
Resume file: None

**Next:** Begin Phase 2 (Waveform Visualization) - Execute 02-01-PLAN.md to add visual playback feedback
