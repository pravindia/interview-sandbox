# Candidate Prompt

You are working inside a fake sandbox product called `LaunchFlow`.

This is not a real company codebase.

This is a live AI productization challenge, not a theory interview and not a simple bug hunt.

Your task is to ship the smallest safe slice that turns a rough AI prototype into a working member-facing product path.

This sandbox intentionally contains rough prototype seams.

Do not assume the frontend, backend, and contracts are already perfectly aligned.

## How The Product Is Supposed To Work

In the correct version of this product:

- the user selects one offer
- the app shows saved pages that belong to that offer
- the user can enter a short page angle or hook note
- the user can generate a landing page draft
- the app previews usable HTML output
- the user can save that page
- the user can reopen it later and see the same HTML again

You should treat that behavior as the intended source of truth for this exercise.

## Primary Build Slice

Take the current prototype shell and make this exact path work end to end:

- select an offer
- generate a landing page
- preview the HTML
- save it
- reopen it later

You are not being asked to integrate a real AI API.

The server already contains a deterministic local generator stub for this exercise.

Your job is to make the product slice around it actually work.

Read `OUTPUT_QUALITY_TARGET.md` before you start.

You should assume the live session is time-boxed.

Prioritize the narrowest member-facing path that proves you can take a rough prototype and land something coherent.

## Optional Stronger Outcome

If you finish the main slice cleanly, add one extra product-safe improvement:

- copy or export the HTML
- warn before replacing unsaved generated output
- one other narrow polish improvement you can defend

## Definition Of Done

Minimum successful outcome:

- selecting an offer scopes the saved pages correctly
- generate produces a visible landing page draft in the preview
- save persists that generated page under the selected offer
- reopening the saved page restores the saved HTML
- the change stays narrow

Strong successful outcome:

- the main vertical slice works cleanly
- one additional safeguard or export path is added
- the candidate shows clear AI orchestration judgment
- the generated page meets the quality bar well enough for founder review
- the candidate explains what they verified and what still remains rough

## End-Of-Session Audit

Be ready to show or explain:

- the exact path that now works
- what you kept on the critical path for yourself
- what you delegated to AI or parallel agents
- what AI output you rejected or rewrote
- how you judged the generated HTML quality
- what you verified directly
- what you would do next with one more day

## What We Care About Most

We are explicitly testing AI-assisted execution ability.

That means we care about:

- how you break the work down
- how you use AI or parallel agents
- how you review and reject weak AI output
- how you integrate the final result into a coherent slice
- how you verify the outcome
- how you judge whether the generated HTML is actually usable

We do not care about raw token volume or how many agent windows you can open.

We care about whether you can use AI as real leverage.

## Constraints

- use any AI tools or agents you want
- stay inside this repo only
- prefer a working vertical slice over a broad rewrite
- preserve the documented contracts unless a small change is clearly necessary
- verify the exact path you changed before calling it done
- explain assumptions instead of fishing for hidden product context
- choose a reasonable path when product tension exists and explain the tradeoff

## Important Framing

This challenge is intentionally shaped to test whether you can take an incomplete AI product prototype and move it toward a production-shaped slice quickly.

The strongest outcomes usually come from:

- narrowing scope early
- splitting work cleanly
- keeping quality judgment for yourself
- integrating continuously
- verifying before claiming success
