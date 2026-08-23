---
title: Hotel Tamarind Tree
tagline: Booking platform for a boutique hotel near Yala National Park.
description: 'A booking platform for a 4-star boutique hotel in Tissamaharama, built solo in five planned phases from a written specification.'
order: 2
status: deployed-in-development
sourcePrivate: true
liveUrlPlaceholder: LIVE_URL_TAMARIND
techStack:
  - Next.js 16
  - TypeScript
  - Prisma
  - PostgreSQL (Neon)
  - Auth.js v5
  - Resend
  - Vercel
highlights:
  - 11-model Prisma schema; rooms, units, rate plans, bookings, blocked dates, inquiries
  - Availability API prevents overlapping reservations; randomised unit allocation
  - Nightly Vercel cron expires abandoned bookings back to inventory
  - Admin dashboard for bookings, rooms and enquiries; Auth.js v5 with bcrypt
  - Stripe integration built, then removed — the property takes payment on arrival
captureBrief:
  - The booking flow on a phone, from date selection through to confirmation, showing that an already-taken unit cannot be selected.
  - The admin dashboard listing bookings, with a pending booking visible before the nightly job expires it.
draft: false
---

## What it is

A booking platform for a 4-star boutique hotel in Tissamaharama, at the gateway
to Yala National Park. Built solo, in five planned phases, from a written
specification.

Staff manage bookings without touching a database. Guests cannot double-book a
room. Abandoned bookings release themselves overnight.

## Why it exists

A property with several room types and a finite number of physical units has one
question it has to answer correctly every single time: what is actually free for
these dates. Get it wrong once and two guests arrive for the same room.

The platform answers that question directly to the guest, and gives staff a way
to manage rooms, rates and enquiries without anyone touching a database.

## Where it actually stands

It is deployed to Vercel and in active development. **It has not been presented
to the owner and has not been paid for.** It is not client work and I am not
going to describe it as such.

It was built for a real property, against a real specification, which is the part
that makes it worth reading about.

## The hard problem

Preventing overlapping reservations is the hard part of any booking system, and
it is harder than it looks because the question is not "is this room free" but
"is this room free for every night in this range, given everything else that is
half-committed right now".

Availability is checked against real records rather than a cached flag, and units
are allocated at random among those actually free for the whole range.

## The decisions

### A nightly cron expires pending bookings

Without it, an abandoned checkout holds a room indefinitely and the hotel
silently loses inventory it could have sold. `vercel.json`, `0 3 * * *`.

This is the sort of thing that never appears in a specification and is obvious
the first time someone closes the tab at the payment step.

### Eleven models, because the domain has eleven things in it

Room types, units, images, amenities, rate plans, guests, bookings, blocked
dates, admin users and inquiries. A room type is not a room; a bookable unit is
not a rate plan. Collapsing any of those would have been faster to build and
wrong within a month.

### Stripe was built, then deleted

I completed a working payment integration. Then I looked at how the property
actually operates: it takes payment on arrival.

A gateway would have added a transaction fee and one more thing that can fail
between a guest and a confirmed room, in exchange for solving a problem the
property does not have. So I removed it.

Deleting finished work is not free, and I would rather show that decision than
ship the integration to justify having written it.

### Auth.js v5 with bcrypt, and a seeded first admin

The staff dashboard needs one working account before anyone can create a second.

### iOS WebKit fixes are in the commit history

Because I tested on a real device rather than assuming desktop Chrome was the
world.

## What I would do differently

I would have asked what the property does about payment **before** building the
Stripe integration rather than after. The decision to remove it was right; the
week that produced it was avoidable, and the answer was one question away.

Random allocation among free units is fine and keeps things simple, but it makes
a reported problem harder to reproduce — "guest was given unit 4" is not
something I can replay deterministically. If this went into daily use I would
either make allocation deterministic or record the choice explicitly alongside
the booking.
