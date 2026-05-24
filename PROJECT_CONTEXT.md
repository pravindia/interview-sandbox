# Project Context

## Product

`LaunchFlow` is a fake internal tool for building funnel pages under parent offers.

It is not connected to any real business or real codebase.

## Core Product Rule

Pages must belong to exactly one offer.

The UI should not make generated pages feel like floating assets with no home.

## Current User Flow

1. Select an offer in the left sidebar.
2. See saved pages for that offer.
3. Enter a short page angle or hook note.
4. Generate a landing page draft.
5. Preview the generated HTML.
6. Save the page and reopen it later.

## Important Product Guardrails

- offer ownership is the source of truth for page grouping
- generated HTML should be previewable in-product
- saved pages should reopen reliably under the correct offer
- the member-facing outcome matters more than a clever internal abstraction
- rough AI output should still be turned into a usable deliverable shape

## Recent Shipped Behavior

- the app remembers the last selected offer in browser storage
- the app can load an existing saved page from the server
- the generation route is local and deterministic for this exercise
- the prototype shell already exists, but the end-to-end product slice is incomplete
- some prototype seams are intentional; part of the challenge is diagnosing and resolving them

## What This Exercise Tests

This exercise is intentionally shaped to test:
- scope control
- AI-assisted execution
- productization judgment
- review discipline
- integration
- verification

## Non-Goal

Do not turn this into a redesign, framework migration, or full funnel-builder rebuild.
