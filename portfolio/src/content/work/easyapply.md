---
title: EasyApply
tagline: Nine paper forms rebuilt as guided online applications, in three languages.
description: "Nine of Sri Lanka Telecom Mobitel's paper application forms rebuilt as guided, multi-step online forms, delivered in English, Sinhala and Tamil."
order: 4
status: in-production
employment: true
ownPublicDeployment: true
liveUrl: https://kavindu-rakn.github.io/Paperless/
githubUrl: https://github.com/kavindu-rakn/Paperless
techStack:
  - React
  - Vite
  - i18next
highlights:
  - Nine paper application forms converted to guided, multi-step online forms
  - New connection, re-connection, relocation, termination, transfer of ownership, package migration, service vacation, refund and general request
  - Complete interface delivered in English, Sinhala and Tamil
  - Access gated by phone-verified OTP rather than accounts, so the forms stay public
  - Status tracker so an applicant can check a submission without calling anyone
figures:
  - spec: One application form mid-flow, showing the step indicator and progress bar on a partially completed step. Every field must hold fictional values before this is published — no real customer data.
  - spec: The same step rendered in Sinhala and Tamil beside the English, showing the layout holding under all three scripts.
  - spec: A full form completed on a phone, as a silent 10-20 second recording, from OTP verification through to the status tracker. Fictional values only.
    viewport: mobile
draft: false
---

## What it is

Nine of Sri Lanka Telecom Mobitel's paper application forms, rebuilt as guided,
multi-step online forms: new connection, re-connection, relocation, termination,
transfer of ownership, package migration, service vacation, refund, and the
general customer request that covers everything else.

The brief arrived as nine PDFs — the same forms a customer picks up at a
teleshop, in the same layout. They are still in the repository, beside the
thing that replaced them.

Built solo, alongside TalentHub, during the same internship. The scope was the
frontend, and the frontend is what shipped.

## Why it exists

To apply for anything, you first had to get the form, and the form lived at a
teleshop. That is a trip across town before the application has even started, and it is
paid by the person least able to schedule it — the customer, during working
hours, in person.

Nine forms is also nine chances to fill something in wrongly and find out later.
A paper form cannot tell you that a field is required until someone reads it.

## The hard problem

Three languages through one layout, and the translation was not the hard part —
the proofreading was.

Sinhala and Tamil are not longer or shorter versions of the English. They are
different scripts, with different line-breaking, different label widths, and
different ideas about where a word can be split. A step that sits correctly in
English can push its own progress indicator onto a second line in Sinhala, and a
field label that fits on one line in Tamil can wrap in a way that separates it
from the input it belongs to.

Getting the wording itself right was slower than getting the layout right. A form
is a legal-ish document: a mistranslated field label on an ownership transfer is
not a cosmetic bug.

## The decisions

### Wizard steps with a progress bar

Nine long forms became sequences of short steps, with the position in the
sequence always visible. A paper form shows you its whole length at once, which
is honest but discouraging; a step sequence trades that for knowing how much is
left.

### OTP instead of a login

These pages have to be public. Someone applying for a new connection does not
have an account yet, and requiring them to create one to ask for one is a loop.

So there are no login pages. Access to each form is gated behind a one-time
password verified against a phone number — enough to establish that a real,
reachable person is filling the form, without standing up an account system, a
password reset flow, or a store of credentials for people who will use the site
once.

### A status tracker after submission

Submitting a form and hearing nothing is the paper experience with extra steps.
The tracker lets an applicant check where a submission has got to without
telephoning anyone, which is the part of the old process that cost the most time
on both sides of the counter.

## What I would do differently

Build the layout against Sinhala and Tamil first, and let English fall out of it.
A layout proven in English and then asked to hold two more scripts is a layout
being tested after it is finished — every script problem arrives as a defect in
something already built, which is the most expensive moment to find it. Starting
from the most demanding script means the layout is correct under the worst case
by construction, and English becomes the easy case rather than the reference one.

The second thing is a scope question rather than a code one. I built a status
tracker on top of data I did not own — the submission path was someone else's,
and a tracker is only as truthful as the states it is told about. That was the
right call for the brief, which was frontend only, but it is the piece I would
want next time: not because the frontend was insufficient, but because the
feature I was most pleased with is the one whose correctness I could not
guarantee.
