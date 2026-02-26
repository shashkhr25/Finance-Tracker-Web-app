# FinanceTracker - Complete Feature Documentation

Last updated: 2026-02-26

This document describes all implemented app features based on the current codebase.

## 1) Product Scope

FinanceTracker is a local-first personal finance app for:
- Tracking expenses and income.
- Handling credit card debt without double-counting liquid balance.
- Tracking borrowed debt from people and debt settlements.
- Managing shared expenses per person.
- Viewing category totals, budgets, and variance.
- Viewing savings/net-worth-style summaries.
- Supporting multiple users with user-scoped data.

## 2) User Accounts and Sessions

### 2.1 User Management
Implemented via `UserManager` and `UserScreen`.

Features:
- Create new users.
- Select existing users.
- Persist current session in `MoneyTrackerdata/users.json`.
- Logout / switch user.

Validation:
- Username must be non-empty.
- Username must be at least 3 characters.
- Duplicate usernames are rejected.

### 2.2 Session Restore
- On app startup, persisted current user is loaded into in-memory session.
- If a valid current user exists, app opens Dashboard directly.
- Otherwise app opens User selection screen.

## 3) Data Storage and Persistence

### 3.1 User-Scoped Storage
For each user, files are stored under:
- `MoneyTrackerdata/users/<username>/transactions.csv`
- `MoneyTrackerdata/users/<username>/settings.json`

### 3.2 Settings Persistence
`settings.json` stores:
- Currency/version metadata.
- Initial balances (account, cash).
- Initial savings balances (Savings, FD, RD, Gold).
- Category budgets.
- Expense categories.
- Expense devices.
- Income sources.
- Debt/month lifecycle markers (e.g. `last_debt_cleared`, `last_month_processed`).

### 3.3 Transaction Persistence
Transactions are stored as CSV with these core fields:
- id, timestamp, tx_type, sub_type, amount, date
- description, category, device
- effects_balance, linked_tx_id
- shared_flag, shared_splits, shared_notes

### 3.4 Safety / Write Behavior
- Settings and full transaction rewrites use atomic temp-file replace.
- `append_transaction` uses read-modify-write via storage helpers.
- Missing files are auto-created with defaults.

## 4) Transaction Domain Model and Rules

### 4.1 Transaction Types
Supported `tx_type` values:
- `expense`
- `income`
- `transfer` (allowed by validator even if not a primary UI flow)

### 4.2 Validation
All new transactions are validated before save:
- Allowed type check.
- Amount must be > 0.
- Date must be valid.

### 4.3 Device Normalization
Custom labels are mapped into canonical device classes using `normalize_device_type`, including:
- `CASH`, `UPI`, `DEBIT`, `BANK_TRANSFER`, `OTHER`
- `CREDIT_CARD`, `CREDIT_CARD_UPI`
- `DEBT_BORROWED`
- `SAVINGS_WITHDRAW`

This lets users rename payment instruments while preserving core behavior.

### 4.4 Linked Transactions
Some operations create linked pairs via shared `linked_tx_id`:
- Credit card purchase: expense + synthetic debt income.
- Credit card payment: payment expense + debt-offset income.

## 5) Dashboard and Quick Actions

Dashboard features:
- Current date display.
- Liquid balance display with account/cash split.
- Outstanding debt cards:
  - Credit card debt
  - Borrowed debt (money owed to people)
- Quick actions:
  - Add Expense
  - Add Income

Responsive behavior:
- Navigation width adapts with window size.
- Metric cards stack on narrower widths.
- Quick-action button row stacks for small widths.

Feedback:
- After successful Add Expense: popup `Expense added`.
- After successful Add Income: popup `Income added`.

## 6) Add Expense Flow

### 6.1 Basic Inputs
- Amount
- Description
- Category
- Device
- Date
- Optional shared split details

### 6.2 Shared Expense Inputs
- Toggle shared expense.
- Participants input supports:
  - `name`
  - `name:amount`
  - comma-separated lists
- Optional shared notes.

### 6.3 Expense Processing Rules
Depending on category/device/description, Dashboard submission route applies:

1. Credit card payment category logic:
- Recognized via category keys / category text pattern.
- Creates a linked pair:
  - Expense payment (affects balance).
  - Debt reduction audit income (does not affect balance).

2. Credit card purchase logic:
- Triggered by normalized credit-card device or description hints.
- Creates linked pair:
  - Expense (`effects_balance=False`).
  - Debt income (`effects_balance=False`).
- This avoids liquid balance double-counting while increasing debt.

3. Regular expense logic:
- Single expense transaction with `effects_balance=True`.

## 7) Add Income Flow

### 7.1 Basic Inputs
- Amount
- Description
- Source/device
- Date
- Optional shared refund details

### 7.2 Cash Toggle
- "Received in cash" toggle routes device as `CASH` while preserving source semantics.

### 7.3 Refund Handling
- Selecting source `Refund` shows a refund category selector.
- Saves as income with `sub_type=refund` and selected category.
- Used by Category Totals to reduce net spend in that category.

### 7.4 Savings Withdrawal Handling
- Sources `Savings Withdraw` / `Taken from Savings` are normalized to savings-withdraw behavior.
- Category becomes `Taken from Savings`.
- Device may become `SAVINGS_WITHDRAW`.
- This decreases savings totals in Net Worth calculations.

### 7.5 Shared Income Entries
- Shared participants and notes are supported similarly to shared expenses.

## 8) Transactions Screen

Features:
- Transaction list with date/category/description/device/amount/shared text.
- Sort toggle:
  - Newest first
  - Oldest first
- Filters:
  - Search text (description/category/device)
  - Category prefix filter
  - Device prefix filter
  - Date filter (`YYYY-MM-DD`) with exact ISO match and partial prefix fallback
  - Month and year filters (default current month/year)
- Date filter takes precedence over month/year range.
- Clear filters resets all filters and restores current month/year defaults.

Actions per row:
- Edit transaction.
- Delete transaction.

Edit flow:
- Opens appropriate edit dialog.
- Supports amount/description/category/device/date/shared fields.
- Writes updated row and refreshes dependent screens.

Delete flow:
- Removes by transaction id.
- Refreshes dependent screens.

## 9) Category Totals Screen

Features:
- Monthly category aggregation (current month/year by default).
- Toggle between:
  - Expense view
  - Income view
- Text filter by category name.
- Total amount summary for current view.

### 9.1 Refund-Aware Net Spending
Expense mode uses:
- `net_spent = expenses - refund_income(sub_type=refund)`
per category.

### 9.2 Budgets and Variance
- Per-category budget editing in list rows.
- Saved in settings (`category_budgets`).
- Variance calculation:
  - Expense mode: `budget - spent` (positive is favorable).
  - Income mode: `income - budget` (positive is favorable).

## 10) Shared Expenses Module

Shared transaction logic works on transactions with:
- `shared_flag=True`
- Valid `shared_splits`

### 10.1 Allocation Engine
For each shared transaction:
- Explicit splits (`name:amount`) are honored.
- Unspecified participants split remaining amount evenly.
- Rounding is handled so final distribution matches total.

### 10.2 Shared Summary
Displays per-person net position:
- Positive: you should receive.
- Negative: you should pay.

Sign behavior:
- Shared `expense` generally increases amount owed by participants.
- Shared `income` generally reduces owed amount.
- `DEBT_BORROWED` device is inverted in shared math (treated as amount payable context).

### 10.3 Filters
- Participant filter.
- Category filter.
- Caption reflecting active filters.

### 10.4 Detailed Per-Person Drilldown
- Tap participant in summary opens person-specific detail screen.
- Shows participant net and transaction-level entries with:
  - Date
  - Description
  - Signed participant amount
  - Total transaction amount
  - Category
  - Participant breakdown
  - Notes

Navigation:
- Back to Shared Expenses.
- Back to Dashboard.

## 11) Net Worth Screen

Computed view includes:
- Liquid balance.
- Total savings.
- Savings split:
  - Savings
  - Savings FD
  - Savings RD
  - Savings Gold
- Debt split:
  - Credit card debt
  - Borrowed debt

Savings computation combines:
- Initial savings settings values.
- Savings-category expense flows (adds to savings buckets).
- Savings withdrawal income flows (subtracts from savings).

## 12) Settings Screen

### 12.1 Initial Balance Inputs
- Initial account balance.
- Initial cash balance.

### 12.2 Payment Instruments and Income Sources
- Multi-line editors for:
  - Expense devices
  - Income sources
- One item per line.
- Supports add/remove/rename by editing text lines.

### 12.3 Category Management Popup
Dedicated manager with:
- List all categories.
- Add category.
- Remove category.
- Rename category.
- Save validates at least one category.

Rename side effects:
- Existing budgets are merged/remapped to new names.
- Existing transactions with renamed category are rewritten.

### 12.4 Initial Savings Popup
- Edit initial balances for Savings/FD/RD/Gold.

### 12.5 Debt Utility Actions
- Clear outstanding debt via Dashboard debt-clearing routine.

### 12.6 User Action
- Switch User (logout to user selection screen).

## 13) Debt Model Details

### 13.1 Credit Card Debt
- Calculated by billing cycle: 19th to 18th.
- Expenses and payments tracked per cycle.
- Payments are applied oldest-first when computing outstanding debt.

### 13.2 Borrowed Debt
- `DEBT_BORROWED` expenses increase borrowed debt.
- `Debt Cleared` category expenses reduce borrowed debt.

### 13.3 Auto Debt-Clear Check
- App checks on day 19 whether debt should be auto-cleared.
- Prevents duplicate clear in same month via settings marker.

## 14) Monthly Lifecycle

On app start (when logged in):
- Reads `last_month_processed`.
- If missing (legacy first run), initializes marker only.
- If month changed, archives current `transactions.csv` to month-named file and starts a fresh monthly file.

## 15) UX and Interaction Features

- Popup helper for informational/success/error messages.
- Dedicated short feedback popup for add actions.
- Navigation drawer with routes:
  - Dashboard
  - Transactions
  - Category Totals
  - Shared Expenses
  - Net Worth
  - Settings
- Consistent themed controls (buttons/inputs/spinners/cards/top bar).

## 16) Default Seed Configuration

### 16.1 Default Expense Categories
- Food
- Home
- Transportation
- Personal
- Rent
- House EMI
- Gym
- Utilities
- Shopping
- Petrol
- Subscription/Recharge
- Book
- Health/Medical
- Credit Card Bill
- Credit Card UPI Bill
- Savings
- Savings RD
- Savings FD
- Savings Gold
- Debt Cleared
- Others

### 16.2 Default Expense Devices
- Cash
- UPI
- CREDIT_CARD
- CREDIT_CARD_UPI
- DEBT_BORROWED

### 16.3 Default Income Sources
- Paycheck
- Rent
- Home
- Personal split paid
- Refund
- Savings Withdraw
- Taken from Savings
- Others

## 17) Technical Notes / Guardrails

- Invalid amount/date inputs are rejected or defaulted safely (date defaults to today in parser).
- Transaction validation rejects non-positive amounts.
- Shared entries require participants when shared toggle is on.
- CSV/JSON access handles missing files and corruption fallbacks.

## 18) Out-of-Scope / Placeholder

- `compute_net_worth(...)` function exists as placeholder and is not currently used for UI computation.
- `show_transaction_detail(...)` in shared screen is currently a stub.

---

If you want, this file can be split into:
- `USER_GUIDE.md` (non-technical how-to)
- `TECHNICAL_SPEC.md` (data model and calculation rules)
for easier maintenance.
