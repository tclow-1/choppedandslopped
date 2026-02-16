# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** Enable anyone to create chopped and screwed remixes in their browser by loading audio files, using keyboard shortcuts to trigger crossfader chops (switching between main and ahead playback positions) while adjusting playback speed, and recording their performance as an MP3.

**Current focus:** Phase 3 - Live Performance

## Current Position

Phase: 3.5 of 4 (YouTube Integration)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-02-16 - Completed 3.5-01-PLAN.md (YouTube extraction utilities)

Progress: [██████████████████░░] 86% (6/7 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 111 min (1h 51m)
- Total execution time: 10h 54m

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Audio Foundation | 2/2 | 210 min | 105 min |
| 2. Waveform Visualization | 2/2 | 756 min | 378 min |
| 3. Live Performance | 1/2 | 4 min | 4 min |
| 3.5. YouTube Integration | 1/2 | 2 min | 2 min |

**Recent Trend:**
- Last 5 plans: 02-01 (750m), 02-02 (6m), 03-01 (4m), 3.5-01 (2m)
- Trend: Implementation tasks fast, checkpoint iterations add time

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
- **Wavesurfer.js visualization-only architecture (02-01)**: Volume 0, all audio from Phase 1 AudioBufferSourceNode. Preserves dual-playback capability for Phase 3.
- **Phase 1 currentTime as single source of truth (02-01)**: Unidirectional data flow - Phase 1 -> Waveform cursor position via setTime().
- **Explicit source node cleanup in seek() (02-01)**: Prevents AudioBufferSourceNode accumulation during rapid seeking.
- **Canvas overlay with pointer-events pass-through (02-02)**: ChopMarkerOverlay allows clicks through to waveform seek.
- **WCAG contrast for marker color (02-02)**: Automatic white/black selection based on waveform background color.
- **Chop markers deferred to v2 (02-02)**: User decision - visual feedback not required for v1 launch. Implementation complete and ready for future use.
- **GainNodes passed into createDualSources (03-01)**: Persistent GainNodes reused across play/stop/seek cycles; only AudioBufferSourceNodes are single-use.
- **masterGain volume isolation (03-01)**: User volume slider controls masterGain, crossfader controls mainGain/aheadGain independently.
- **useRef for activePositionRef (03-01)**: Prevents double-toggle bugs during rapid Shift key presses (useState batching causes stale reads).
- **cancelScheduledValues before gain init (03-01)**: Clears stale setTargetAtTime automation from previous crossfade toggles.
- **onEnded callback parameter (03-01)**: useDualPlayback signals end-of-file via callback, stored in ref for closure stability.
- **Live playback rate update (03-01)**: AudioBufferSourceNode.playbackRate is an AudioParam, updated directly without source recreation.
- **CORS proxy for Invidious API (3.5-01)**: Public Invidious instances lack CORS headers, CORS proxy required for both API calls and audio stream downloads.
- **Instance rotation for resilience (3.5-01)**: Three Invidious instances with sequential fallback, only fail if all instances fail.
- **YouTube URL parsing with URL constructor (3.5-01)**: Native URL parsing instead of regex, handles 5 URL formats (watch, youtu.be, embed, shorts, live).
- **Discriminated union loading states (3.5-01)**: YoutubeLoadState prevents impossible state combinations (loading + error).

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 1 architectural discipline (COMPLETE):**
- All Phase 1 constraints verified and maintained through Phase 3

**Phase 2 visualization discipline (COMPLETE):**
- All Phase 2 constraints verified and maintained through Phase 3

**Phase 3 dual-playback engine (Plan 01 COMPLETE):**
- Crossfader via GainNode with setTargetAtTime (15ms time constant) for click-free switching
- Perfect sync between main and ahead via shared AudioContext.currentTime start time
- useRef toggle state prevents double-toggle bugs during rapid key presses
- Seek preserves crossfader state via activePositionRef persistence
- Speed changes apply to both sources simultaneously via live AudioParam update
- Volume isolated via masterGain node (separate from crossfader gains)

**Phase 3 remaining (Plan 02):**
- Wire Shift key handler to toggleChop in App.tsx
- Add offset slider UI (0.1s-2.0s range, 0.1s step, 0.5s default)
- Reset to main position on new file load
- Guard chop key against non-playing states

**Research findings to apply:**
- mp3-mediarecorder 4.0.5 for MP3 export (Phase 4)

## Session Continuity

Last session: 2026-02-16
Stopped at: Completed 3.5-01-PLAN.md (YouTube extraction utilities)
Resume file: None

**Next:** Execute 3.5-02-PLAN.md to create YouTube input UI and integrate with audio player
