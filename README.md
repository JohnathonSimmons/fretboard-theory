# Fretboard Theory

A small PWA for learning music theory through the guitar neck. Built around one
question: **what do the numbers in a chord progression actually mean?**

## Tabs

**Explore** — an interactive neck. Pick a root, then view every note as an
interval from that root, as a note name, or as a scale degree. Tap any note to
hear it and get a plain-language readout of what it is.

**Chords** — the seven diatonic chords of a key, showing how stacking thirds
(1-3-5, or 1-3-5-7) on each scale degree produces a specific chord quality that
you don't choose — the key chooses it for you.

**Numbers** — roman numerals decoded. Pick a key and a common progression and
see the numerals turn into real chord names, with the shared logic spelled out.

**Train** — interval training. Two dots on the neck, name the distance, hear it
played back.

## Running locally

Static site, no build step:

```
python3 -m http.server 8000
```

## Deploying

Pushes to `main` deploy automatically via Vercel. No build configuration needed.

## Install on iOS

Open the deployed URL in Safari, tap Share, then Add to Home Screen.

## Known gaps

- The app icon is an SVG. iOS ignores SVG for home-screen icons, so a PNG
  `apple-touch-icon` should replace it.
- The chord view shows every instance of the chord tones on the neck rather than
  a single playable shape. Real fingerings are a good next addition.
- Major scale and its diatonic harmony only. Minor keys, modes, and CAGED are
  the obvious next modules.
