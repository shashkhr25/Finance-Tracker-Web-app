# FinanceTracker Technical Documentation & Feature Specification

This document provides a comprehensive technical blueprint of the FinanceTracker application. It is designed to serve as a complete reference for recreating the application's functionality, architecture, and logic using an LLM or manual development.

---

## 1. Overview
FinanceTracker is a high-density, multi-user personal finance management application built with **Python**, **Kivy**, and **KivyMD**. It emphasizes accurate debt tracking (especially for credit cards), portfolio management (Net Worth, Savings), and shared expense splitting. It operates as a local-first application using CSV and JSON for persistent storage.

---

## 2. Technological Stack
- **Language**: Python 3.10+
- **UI Framework**: Kivy (Cross-platform GUI) & KivyMD (Material Design components)
- **Styling**: Kivy Language (KV) and a centralized `theme.json`
- **Data Persistence**: 
  - **CSV**: Transaction ledger
  - **JSON**: User settings, user management, and theme configuration
- **External Libraries**: `openpyxl` (XLSX parsing), `python-dateutil` (date arithmetic)

---

## 3. Project Architecture (File Responsibilities)

| File | Purpose |
| :--- | :--- |
| `app.py` | **Main Entry Point**: Application lifecycle, UI orchestration, Screen management, and Dialog implementations. |
| `logic.py` | **Business Logic Layer**: Dataclasses, validation, balance/debt/net-worth computations, and smart-import parsing/auto-categorization. |
| `storage.py` | **Persistence Layer**: Atomic file I/O for CSV and JSON, user-scoped data directory management. |
| `user_manager.py` | **Identity Layer**: Multi-user profile management, session persistence, and data isolation. |
| `finance_core.py` | **Finance Helpers**: Shared utilities for account management and balance formatting. |
| `ui.kv` | **Layout Definition**: Declarative UI structure, styling rules, and widget bindings. |
| `theme.json` | **Visual Configuration**: Centralized color palette and spacing constants. |
| `screens/` | **Screen Modules**: Modularized screen classes (e.g., `user_screen.py`). |
| `MoneyTrackerdata/` | **Data Root**: Root directory for all user data, backups, and temporary files. |

---

## 4. Data Models

### 4.1. Transaction Ledger (CSV)
Each transaction row contains:
- `id`: Unique UUID4 string.
- `timestamp`: ISO-8601 creation time (UTC).
- `tx_type`: `income`, `expense`, or `transfer`.
- `sub_type`: `regular`, `credit_card_expense`, `credit_card_debt`, `refund`, `cash_withdrawal`, `credit_card_payment`.
- `amount`: Floating point value (2 decimal places).
- `date`: User-selected date (YYYY-MM-DD).
- `description`: String description.
- `category`: Spending/Income category (e.g., "Food", "Salary").
- `device`: Payment method (e.g., "UPI", "CREDIT_CARD_0098", "CASH").
- `account`: Linked bank account name.
- `effects_balance`: Boolean (Stored as "True"/"False") - Determines if it impacts liquid liquidity.
- `linked_tx_id`: ID used to pair transactions (e.g., CC Expense paired with CC Debt).
- `shared_flag`: Boolean - Indicates if the expense is shared with others.
- `shared_splits`: JSON String - List of objects `{"name": "...", "amount": ...}`.
- `shared_notes`: Optional metadata for splits.

### 4.2. User Settings (JSON)
Stored per user in `MoneyTrackerdata/users/<username>/settings.json`:
- `accounts`: List of `{"name": "...", "balance": ...}`.
- `category_budgets`: Map of `category_name -> monthly_limit`.
- `expense_categories`: Master list of active categories.
- `expense_devices`: Master list of payment devices.
- `income_sources`: Master list of income types.
- `initial_balances`: Baseline for Banks, Cash, and Savings buckets (RD, FD, Gold).
- `last_debt_cleared`: YYYY-MM-DD of the last automatic debt reset.

---

## 5. Storage Engine & Multi-User Isolation

### 5.1. User Isolation
- All user-specific data is stored in `MoneyTrackerdata/users/<username>/`.
- `user_manager.py` maintains a global `users.json` tracking registered users and the `current_user` session.
- Files are only accessed after a user is authenticated (locally).

### 5.2. Atomic Persistence
- **JSON**: Written via `json.dump` with atomic file swapping if needed (standard `open("w")` used in this implementation).
- **CSV**: Entire table is rewritten atomically using `tempfile.NamedTemporaryFile` and `shutil.move` to prevent corruption during crashes.

---

## 6. Core Business Logic & Algorithms

### 6.1. Balance Computation
Liquid balance is derived by:
1. `Initial Bank Balance` (from settings).
2. `+ Income` (where `effects_balance=True`).
3. `- Expense` (where `effects_balance=True`).
4. **Exclusions**: Credit card expenses and debt-borrowed transactions do not impact liquid bank balance directly.

### 6.2. Credit Card Logic (The "Billing Cycle")
- **Dual-Entry**: A CC purchase creates two rows:
  - `expense` (`sub_type=credit_card_expense`, `effects_balance=False`): For category tracking.
  - `income` (`sub_type=credit_card_debt`, `effects_balance=False`): For liability tracking.
- **Billing Cycle**: Automatically calculated from the **19th of month N** to the **18th of month N+1**.
- **Debt Clearing**: On the 19th of each month, the app prompts or automatically logs a "Debt Cleared" transaction to reset the outstanding monitor, provided a payment has been recorded.

### 6.3. Net Worth Calculation
`Net Worth = (Bank Balances + Cash-on-hand + Savings + RD + FD + Gold) - (Credit Card Outstandings + Borrowed Debt)`.

### 6.4. Shared Expenses & Smart Settlement
- **Splitting**: Supports even splits or custom amount assignments.
- **Settlement Logic**: When an income is marked as "Personal split paid" for a participant, the system applies this income oldest-first to outstanding shared expense "buckets" for that participant.
- **Reimbursement Aggregation**: Category reports can "offset" spending by looking at how much shared money was paid back for that specific category.

### 6.5. Smart Statement Import
- **Parsing**: Multi-format engine (`CSV`, `XLSX`, `PDF`, `XLS`).
- **Header Detection**: Scans for keywords like "Date", "Narration", "Amount" to identify the start of transaction data.
- **Auto-Categorization**: 
  - **Category Map**: Matches description keywords (e.g., "ZOMATO" -> "Food").
  - **Device Map**: Detects "UPI", "ATM", "POS" strings to assign payment methods.
  - **Filename Logic**: Infers the payment device from the file name (e.g., "6734" in filename maps to a card ending in 6734).

---

## 7. User Interface & Screen Architecture

The app uses a `ScreenManager` with the following primary screens:
1. **UserScreen**: Login and profile creation.
2. **DashboardScreen**: Real-time metrics (Balance, Debt, Net Worth) and quick action buttons.
3. **TransactionsScreen**: Infinite-scroll ledger with keyword search, sorting (Newest/Oldest), and multi-dimensional filters (Category, Device, Date, Month/Year).
4. **CategoryTotalsScreen**: Monthly aggregation of spending vs. budgets with variance analysis (Color-coded: Red for over, Green for under).
5. **NetWorthScreen**: Deep dive into asset vs. liability breakdown.
6. **SharedExpensesScreen**: "Who owes whom" dashboard and settlement history.
7. **SettingsScreen**: Master list management, budget entry, and data export (CSV).

### 7.1. Theming System
- Colors are fetched from `theme.json` (e.g., `C_PRIMARY`, `C_BG`, `C_SURFACE`).
- UI uses **Glass Cards** (semi-transparent overlays) and **Rounded Rectangles** for a modern look.
- Support for dynamic resizing (adaptive layouts for various window widths).

---

## 8. Key Workflows

### 8.1. Adding a Basket Expense
1. User enters "Total Paid".
2. Adds multiple items with their own Category, Description, and Amount.
3. Adds "Fees" (Delivery, Platform, Surge) and "Discounts".
4. **Validation**: Ensures `Sum(Items) + Fees - Discounts == Total Paid`.
5. **Logic**: Proportional distribution of discounts across items to ensure accurate category-level cost tracking.

### 8.2. Smart Import Review
1. Parses file.
2. Shows a scrollable list of "Candidates".
3. User reviews/edits each row (Description, Category, Account, Device).
4. **Keyboard Navigation**: Up/Down arrows to move between rows, Enter to toggle approval.
5. Finalize commits all approved rows to the ledger and updates balances.

---

## 9. Environmental Requirements
- **Data Folder**: Must have write permissions.
- **Asset Directory**: Expects specific fonts (e.g., `data/fonts/DejaVuSans.ttf`) for emoji support (📅, ✎, etc.).
- **Window Management**: Default maximized mode; assumes desktop/tablet aspect ratios.

---

## 10. Implementation Notes for LLM
When recreating this app:
1. **Atomic Writes**: Ensure `storage.py` logic is followed to prevent data loss.
2. **Paired Transactions**: Always create the `credit_card_debt` row when a `credit_card_expense` is logged.
3. **Filtering**: The `refresh` method in `TransactionsScreen` is the "source of truth" for the ledger view; it must handle the intersection of 5+ filters.
4. **Validation**: Use the `validate_transaction` function in `logic.py` before any write.
