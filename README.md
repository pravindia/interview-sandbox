# LaunchFlow Candidate Sandbox

This repo is a self-contained hiring sandbox.

It is intentionally small and intentionally fake.

It is designed to simulate one medium-hard AI productization slice without exposing any real company IP.

## Read This First

1. `CANDIDATE_PROMPT.md`
2. `PROJECT_CONTEXT.md`
3. `DATA_CONTRACTS.md`
4. `OUTPUT_QUALITY_TARGET.md`
5. `PRODUCT_TENSION.md`

## Challenge Goal

Ship the smallest safe vertical slice that addresses the prompt.

Use any AI tools or agents you want.

## Rules

- stay inside this repo only
- prefer narrow fixes over broad rewrites
- keep the documented contracts stable unless a small change is essential
- verify the exact path you changed before calling it done

## Deliverables

By the end of the session be ready to explain:
- what you changed
- why the output is good enough for a member-facing draft
- what you delegated to AI
- what you rejected from AI
- what you verified
- what you would do next with one more day

## Local Run

Requirements:
- Node 18+

Commands:

```bash
npm install
npm start
```

Then open:

`http://localhost:4173`

There are no external services and no real AI providers in this sandbox.

The generation route is a local deterministic stub on purpose. The challenge is to productize the slice around it, not to spend the session wiring a real API key.
