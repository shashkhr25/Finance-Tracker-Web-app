# FinanceTracker Web

A local-first browser app that implements the full feature set from `APP_FEATURES.md`.

## Run

1. Open `/Users/shashwatkhare/Documents/Projects/financeTrackerWesbite/index.html` in your browser.
2. Create or select a user.
3. Start adding expense/income entries from Dashboard.

No backend or install step is required. Data is stored per user in `localStorage`.

## CSV Import

- Go to `Settings -> Import Transactions CSV`.
- Required: `date` and either:
  - `tx_type`/`type` + `amount`, or
  - `debit`/`credit` columns (type inferred).
- Optional headers: `id`, `timestamp`, `sub_type`, `description`, `category`, `device`, `effects_balance`, `linked_tx_id`, `shared_flag`, `shared_splits`, `shared_notes`.
- Import modes:
  - `Append` adds rows to existing transactions.
  - `Replace` overwrites current transactions only if at least one valid row is parsed.

## Implemented Modules

- User accounts and session restore.
- Dashboard with liquid balance, debt cards, and quick actions.
- Add Expense/Add Income flows with credit-card debt handling, refunds, savings withdraw, and shared splits.
- Transactions screen with sorting, filters, edit, and delete.
- Category Totals with refund-aware net spend, budgets, and variance.
- Shared Expenses summary and per-person drilldown.
- Net Worth with savings/debt breakdown.
- Settings for balances, categories, devices/sources, savings, CSV transaction import, debt clear, and user switching.
- Monthly lifecycle rollover archive and day-19 auto debt clear guard.

## Files

- `index.html` UI structure and views.
- `styles.css` responsive clean theme.
- `app.js` full application logic and persistence.
