---
name: Kysely Query Architect
description: Write type-safe Kysely queries following project patterns. Use when writing new database queries, optimizing queries, or working with the @packages/db/src/queries/* files.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Kysely Query Patterns

## Query Class Structure

Queries live in `@packages/db/src/queries/*.ts` as classes:

```typescript
import type { Kysely } from 'kysely';
import type { Database } from '../index';

export class SalesQueries {
  private db: Kysely<Database>;

  constructor(db: Kysely<Database>) {
    this.db = db;
  }

  async getSales(organizationId: string) {
    return this.db
      .selectFrom('sale')
      .select(['id', 'amount', 'created_at'])
      .where('organization_id', '=', organizationId)
      .orderBy('created_at', 'desc')
      .execute();
  }
}
```

## Core Principles

1. **Explicit columns** - Use `.select([...])` with specific columns, not `selectAll()`
2. **Type inference** - Let Kysely infer return types, don't manually type
3. **Database-side logic** - Do aggregations, filtering, sorting in SQL, not JS

## Composable Queries

Create private methods returning query builders (no `.execute()`) for reuse in CTEs or subqueries:

```typescript
export class CampaignQueries {
  private db: Kysely<Database>;

  constructor(db: Kysely<Database>) {
    this.db = db;
  }

  // Private: returns query builder (no .execute)
  private _getActiveCampaignsQuery(organizationId: string) {
    return this.db
      .selectFrom('dora_campaign')
      .select(['id', 'name', 'tracking_type'])
      .where('organization_id', '=', organizationId)
      .where('is_active', '=', true);
  }

  // Public: executes the query
  async getActiveCampaigns(organizationId: string) {
    return this._getActiveCampaignsQuery(organizationId).execute();
  }

  // Reuse in CTE
  async getCampaignsWithStats(organizationId: string) {
    return this.db
      .with('active_campaigns', () => this._getActiveCampaignsQuery(organizationId))
      .selectFrom('active_campaigns as c')
      .leftJoin('sale as s', 's.dora_campaign_id', 'c.id')
      .select([
        'c.id',
        'c.name',
        this.db.fn.count('s.id').as('sale_count')
      ])
      .groupBy(['c.id', 'c.name'])
      .execute();
  }
}
```

## Query Reuse Across Classes

Inject and reuse existing query classes:

```typescript
export class DashboardQueries {
  constructor(
    private db: Kysely<Database>,
    private salesQueries: SalesQueries,
    private campaignQueries: CampaignQueries
  ) {}

  async getDashboardData(organizationId: string) {
    const [sales, campaigns] = await Promise.all([
      this.salesQueries.getRecentSales(organizationId),
      this.campaignQueries.getActiveCampaigns(organizationId)
    ]);

    return { sales, campaigns };
  }
}
```

## Parallelize Independent Queries

Always use `Promise.all` for independent queries:

```typescript
// ❌ Sequential (slow)
const sales = await this.getSales(orgId);
const campaigns = await this.getCampaigns(orgId);

// ✅ Parallel (fast)
const [sales, campaigns] = await Promise.all([
  this.getSales(orgId),
  this.getCampaigns(orgId)
]);
```

Only run sequentially when one query depends on another's result.

## Anti-Patterns

- **N+1 queries** - Use JOINs or batch with `WHERE id IN (...)`
- **SELECT \*** - Always specify columns
- **JS aggregation** - Use `db.fn.count()`, `db.fn.sum()` in SQL
- **Sequential independent queries** - Use `Promise.all`
