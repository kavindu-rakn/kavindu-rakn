---
title: EasyApply
tagline: Nine paper forms rebuilt as guided online applications, in three languages.
description: "Nine of Sri Lanka Telecom Mobitel's paper application forms rebuilt as guided, multi-step online forms, delivered in English, Sinhala and Tamil."
order: 8
status: in-production
employment: true
techStack:
  - React
  - Vite
  - i18next
highlights:
  - Solo build — nine paper application forms converted to guided, multi-step online forms
  - Covers new connections, relocations, ownership transfers, refunds and service changes
  - Complete interface delivered in English, Sinhala and Tamil
figures:
  - spec: One application form mid-flow, showing the step indicator and a partially completed step. Every field must hold fictional values before this is published — no real customer data.
  - spec: The same form in Sinhala and Tamil beside the English, showing the layout holding under all three scripts.
draft: true
---

<!--
  DRAFT — not rendered, no route generated, absent from the grid and sitemap.

  Everything above this line is verified against the résumé. Everything below
  needs Kavindu, because the résumé carries two bullets on EasyApply and the
  remaining sections cannot be written from them without inventing engineering
  that may not have happened.

  To finish it:
    1. Fill "Why it exists", "The hard problem", "The decisions" and "What I
       would do differently" — the same five-part structure as the other six.
    2. Confirm `status`. `in-production` is inferred from "delivered ... for
       company-wide accessibility" and has not been confirmed.
    3. Set `draft: false`.

  Flipping draft to false makes this the seventh entry, which requires two
  changes that are deliberately NOT made yet:
    - The index grid: the About aside exists to fill the cell six cards leave
      empty, so a seventh leaves a hole. It needs to span both columns.
    - src/data/schema-tree.ts: the hero tree has six hand-placed leaves and
      would silently omit this one. That geometry is being replaced in the
      raymarched hero, so it is not worth re-laying-out twice.
-->

## What it is

Nine of Sri Lanka Telecom Mobitel's paper application forms, rebuilt as guided,
multi-step online forms: new connections, relocations, ownership transfers,
refunds and service changes.

Built solo, alongside TalentHub, during the same internship.

This is employment, not a personal repository. **There is no public link and I am
not going to invent one.**

The complete interface ships in English, Sinhala and Tamil.

## Why it exists

_To write: what the paper process cost, and who was carrying that cost — the
applicant, the counter staff, or whoever had to transcribe the forms afterwards._

## The hard problem

_To write. Trilingual delivery is the obvious candidate: Sinhala and Tamil are
not simply longer or shorter strings, they are different scripts with different
line-breaking and different label widths, and a form layout that holds in English
does not automatically hold in either. If that was the hard part, say so and say
what broke first._

## The decisions

_To write, as `###` sub-decisions, matching the other six studies._

## What I would do differently

_To write. The other six all carry this section and it is the most persuasive
thing on each of them._
