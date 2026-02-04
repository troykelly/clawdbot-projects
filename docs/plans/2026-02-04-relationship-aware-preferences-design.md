# Relationship-Aware Preferences and Memory Auto-Surfacing

**Epic:** #486
**Date:** 2026-02-04
**Status:** Design approved, implementation pending

## Problem

OpenClaw agents need to store and automatically surface user preferences, likes, and dislikes. A human says "I love 90s dance music, it's great to work to" and a future conversation about music or focus should surface that preference without the agent manually recalling it.

The current memory system stores preferences as unscoped text blobs. The auto-recall hook uses a hardcoded query instead of the user's actual prompt. There is no relationship graph to connect preferences across people, households, or groups.

## Design

### Contact Kinds

The `contact` table gains a `contact_kind` column:

- `person` -- individual human
- `organisation` -- company, business, non-profit
- `group` -- household, mob, family, team, chosen family
- `agent` -- external AI agent, bot

Groups are contacts. A household is a contact record with `contact_kind = 'group'`. Members have `member_of` relationships to it. This avoids a separate entity type and keeps the agent tool surface uniform.

### Relationship Type System

A `relationship_type` reference table stores canonical types:

```
relationship_type
  id                uuid PK
  name              text UNIQUE (snake_case: 'partner_of')
  label             text (human-readable: 'Partner of')
  is_directional    boolean
  inverse_type_id   uuid FK self-ref (for directional types)
  description       text
  created_by_agent  text (null = pre-seeded)
  embedding         vector(1024)
  embedding_status  text
  search_vector     tsvector
  created_at        timestamptz
  updated_at        timestamptz
```

Pre-seeded with common types covering romantic, familial, kinship, household, care, community, professional, and group membership relationships. Inclusive by design: no assumptions about exclusivity, gender, or family structure. Agents can define new types; the system semantic-matches against existing types before creating duplicates.

Directional types come in pairs linked via `inverse_type_id` (e.g., `parent_of` <-> `child_of`). Symmetric types have `is_directional = false`.

### Relationship Table

```
relationship
  id                  uuid PK
  contact_a_id        uuid FK contact
  contact_b_id        uuid FK contact
  relationship_type_id uuid FK relationship_type
  notes               text
  created_by_agent    text
  embedding           vector(1024)
  embedding_status    text
  created_at          timestamptz
  updated_at          timestamptz
```

Graph traversal: querying contact X finds all rows where X is `contact_a_id` (type as-is) or `contact_b_id` (inverse type for directional relationships). One stored row handles both directions.

### Memory Extensions

Two additions to the `memory` table:

1. `tags text[]` with GIN index -- structured filtering alongside semantic search
2. `relationship_id uuid` FK to `relationship` -- preferences scoped to relationships

Preference scoping model:
- `user_email` -- personal preference
- `contact_id` -- preference about a contact or group
- `relationship_id` -- preference about a specific relationship

### Agent Tools

Two new tools:

**`relationship_set(contact_a, contact_b, relationship, notes?)`**
One call creates a relationship. System resolves contacts by name or ID, semantic-matches the relationship description to existing types, creates new type if needed, handles directionality internally.

**`relationship_query(contact, type_filter?)`**
One call returns all relationships for a contact with inverse resolution, group memberships, and structured response.

**`memory_store` enhanced** with `tags` and `relationship_id` parameters.

### Auto-Surfacing Flow

When `beforeAgentStart` fires:

1. Identify user from event payload
2. Traverse relationship graph (1 hop) to collect: direct contacts, group memberships, relationship IDs
3. Semantic search across all scope IDs using the user's actual prompt
4. Filter: exclude expired/superseded, apply similarity threshold, rank by similarity x importance x confidence
5. Inject into agent context with source attribution ("personal preference" vs "household preference")

### Current Problems to Fix

- `register-openclaw.ts:1555` uses hardcoded query for auto-recall
- Two divergent hook implementations (2026 API vs legacy)
- API endpoint mismatch (GET /api/context vs POST /api/v1/context)
- Auto-capture is a stub in the 2026 API path
- Hook event payload and return format unvalidated against actual OpenClaw

## Issue Breakdown

See #486 for the full issue list with dependencies.

Immediate starts (no dependencies): #487, #489, #490, #492
Research spikes first: #487 -> #488 (de-risk hook integration)
Critical path: #490 -> #491 -> #493/#494 -> #496 -> #497
