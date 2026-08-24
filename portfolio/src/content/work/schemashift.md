---
title: SchemaShift
tagline: Pre-commit impact analysis for schema changes.
description: 'A schema migration tool for catalogue data: see which categories, records and values a change will affect before committing it. 234 tests across 48 suites.'
order: 1
status: deployed-in-development
sourcePrivate: true
liveUrl: https://schema-shift.vercel.app/
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
captureBrief:
  - The schema tab on a deeply nested category, showing which fields are inherited from ancestors and which are declared locally.
  - The impact dialog mid-change, with a destructive row expanded so the values that will not survive are visible.
draft: false
---

## What it is

A schema migration tool for catalogue data. You change a data model against live
records and see the blast radius before you commit it: which categories are
affected, how many records, and which values will not survive the change. When
you apply it, it applies in a single transaction, with a version history you can
roll back.

## Why it exists

A product catalogue is a tree, and the tree is the point.

`Electronics` defines `brand` and `warranty_months`. `Laptops` inherits both and
adds `screen_size_in` and `gpu`. `Smartphones` inherits the same two and adds
`battery_mah` — and must never see a single Laptops field.

Template-based tools force one shared template per category. Under that model,
adding `gpu` for laptops pollutes every phone.

## The hard problem

Schema lives on the category node and composes down the tree. A child may add
fields, and may override an inherited field's label, requiredness, options,
default or position.

A child may **not** delete an inherited field, and may **not** change its type.
Those are precisely the two operations that silently invalidate data its
ancestors own, and no amount of interface polish makes them safe.

## The decisions

### The resolver is a plpgsql function, mirrored exactly in TypeScript

The database is the authority. The TypeScript copy exists so the editor can
preview a change with no round trip, which is what lets impact recompute on
every keystroke.

The two implementations must agree. The algorithm comment block is kept
identical in both files, because divergence would not surface as an error — it
would surface as an interface that lies about what is about to happen.

### Impact analysis runs on every keystroke, so it must never write

Proven, not asserted. The suite snapshots row counts and an MD5 of every record
before and after eighteen consecutive analyses, and asserts they are identical.

### Application is one plpgsql body, therefore one transaction

A partial schema migration is the worst available outcome — worse than a failed
one, because nobody knows what state the data is in. A test injects a
mid-transaction failure and proves that no partial state survives it.

### The audit trail is append-only by omission

`schema_versions` has SELECT and INSERT policies, and deliberately no UPDATE or
DELETE policy. Under row-level security, an operation with no matching policy is
denied. Rolling v5 back to v3 writes v6; v4 and v5 stay readable forever.

### Numeric comparison is guarded

`WHERE (data->>'price')::numeric > 500` does not fail on the rows it rejects. It
fails on rows it never meant to touch, the moment one item anywhere in the
catalogue holds `"call for pricing"` under a key spelled `price`. Every
comparison goes through `try_numeric()`, which yields NULL instead of aborting
the statement.

### Server Actions re-check the caller's role

A Server Action is a public POST endpoint. Row-level security guards the tables
underneath, but every mutation also checks the caller's role server-side.
Rendering a button conditionally is a user-interface affordance; it is not a
security boundary.

### Type changes are per-category, never global

A shared attribute's label can be edited everywhere at once. Its type cannot.
"This affects 9 categories and 1,400 items, good luck" is not a decision anyone
can actually make, so the tool does not offer it.

## What is deliberately not built

Listing this is part of the design, not an apology for it:

- Attribute-level validation rules
- Computed fields
- A public read-only catalogue view
- Scheduled exports
- Multi-tenant workspaces
- An approval workflow for schema changes

## What I would do differently

The resolver exists twice — once in plpgsql, once in TypeScript — and the only
thing holding them in step is an identical comment block and my own care. That
is the weakest part of the design. I would add a test that runs both against the
same fixtures and fails when they disagree, so a divergence is caught by the
suite rather than by a user watching the interface tell them something untrue.

I would also want to know where per-keystroke analysis stops being cheap. It is
proven correct against four seed datasets, including a 50-category, 5,000-item
stress fixture, but "correct" and "still fast on a catalogue ten times that size"
are different claims and I have only earned the first one.
