---
title: Luna
tagline: Real-time moon phase, orbital position and sky panel.
description: 'Real-time moon phase and orbital position with a geolocation-aware sky panel, a draggable 3D moon, and custom lunar mathematics.'
order: 7
status: live
githubUrl: https://github.com/kavindu-rakn/Luna
techStack:
  - React
  - Three.js (r3f)
  - GSAP
  - suncalc
  - GitHub Actions
highlights:
  - Real-time moon phase, orbital position and geolocation-aware sky panel
  - Draggable 3D moon, custom lunar mathematics, comet cursor trail
figures:
  - spec: The sky panel showing the moon at its real current phase, next to the draggable 3D moon.
  - spec: The 3D moon being dragged, with the comet cursor trail following, as a silent 10-20 second recording.
  - spec: The sky panel on a phone, as a silent 10-20 second recording, showing the geolocation-aware panel on a real device.
    viewport: mobile
draft: false
---

## What it is

The moon, as it actually is right now. Real phase, real orbital position, and a
sky panel that adjusts to where you are. The moon itself is a draggable 3D
object rather than an image of one.

## Why it exists

Almost every moon-phase widget draws a picture. It picks one of eight images
based on a date and shows it.

Computing the position instead means the thing on screen is derived from the same
mathematics the sky is, and it is right at times a picture would be wrong —
during the transitions between named phases, and at latitudes where the
terminator does not sit the way the illustration assumes.

## The hard problem

Lunar position is genuinely fiddly. The moon's illuminated fraction, its phase
angle and its apparent orientation in the sky are three different questions, and
the last one depends on where the observer is standing.

## The decisions

### Compute the phase, do not select an image

The renderer takes an illuminated fraction and a phase angle and lights the
sphere accordingly, so every intermediate state exists rather than the eight
named ones.

### The sky panel is geolocation-aware

Orientation depends on the observer. A moon drawn the same way in Colombo and in
Reykjavík is wrong in at least one of them.

### Direct manipulation

The moon is draggable. If the point is that this is a real object in a real
position, it should behave like one.

## What I would do differently

There are two sources of truth for the same sky. I wrote custom lunar
mathematics, and the project also depends on `suncalc`, which computes much of
the same thing. Right now they coexist, which means either could drift and
nothing would catch it.

I would pick one as the authority and turn the other into a test of it —
comparing both across a year of dates, and failing when they disagree beyond a
tolerance. That converts a redundancy into a guarantee.
