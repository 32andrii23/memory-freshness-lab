# memory-freshness-lab

A temporal evaluation harness for the failure mode “the agent remembered a fact that used to be true.”

> Status: early working scaffold. Timeline resolution, freshness metrics, CLI, synthetic dataset, tests, and CI are implemented. Model and memory-store adapters are roadmap work.

## Problem

Cross-session memory demos usually reward recall. Production systems also need forgetting, supersession, provenance, and time-aware retrieval. A memory can be relevant and semantically similar while being dangerously stale.

`memory-freshness-lab` evaluates returned fact IDs against a versioned timeline at a specific observation time.

## Audience

- Engineers building persistent assistants or long-running agents
- Teams evaluating RAG and agent-memory stores
- Researchers who need a small, inspectable temporal benchmark primitive

## Differentiator

This project does not rank embedding quality or conversational style. It isolates temporal correctness with deterministic metrics: freshness precision/recall, stale leakage, unknown facts, and provenance coverage. It can run without an API key or model call.

## Quick start

```bash
npm install
npm run demo
```

The sample intentionally returns an expired plan after an upgrade so the report exposes a non-zero stale-leak rate.

## Data model

Each fact is a version with a validity interval and optional source:

```json
{
  "id": "account-plan-pro-v2",
  "key": "account.plan",
  "value": "pro",
  "validFrom": "2026-03-01T00:00:00Z",
  "source": "account-event:014"
}
```

A prediction case records when the agent observed the world and which fact IDs its memory returned. The evaluator resolves the current version for every key and compares the sets.

## Architecture

```text
versioned fact timeline       memory adapter output
          |                         |
          v                         v
      temporal resolver ----> prediction cases
                    \           /
                     v         v
                  freshness evaluator
                          |
                          v
                 JSON metrics + case diffs
```

## MVP scope

Implemented now:

- ISO timestamp validation and half-open validity intervals
- Latest-active-version resolution per fact key
- Duplicate-safe prediction evaluation
- Freshness precision and recall
- Stale-leak, unknown-fact, and provenance-coverage metrics
- Synthetic example data, CLI, tests, and GitHub Actions CI

Out of scope for the first release:

- Judging natural-language answers
- Storing private user history
- Selecting a “best” vector database
- Claiming that fact freshness alone measures overall agent quality

## Roadmap

1. Adapter interface for vector stores and agent memory APIs
2. Mutation scenarios: corrections, deletions, conflicting sources, and retractions
3. Time-to-refresh and invalidation-latency metrics
4. Distractor generation and multi-hop temporal queries
5. Provider-neutral runner for answer-level evaluation with citations
6. Reproducible benchmark report and visualization output

## Local development

Requires Node.js 20+.

```bash
npm install
npm run check
npm test
npm run build
```

## Dataset safety

Use synthetic or explicitly redistributable data. Do not publish private messages, customer facts, credentials, or personal memory stores as fixtures.

## License

MIT
