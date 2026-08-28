# simple-todo-app

A deliberately small todo API. No dependencies: it runs on the Node standard
library, so `git clone && npm test` works with no install step.

```bash
npm start     # http://localhost:3000
npm test      # node --test
```

## Why this repository exists

It is the review target for an [Enterprise Multi-Agent Code Review
Orchestrator](https://github.com/) built on the Claude Agent SDK. The pull
requests against it are written to have distinct, known profiles — one clean and
tested, one correct but written in dated idioms with no tests, one carrying
deliberate security defects — so the reviewer's output can be checked against
what is actually there rather than only read for plausibility.

**The security defects in PR #3 are intentional and are not merged.** Do not
copy that code.

## API

| Method | Path | Body | Notes |
|---|---|---|---|
| `GET` | `/todos` | — | Todos for the caller |
| `POST` | `/todos` | `{ "title": "..." }` | Creates one |
| `PATCH` | `/todos/:id` | `{ "done": true }` | Marks done/undone |
| `DELETE` | `/todos/:id` | — | Removes one |

The caller is identified by an `X-User` header, defaulting to `anonymous`.
