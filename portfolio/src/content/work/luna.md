---
title: Luna
tagline: Immersive celestial lunar ephemeris and 3D orbital explorer.
description: 'Real-time moon phase and orbital position with a 3D photographic lunar sphere, sub-second golden-section phase search, and a 24-hour continuous sky ephemeris curve.'
order: 7
status: live
liveUrl: https://kavindu-rakn.github.io/Luna/
githubUrl: https://github.com/kavindu-rakn/Luna
techStack:
  - React 19
  - Three.js
  - React Three Fiber
  - Drei
  - Vite
  - GSAP
  - SunCalc
  - WebGL
highlights:
  - 3D USGS albedo and relief sphere with 360-degree free drag, physics decay, and polar antialiasing
  - Sub-second deterministic quarter phase stepping via 28-step golden-section extremum search
  - Dynamic Sun-Earth-Moon 3D orbital alignment with true distance and telemetry readout
  - 24-hour continuous 48-point sky transit curve with sidereal and tropical zodiac tracking
  - Particle comet cursor with velocity-reactive plasma tail and difference-blending core
figures:
  - spec: The sky panel showing the moon at its real current phase, next to the draggable 3D moon.
  - spec: The moon mid-drag, with the comet cursor trail following it.
  - spec: The orbital data panel, showing illuminated fraction and phase angle as computed values rather than a chosen picture.
  - spec: The sky panel on a phone, showing the geolocation-aware panel on a real device.
    viewport: mobile
  - spec: The 3D moon on a phone, mid-drag.
    viewport: mobile
  - spec: The orbital data panel on a phone.
    viewport: mobile
draft: false
---

## What it is

An astronomical web application that visualises the Moon's phase cycles, 3D surface topography, orbital mechanics, and transit telemetry. Blending WebGL graphics with astronomical ephemeris algorithms, Luna replaces static clip-art approximations with true physical simulation.

## Why it exists

Almost every moon-phase widget on the web draws a static picture. It picks one of eight canned raster images based on a date and displays it.

Computing the celestial geometry in real time means the surface rendered on screen is derived directly from solar and lunar coordinates. It remains accurate at moments static diagrams fail — during rapid transitions between named quarter phases, and across observer latitudes where the lunar terminator angle tilts counter-intuitively relative to the horizon.

## The hard problems

### 1. Circular phase distance and New Moon discontinuities

Standard linear phase tracking suffers from abrupt seam discontinuities at the New Moon boundary, jumping from `0.999` to `0.001`. To calculate exact quarter phases (*New, First Quarter, Full, Last Quarter*) without branch instability, target phases are solved using a continuous circular cosine distance function:

$$D(t) = 1 - \cos\big(2\pi \cdot (\text{Phase}(t) - p_0)\big)$$

### 2. Sub-second phase resolution via golden-section search

Pinpointing the exact minute and second of an astronomical quarter phase across a 72-hour window is solved via golden-ratio interval contractions ($\phi = \frac{1 + \sqrt{5}}{2}$):

$$x_1 = a + (2 - \phi)(b - a), \quad x_2 = b - (2 - \phi)(b - a)$$

Iterating 28 contraction steps narrows a three-day bracket down to sub-second precision:

$$\Delta t = \frac{259{,}200\text{ s}}{\phi^{28}} \approx 0.34\text{ seconds}$$

This enables instantaneous, deterministic navigation across major quarters without network calls or ephemeris lookups.

## Key architecture decisions

### 3D photographic USGS sphere and polar antialiasing

The central lunar sphere maps high-resolution USGS albedo and relief topologies using Three.js and `@react-three/fiber`. Terminator shadow lines are calculated dynamically from the solar incident vector. Custom polar blending filters eliminate the pinhole starburst artifacts typical of spherical texture poles.

### Free-rotation physics and inertia decay

Rather than a static rotation lock, the sphere supports unconstrained 360-degree dragging with spherical angular momentum and spring decay powered by GSAP.

### Continuous 24-hour elevation curve

The sky ephemeris computes a 48-point transit path plotting the Sun and Moon through the local celestial hemisphere. Observer coordinates drive real-time elevation and azimuth curves alongside sidereal and tropical zodiac tracking.

### Velocity-reactive particle comet

Cursor interaction features a multi-stage particle trail scaling with pointer velocity, using WebGL difference blending to invert celestial elements beneath it for tactile physical feedback.

## Keyboard navigation

The application implements a dedicated keyboard flight deck:
- `Left` / `Right`: Step forward or backward by 1 solar day
- `Shift + Left` / `Shift + Right`: Jump directly to the exact minute of the adjacent quarter phase
- `T`: Snap immediately to real-time current date and time
- `D`: Toggle full astronomical telemetry drawer
