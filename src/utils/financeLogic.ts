import type { Transaction } from '../types/finance';

export const ALLOWED_DEVICES = ["UPI", "CREDIT_CARD", "CREDIT_CARD_UPI", "CASH", "DEBIT", "BANK_TRANSFER", "OTHER", "SAVINGS_WITHDRAW", "DEBT_BORROWED"];
export const CREDIT_CARD_DEVICES = ["CREDIT_CARD", "CREDIT_CARD_UPI"];

export function normalizeDeviceType(device: string): string {
    const raw = (device || "").trim();
    if (!raw) return "OTHER";

    const canonical = raw.toUpperCase().replace(/-/g, "_").replace(/ /g, "_");
    if (ALLOWED_DEVICES.includes(canonical)) return canonical;

    const text = raw.toUpperCase().replace(/-/g, " ").replace(/_/g, " ").replace(/\s+/g, " ").trim();

    if (text.includes("DEBT") && text.includes("BORROW")) return "DEBT_BORROWED";
    if (text.includes("SAVINGS") && text.includes("WITHDRAW")) return "SAVINGS_WITHDRAW";
    if (text.startsWith("CC") || text.includes(" CC ")) return text.includes("UPI") ? "CREDIT_CARD_UPI" : "CREDIT_CARD";
    if (text.includes("NEU")) return text.includes("UPI") ? "CREDIT_CARD_UPI" : "CREDIT_CARD";
    if (text.includes("CREDIT") && text.includes("CARD") && text.includes("UPI")) return "CREDIT_CARD_UPI";
    if (text.includes("CREDIT") && text.includes("CARD")) return "CREDIT_CARD";
    if (text.includes("CARD") && !text.includes("DEBIT")) return "CREDIT_CARD";
    if (text.includes("BANK") && text.includes("TRANSFER")) return "BANK_TRANSFER";
    if (text.includes("CASH")) return "CASH";
    if (text.includes("UPI")) return "UPI";
    if (text.includes("DEBIT")) return "DEBIT";
    
    return "OTHER";
}

export function computeSharedAllocations(tx: Transaction): Record<string, number> {
    if (!tx.shared_flag || !tx.shared_splits || tx.shared_splits.length === 0) return {};

    const totalAmount = Math.abs(tx.amount || 0);
    const explicitAllocations: Record<string, number> = {};
    const unspecifiedParticipants: string[] = [];

    tx.shared_splits.forEach(split => {
        const name = split.name.trim();
        if (!name) return;

        if (split.amount === null || split.amount === undefined || split.amount === 0) {
            unspecifiedParticipants.push(name);
        } else {
            const val = Math.abs(split.amount);
            explicitAllocations[name] = (explicitAllocations[name] || 0) + val;
        }
    });

    const specifiedTotal = Object.values(explicitAllocations).reduce((sum, v) => sum + v, 0);
    const remaining = Math.max(0, totalAmount - specifiedTotal);

    const allocations = { ...explicitAllocations };
    if (unspecifiedParticipants.length > 0) {
        const baseShare = remaining / unspecifiedParticipants.length;
        let distributedSoFar = 0;
        unspecifiedParticipants.forEach((name, idx) => {
            if (idx === unspecifiedParticipants.length - 1) {
                allocations[name] = (allocations[name] || 0) + (remaining - distributedSoFar);
            } else {
                const share = Math.round(baseShare * 100) / 100;
                allocations[name] = (allocations[name] || 0) + share;
                distributedSoFar += share;
            }
        });
    }

    return allocations;
}

export function getCycleKey(dateStr: string): string {
    const d = new Date(dateStr);
    let year = d.getFullYear();
    let month = d.getMonth(); // 0-11
    if (d.getDate() < 19) {
        month -= 1;
        if (month < 0) { month = 11; year -= 1; }
    }
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}
