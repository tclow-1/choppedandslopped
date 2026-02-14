# ChoppedApp

## What This Is

A browser-based DJ Screw-style audio manipulation tool that lets users chop and screw YouTube audio with live looping, variable speed control, and BPM-based chopping.

**Core value:** Enable anyone to create chopped and screwed remixes in their browser by pasting a YouTube URL, using keyboard shortcuts to trigger live loops while adjusting playback speed, and recording their performance as an MP3.

## Why This Exists

DJ Screw pioneered a distinctive sound - slowed-down tracks with strategic repetition of key moments. This technique requires specific tools and workflow. Existing solutions either require desktop DAWs (high barrier to entry) or lack the live, performative aspect of chopping. This app makes the technique accessible to anyone with a browser.

## Who This Is For

**Primary users:**
- Music enthusiasts who want to create chopped and screwed versions of songs
- People familiar with DJ Screw's style who want a quick, accessible tool
- Bedroom producers experimenting with tempo and repetition

**Not for:**
- Professional DJs needing full DAW features
- Users wanting complex multi-track arrangements
- Mobile users (desktop-only for v1)

## Key Constraints

### Technical
- **Pure client-side architecture** - everything runs in browser, no backend server
- **Desktop browser target** - optimized for mouse/keyboard, not mobile
- **YouTube as audio source** - no file uploads, only YouTube URLs

### Scope
- **MVP focus** - core features working, polish comes later
- **One-shot sessions** - no project saving/loading in v1
- **Speed range:** 50% to 100% (half speed to normal)
- **Output format:** MP3 only

### Non-negotiable
- Speed control via slider must feel smooth and responsive
- BPM detection must be accurate enough for beat-aligned chopping
- Live recording must capture the performance as played

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can paste YouTube URL and load audio
- [ ] User can adjust playback speed from 50% to 100% via slider
- [ ] App auto-detects BPM and displays it
- [ ] User can manually adjust BPM if auto-detection is wrong
- [ ] App suggests choppable sections based on detected beats
- [ ] User can manually mark loop start/end points
- [ ] User can trigger loops via keyboard shortcuts during playback
- [ ] User can start/stop recording their live performance
- [ ] User can download recorded performance as MP3
- [ ] Playback controls (play/pause/stop) work reliably
- [ ] Waveform visualization shows audio structure

### Out of Scope

- **Project save/load** — v1 is one-shot sessions
- **Mobile support** — desktop browsers only
- **Timeline editing** — live performance only, no arranging after
- **File uploads** — YouTube URLs only
- **Multiple simultaneous loops** — one loop region at a time
- **WAV export** — MP3 only for v1
- **User accounts** — no authentication needed
- **Backend processing** — everything client-side

## Success Criteria

**Must have:**
- User can load a YouTube song, slow it down, and hear the classic chopped & screwed sound
- User can trigger repeating loops of beat-aligned sections using keyboard
- User can record their live chopping session and download it

**Should have:**
- BPM detection works accurately for most hip-hop/rap tracks (target genre)
- Waveform visualization helps user see song structure
- Interface is intuitive enough to start chopping within 30 seconds

**Won't have in v1:**
- Complex project management
- Mobile-optimized experience
- Professional-grade audio export options

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Pure client-side architecture | Simplifies deployment, no server costs, instant access | Pending — may impact audio processing capabilities |
| YouTube-only audio source | Removes need for file upload/storage, massive catalog | Pending — requires YouTube audio extraction approach |
| Desktop-only | Keyboard shortcuts are core to DJ workflow, complex UI | Pending — mobile deferred to future versions |
| Live performance recording | Captures the performative aspect of DJ Screw's technique | Pending — more authentic than timeline editing |
| No project saving | Reduces complexity for MVP, focuses on core loop | Pending — may limit experimentation |

## Open Questions

- How do we extract audio from YouTube in the browser legally/technically?
- What Web Audio API features do we need for pitch-preserving speed changes?
- How accurate does BPM detection need to be? Is manual override sufficient?
- What's the latency tolerance for keyboard-triggered loops to feel responsive?

## Technical Notes

- **Web Audio API** will handle playback, speed control, recording
- **BPM detection** likely needs FFT analysis or existing JS library
- **Waveform visualization** can use Canvas API or existing component
- **YouTube audio extraction** needs investigation for browser-based approach

---
*Last updated: 2026-02-13 after initialization*
