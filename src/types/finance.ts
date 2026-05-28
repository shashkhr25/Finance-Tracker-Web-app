export interface Account {
    name: string;
    balance: number;
    is_main: boolean;
}

export interface Savings {
    general: number;
    fd: number;
    rd: number;
    gold: number;
}

export interface SharedSplit {
    name: string;
    amount: number;
}

export interface Transaction {
    id: string;
    timestamp: string;
    tx_type: 'income' | 'expense' | 'transfer';
    sub_type: 'regular' | 'credit_card_expense' | 'credit_card_debt' | 'refund' | 'cash_withdrawal' | 'credit_card_payment';
    amount: number;
    date: string;
    description: string;
    category: string;
    device: string;
    account: string;
    effects_balance: boolean;
    linked_tx_id?: string;
    shared_flag?: boolean;
    shared_splits?: SharedSplit[];
}

export interface FinanceState {
    user: string;
    accounts: Account[];
    cash_balance: number;
    savings: Savings;
    expense_categories: string[];
    income_sources: string[];
    payment_devices: string[];
    participants: string[];
    category_budgets: Record<string, number>;
    transactions: Transaction[];
    cloud_sheet_url?: string;
}
