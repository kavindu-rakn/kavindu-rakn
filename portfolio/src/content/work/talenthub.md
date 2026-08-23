---
title: TalentHub
tagline: Internship platform in production at Sri Lanka Telecom Mobitel.
description: 'The platform Sri Lanka Telecom Mobitel runs its trainee programme on, built by twenty developers over a year. Largest contributor: 207 of 652 commits.'
order: 3
status: in-production
employment: true
techStack:
  - React 19
  - Node.js
  - Express 4
  - MongoDB
  - Mongoose
  - JWT
  - Google OAuth (Passport)
  - Tailwind CSS 4
  - Framer Motion
  - Vite
  - Google Gemini
highlights:
  - Largest contributor — 207 of 652 commits; the next highest is 94
  - 37 pull requests merged to main
  - Rebuilt the interface across 27 of 35 screens, trainee portal and admin console
  - AI logbook validation degrades instead of breaking when the Gemini API is unavailable
  - 96-seat reservation map with custom pan, zoom, touch support and auto-fit
  - Facial-recognition and QR attendance merged into a single interface
  - Compliance logic consolidated into a shared working-days and holiday module, imported by five controllers and four services
  - Seven animated seasonal login themes with a backend switch
captureBrief:
  - The 96-seat reservation map on a phone, mid pan-and-zoom. Every trainee name, face and identity number must be blurred or replaced before this is published.
  - A seasonal login theme — Vesak or Sinhala and Tamil New Year. Check with SLT what may be shown before publishing anything from this platform.
draft: false
---

## What it is

The platform Sri Lanka Telecom Mobitel runs its trainee programme on. In
production. Built by twenty developers over a year.

This is employment, not a personal repository. **There is no public link and I am
not going to invent one.** The technologies listed above are the parts I worked
in, not the whole platform's stack.

## Why it exists

A trainee programme at this size has to track things that do not survive in a
spreadsheet: daily logbooks that someone has to actually read, attendance taken
two different ways, seat allocation across a floor plan, and submission deadlines
that have to respect public holidays to mean anything.

TalentHub is where all of that lives.

## My position on it

Largest contributor: **207 of 652 commits**, and 37 pull requests merged to main.
The next highest contributor has 94. I rebuilt the interface across 27 of the 35
screens, covering both the trainee portal and the admin console.

## The hard problem

Most of the work was not any single feature. It was that a platform built by
twenty people over a year accumulates duplicate answers to the same question,
and duplicates diverge.

Working-day and holiday calculations existed in more than one place. So did the
definition of an overdue submission. Two different screens did the same
attendance job.

## The decisions

### AI logbook validation, built end to end

Local heuristic scoring runs first, and the Google Gemini API is only called when
the heuristics cannot settle it. Errors are handled fail-closed, with request
diagnostics. Inference is debounced off the typing path at 2.5 seconds.

The design point worth stating plainly: **the feature degrades instead of
breaking when the API is unavailable.** A trainee filling in a logbook does not
get a blocked form because a third-party service is having a bad afternoon.

I later migrated to a lighter model to stay inside the daily rate limit.

### Compliance logic consolidated into one module

Working-day and holiday calculations were duplicated. I moved them into a shared
module and standardised how overdue submissions are identified across the
backend, behind a verification script.

The module is imported by **five controllers and four services**. That is the
real number.

### The 96-seat reservation map

A custom pan-and-zoom hook, touch support and auto-fit scaling. The previous
implementation could not be operated on a phone, which matters when most of the
people using it are holding one.

### Two attendance interfaces merged into one

Facial recognition and QR scanning had separate screens doing the same job.
Consolidating them removed a duplicated code path and a second route through the
same task.

### Seven animated seasonal login themes

Vesak, Poson, Deepavali, Sinhala and Tamil New Year, Halloween and Christmas,
with a backend switch. Minor engineering. Genuinely liked, and specific to the
people who actually use the thing.

## What I would do differently

I chose the Gemini model before I checked the daily rate limit, and had to
migrate to a lighter one afterwards. The limit was published. Reading it first
would have cost ten minutes and saved the migration.

The compliance duplication had been there a while before I consolidated it, and I
had already added code near it more than once without noticing. I would now go
looking for the second copy of a rule before writing against the first.
