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
  - spec: The scroll disassembly on a phone, as a silent 10-20 second recording, showing the movement holding its frame rate on a touch device.
    viewport: mobile
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

It was built to find a ceiling rather than to hit a budget, and the result shows
it: fourteen procedurally generated components, live PBR materials and
synthesised audio are not the choices you make when a device budget is the
constraint. Before calling it finished I would want to know what it actually
costs on a mid-range Android, because that is the machine most of the people I
would show it to are holding.

No brief also meant no definition of done. That is survivable on something nobody
is waiting for, and a bad habit to carry into work that someone is expecting —
deciding what finished means belongs at the start, not at the point you notice
you have stopped.
