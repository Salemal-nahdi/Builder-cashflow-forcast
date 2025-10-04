# Xero Integration (Tracking-first, Projects-ready)

## Scope & Principles

- Tracking-category-first mapping; keep design open to Xero Projects (future).
- Classify actuals from Xero lines (Invoices/Bills, Payments, BankTransactions) using tracking categories/options and account types (COGS vs Revenue/Expense).
- Support both cash and accrual basis across all reports (org default + per-report toggle).
- App must function without Xero: provider-agnostic core with manual import and entry.

## Data Model Additions (Prisma)

- `XeroConnection`: tenant binding, tokens, orgId.
- `XeroTrackingCategory` / `XeroTrackingOption`: synced from Xero.
- `XeroAccount`: chart of accounts (type, code, name).
- `XeroContact`: contact mirror for linking projects to Xero contacts.
- Raw entities (minimal fields to re-derive actuals):
- `XeroInvoice` (AR), `XeroBill` (AP), `XeroPayment`, `XeroBankTransaction` (+ lines with tracking + account code + item code).
- Mapping tables:
- `ProjectXeroTrackingMap` (N:1 options→project) [supports multiple options per project].
- `ProjectXeroContactMap` (1:1 optional link to a primary Xero contact per project).
- Derived reporting table:
- `ActualEvent` (flattened): {organizationId, projectId, basis: 'cash'|'accrual', type: 'income'|'outgo', amount, occurredAt, sourceType, sourceId, accountCode, accountType, contactId, trackingOptionIds[]}. Indexed by org, project, occurredAt.

## Sync & ETL

- OAuth2 PKCE; scopes: `accounting.settings`, `accounting.contacts.read`, `accounting.transactions.read`, `projects.read` (optional), `offline_access`.
- Initial sync (backfill N months) + incremental sync using `If-Modified-Since`/`UpdatedDateUTC` and stored cursors.
- Pull:
- Accounts, TrackingCategories/Options, Contacts, Items (for COGS mapping), Invoices (AR), Bills (AP), Payments, BankTransactions.
- ETL rules to `ActualEvent`:
- Accrual basis: AR invoice lines → income on `Date`; AP bill lines → outgo on `Date`.
- Cash basis: Payments allocations' `Date` drive income/outgo; direct BankTransactions create income/outgo on transaction date.
- Project attribution: prefer line's tracking option→`ProjectXeroTrackingMap`; if unmapped, heuristics: match by option name=project name; else mark as Unmapped.
- Classification: accountType in [REVENUE/SALES/OTHERINCOME] → income; [COGS/EXPENSE/OVERHEADS] → outgo. Fallback to AR/AP context if missing type.
- Partial payments: split amounts proportionally by line allocations; multiple `ActualEvent`s if multiple dates.

## Services & APIs

- `src/lib/xero/client.ts`: typed Xero SDK wrapper (tenant selection, rate limits, retries, paging).
- `src/lib/xero/sync.ts`: orchestrate entity sync + cursors; enqueue jobs per entity page.
- `src/lib/xero/etl.ts`: normalize raw Xero entities → `ActualEvent[]` (cash/accrual).
- `src/app/api/xero/connect/route.ts`: begin OAuth; `callback.ts` handle token & tenant link.
- `src/app/api/xero/sync/route.ts`: trigger incremental sync (guarded by RBAC).
- `src/app/api/actuals/summary/route.ts`: aggregated actuals by period/project/basis for UI.

## Project & Contact Linking UX

- Settings UI `src/app/settings/xero/page.tsx`:
- Connection status, re-auth, scope display.
- Mapping: table of `Project` rows with multi-select of Tracking Options; optional primary `XeroContact` link.
- Default basis preference (org-level) + per-report override.

## Reporting & Reconciliation

- Extend reconciliation engine to match `ActualEvent` ↔ forecast `CashEvent` (by project, account type, date proximity, description similarity). Store `VarianceMatch`.
- UI updates:
- Dashboard/Forecast pages: basis toggle (cash/accrual). Pull actuals via `/api/actuals/summary` and overlay with forecast.
- By Project view: add Actuals columns per period; hover shows source lines (invoice/bill number, contact, account).

## Security, Ops, Observability

- Store tokens encrypted; rotate refresh tokens; handle 401 → token refresh; tenant selection header.
- Rate limit/backoff (429); idempotent upserts via `xeroId` unique keys.
- Sync logs + metrics (counts by entity, duration, failures).

## Risks & Mitigations

- Tracking inconsistencies → provide Unmapped bucket + mapping UI.
- Partial payments complexity → centralize allocation logic in ETL with tests.
- Timezones/date alignment → normalize to UTC, store original.

## Future Extensions (Architecture Ready)

- **Draft Invoice Creation**: One-click draft invoice generation in Xero from milestone payments
- **OCR & AI Project Setup**: Upload estimator reports/contracts → AI analysis → auto-populate project costs
- **Manual Entry Fallback**: Full functionality without Xero (CSV import, manual actuals entry)

## Deliverables

- Working Xero connection flow
- Mapped actuals on both bases; basis toggle in UI
- Actual vs Forecast variance by project and period
- Mapping UI for tracking options and contacts
- Provider-agnostic core that works with or without Xero

### To-dos

- [ ] Add Prisma models for Xero entities, maps, ActualEvent
- [ ] Implement Xero OAuth PKCE flow and tenant storage
- [ ] Build sync jobs for accounts, contacts, tracking, items
- [ ] Sync invoices, bills, payments, bank transactions
- [ ] Transform Xero data to ActualEvent (cash/accrual) with mapping
- [ ] Create UI to map tracking options and contacts to projects
- [ ] Add cash/accrual toggle to dashboard and reports
- [ ] Add API to fetch actuals summaries by project/period
- [ ] Match ActualEvent vs CashEvent and surface variance
- [ ] Add rate limit, retry, logs/metrics for sync
