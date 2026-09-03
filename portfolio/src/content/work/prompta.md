---
title: Prompta
tagline: Vault for AI prompts.
description: 'A vault for AI prompts: folders, encrypted attachments, user-to-user delivery by email, and one-click launch into five different LLM providers.'
order: 6
status: live
githubUrl: https://github.com/kavindu-rakn/Prompta
techStack:
  - Next.js
  - React
  - TypeScript
  - Supabase
  - Framer Motion
highlights:
  - Folders, encrypted attachments, user-to-user delivery by email
  - One-click launch into ChatGPT, Claude, Gemini, DeepSeek and Grok
  - Framer Motion `layoutId` card-to-fullscreen morphs
  - Plain CSS, no utility framework; left-aligned scrollbar via an RTL trick
figures:
  - spec: The card-to-fullscreen morph as a short loop, showing the shared element travelling rather than cross-fading.
  - spec: A folder containing an encrypted attachment, and the one-click launch menu open.
  - spec: The card-to-fullscreen morph on a phone, as a silent 10-20 second recording.
    viewport: mobile
draft: false
---

## What it is

A vault for AI prompts. Folders, encrypted attachments, and delivery of a prompt
from one user to another by email. From any saved prompt you can launch straight
into ChatGPT, Claude, Gemini, DeepSeek or Grok in one click.

## Why it exists

Prompts that are worth keeping end up in notes apps, chat scrollback and text
files, which means they are found by remembering where you put them. A prompt is
a small reusable artefact, and it deserves the same treatment as any other one:
somewhere to live, a way to organise it, and a way to hand it to someone else.

## The hard problem

The one genuinely awkward part is that a prompt is not only text. It carries
attachments, and those attachments may be private, so they are encrypted — while
still being deliverable to another user who has to be able to open them.

## The decisions

### Shared-element morphs, not modals

Framer Motion's `layoutId` moves the actual card into its fullscreen state, so
the thing you clicked is the thing you are now reading. A modal that fades in
over a grid loses the connection between the two.

### Plain CSS, no utility framework

A deliberate constraint, taken to see what the tradeoff actually feels like from
the inside rather than reading about it.

### A left-aligned scrollbar via an RTL trick

Setting `direction: rtl` on the container moves the scrollbar to the left. It is
the only way to do it in CSS today.

## What I would do differently

The RTL trick works, and it costs more than it looks. Flipping direction inverts
text direction for everything inside the container, so every child has to be
flipped back one by one, and each new child is a chance to forget. For a purely
cosmetic gain, that is a bad trade and I would not take it again.

Plain CSS with no utility framework was a deliberate constraint, and a fair one
on a project this size built alone. It scales badly in one specific way: nothing
holds the shared vocabulary for spacing, colour and type, so every new surface
re-decides them and consistency rests on memory rather than on the system. On
anything I expected other people to work in, I would want the system holding
those decisions instead.
