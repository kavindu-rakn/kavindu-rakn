---
title: SchemaShift
tagline: Pre-commit impact analysis for schema changes.
description: 'A schema migration tool for catalogue data: see which categories, records and values a change will affect before committing it. 234 tests across 48 suites.'
order: 1
status: deployed-in-development
sourcePrivate: true
liveUrlPlaceholder: LIVE_URL_SCHEMASHIFT
techStack:
  - Next.js 16
  - React 19
  - TypeScript
  - Supabase
  - PostgreSQL
  - Tailwind 4
highlights:
  - 'Blast radius before commit: categories affected, records affected, values that will not survive'
  - plpgsql resolver mirrored in TypeScript — impact recomputed per keystroke, no round trip
  - Analysis proven read-only under test; migrations proven atomic under injected failure
  - Append-only audit trail via omitted UPDATE/DELETE RLS policies
  - 234 tests across 48 suites, 9 ordered migrations, 11 SQL test suites
draft: false
---

<!--
  PHASE 4 fills this body with the required structure:
  what it is → why it exists → the hard problem → the decisions → what I would
  do differently.

  Frontmatter above is final and verified against CONTEXT §4. The techStack
  order is the one the context file specifies and must not be alphabetised.
-->

Case study body is written in Phase 4.
