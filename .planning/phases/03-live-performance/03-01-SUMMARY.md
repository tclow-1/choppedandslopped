---
phase: 03-live-performance
plan: 01
subsystem: audio
tags: [web-audio-api, dual-playback, crossfader, gainnode, audiobuffersourcenode, react-hooks]

# Dependency graph
requires:
  - phase: 01-audio-foundation
    provides: "Singleton AudioContext, AudioBufferSourceNode playback, createSourceNode factory, audio types"
  - phase: 02-visualization
    provides: "Waveform visualization with cursor sync via Phase 1 currentTime"
provides:
  - "useDualPlayback hook with startDual/stopDual/togglePosition/seekDual/updatePlaybackRate/setOffset"
  - "createDualSources factory for synchronized dual AudioBufferSourceNode creation"
  - "DualSources and ActivePosition type definitions"
  - "useAudioPlayer refactored to delegate all audio to dual-playback engine"
  - "toggleChop/setChopOffset/chopOffset/isDualActive exposed on AudioPlayerControls"
affects: [03-02-PLAN, 04-recording]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GainNode crossfader with setTargetAtTime (15ms time constant) for click-free switching"
    - "useRef for rapid toggle state (prevents double-toggle bugs from useState batching)"
    - "Synchronized dual source start via shared AudioContext.currentTime"
    - "Persistent GainNodes with single-use AudioBufferSourceNodes"
    - "masterGain volume isolation from crossfader gain control"
    - "stopTrackingRef pattern for circular dependency avoidance in hooks"

key-files:
  created:
    - src/hooks/useDualPlayback.ts
  modified:
    - src/utils/audioNodes.ts
    - src/types/audio.ts
    - src/hooks/useAudioPlayer.ts

key-decisions:
  - "GainNodes passed into createDualSources (persistent, reused), only source nodes are single-use"
  - "masterGain node for volume isolation -- user volume slider controls masterGain, crossfader controls mainGain/aheadGain independently"
  - "useRef for activePositionRef prevents double-toggle bugs during rapid Shift key presses"
  - "cancelScheduledValues before setting initial gains on startDual to clear stale automation"
  - "stopTrackingRef pattern to resolve circular dependency between handleDualEnded and stopPositionTracking"
  - "onEnded callback passed as parameter to useDualPlayback for end-of-file signaling"
  - "setPlaybackRate updates sources live via AudioParam (no source recreation needed)"

patterns-established:
  - "Dual-source factory: createDualSources creates paired AudioBufferSourceNodes connected to passed-in GainNodes"
  - "Crossfader toggle: useRef read/write + setTargetAtTime(value, now, 0.015) for synchronous state + click-free audio"
  - "Hook delegation: useAudioPlayer delegates audio output to useDualPlayback while preserving public API"

# Metrics
duration: 4min
completed: 2026-02-15
---

# Phase 3 Plan 01: Dual-Playback Audio Engine Summary

**Dual AudioBufferSourceNode engine with GainNode crossfader, 15ms click-free switching, and useRef toggle state for DJ Screw chopping**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-16T00:37:12Z
- **Completed:** 2026-02-16T00:41:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Dual AudioBufferSourceNode architecture (main + ahead positions) with synchronized start times
- GainNode-based crossfader with setTargetAtTime (15ms) for click-free instant switching
- Complete refactor of useAudioPlayer to delegate all audio through useDualPlayback while preserving zero-breaking-change public API
- masterGain volume isolation so user volume slider and crossfader operate independently

## Task Commits

Each task was committed atomically:

1. **Task 1: Create dual-source factory and type definitions** - `b166cbb` (feat)
2. **Task 2: Create useDualPlayback hook** - `708dc2e` (feat)
3. **Task 3: Refactor useAudioPlayer to delegate to useDualPlayback** - `f0f5ba9` (feat)

## Files Created/Modified
- `src/types/audio.ts` - Added DualSources interface, ActivePosition type, and dual playback controls to AudioPlayerControls
- `src/utils/audioNodes.ts` - Added createDualSources factory alongside existing createSourceNode
- `src/hooks/useDualPlayback.ts` - Core dual-playback engine hook (254 lines) with crossfader, offset management, volume isolation
- `src/hooks/useAudioPlayer.ts` - Refactored to delegate all audio to useDualPlayback, removed single source/GainNode, exposed dual controls

## Decisions Made
- **GainNodes passed in, not created inside factory**: Persistent GainNodes are created once and reused; only AudioBufferSourceNodes are single-use (per plan specification).
- **masterGain for volume isolation**: mainGain and aheadGain connect to masterGain (which connects to destination). Volume slider controls masterGain, crossfader controls mainGain/aheadGain. This keeps the two concerns independent.
- **cancelScheduledValues before gain initialization**: When startDual sets initial gain values, it first calls cancelScheduledValues to clear any pending automation from previous crossfade toggles. Prevents stale setTargetAtTime automation from conflicting with new gain values.
- **stopTrackingRef pattern**: handleDualEnded needs to call stopPositionTracking, but is defined before it (hook ordering). Solved with a ref that's kept in sync, avoiding the circular dependency.
- **onEnded as callback parameter**: useDualPlayback accepts an onEnded callback (stored in ref to avoid stale closures) that fires on main source's natural end-of-file, allowing useAudioPlayer to reset state.
- **Live playback rate update**: setPlaybackRate updates AudioBufferSourceNode.playbackRate.value directly (it's an AudioParam), avoiding source recreation on speed changes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed circular dependency between handleDualEnded and stopPositionTracking**
- **Found during:** Task 3 (Refactor useAudioPlayer)
- **Issue:** handleDualEnded was defined before stopPositionTracking in hook order, causing a stale closure where stopPositionTracking would be undefined when called
- **Fix:** Introduced stopTrackingRef that is kept in sync with stopPositionTracking on each render, and handleDualEnded calls stopTrackingRef.current() instead
- **Files modified:** src/hooks/useAudioPlayer.ts
- **Verification:** TypeScript compiles, build succeeds
- **Committed in:** f0f5ba9 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for correct operation. No scope creep.

## Issues Encountered
None beyond the auto-fixed circular dependency.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dual-playback engine complete and ready for UI wiring in 03-02-PLAN
- toggleChop, setChopOffset, chopOffset, isDualActive exposed on useAudioPlayer return
- All existing Phase 1/2 functionality preserved (zero regressions confirmed via TypeScript + Vite build)
- Shift key handler, offset slider UI, and state reset on file load will be implemented in 03-02-PLAN

## Self-Check: PASSED

---
*Phase: 03-live-performance*
*Completed: 2026-02-15*
