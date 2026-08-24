---
title: Horologia
tagline: Exploded 3D mechanical watch movement, disassembles on scroll.
description: 'A procedurally generated mechanical watch movement in the browser: fourteen components, a raycasting materials inspector, and synthesised ticking at 28,800 vph.'
order: 4
status: live
liveUrl: https://horologia-kvn.web.app/
githubUrl: https://github.com/kavindu-rakn/Horologia
techStack:
  - Three.js
  - GSAP ScrollTrigger
  - Lenis
  - Web Audio API
  - Firebase
  - Vite
highlights:
  - 14 procedural components — gear train, escapement, balance wheel, tourbillon, 27 ruby jewels
  - Raycasting inspector giving material hardness, friction coefficient and horological function per part
  - Synthesised Web Audio ticking at 28,800 vph with alternating pallet clicks
  - Live PBR material lab with 5 presets; Firestore gallery with a LocalStorage fallback
figures:
  - spec: A silent, autoplaying 10–20 second loop of the movement disassembling on scroll. This case study should be mostly video.
  - spec: The raycasting inspector open on one component, showing its material hardness, friction coefficient and horological function.
draft: false
---

## What it is

A mechanical watch movement, generated procedurally in the browser, that takes
itself apart as you scroll.

Fourteen components: a five-stage gear train with real teeth, an escapement with
pallet jewels, a Glucydur balance wheel with a Breguet hairspring, a tourbillon
cage, 27 ruby jewels and an automatic rotor. None of it is a downloaded model.

## Why it exists

No client. No brief. No deadline.

It is an exercise in finding the ceiling of what a browser can do, and I would
rather say that plainly than invent a business case for it after the fact.

## The hard problem

A watch movement is not decorative geometry — it is a mechanism where every part
exists because of the part next to it. Generating it procedurally means encoding
the relationships, not just the shapes: tooth counts that mesh, an escapement
that actually gates the gear train, a balance that sets the rate.

Getting it to *look* right is modelling. Getting it to be internally consistent
is the interesting part.

## The decisions

### A raycasting inspector, not labels

Point at any component and it reports material hardness, friction coefficient and
horological function. The information belongs to the part, so it is retrieved by
pointing at the part.

### The ticking is synthesised, not sampled

Web Audio at 28,800 vibrations per hour, with alternating pallet clicks, because
a real escapement does not tick symmetrically. A sample loop would have been
faster and would have sounded like a loop.

### A live PBR material lab with five presets

The same geometry under different materials, changeable while it runs.

### A Firestore gallery with a LocalStorage fallback

Saved configurations sync when Firebase is reachable and persist locally when it
is not, so the piece works end to end with no network at all.

## What I would do differently

It has no performance budget. I built it to find the ceiling, which meant I never
asked what it costs on a mid-range Android — and mid-range Android is what most
of the people I know are holding. I would now set that budget at the start and
let it constrain the geometry, rather than measuring afterwards and hoping.

No brief also meant no definition of done. Fourteen components is where I
stopped, not a number I chose. That was fine here because nobody was waiting for
it; it would not have been fine anywhere else.
