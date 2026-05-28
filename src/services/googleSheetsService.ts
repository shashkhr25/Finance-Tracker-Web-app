import type { FinanceState, Transaction } from '../types/finance';

const CLIENT_ID = '720779656208-housb922ji760qs8c0q6ad4fhsmntk0j.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

export const CSV_COLUMNS = [
    "id", "timestamp", "tx_type", "sub_type", "amount", "date", 
    "description", "category", "device", "account", "location", 
    "occasion", "effects_balance", "linked_tx_id", "shared_flag", 
    "shared_splits", "shared_notes"
];

let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
    accessToken = token;
};

export const getSpreadsheetId = (url: string): string | null => {
    const matches = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return matches ? matches[1] : null;
};

export const pushToSheet = async (url: string, state: FinanceState): Promise<boolean> => {
    const spreadsheetId = getSpreadsheetId(url);
    if (!spreadsheetId) {
        console.error("Invalid Spreadsheet URL");
        return false;
    }
    if (!accessToken) {
        console.error("Not authenticated with Google");
        return false;
    }

    try {
        const txRows = [CSV_COLUMNS];
        state.transactions.forEach(tx => {
            const row = CSV_COLUMNS.map(col => {
                const val = (tx as any)[col];
                if (val === undefined || val === null) return "";
                if (typeof val === 'object') return JSON.stringify(val);
                // Ensure booleans are written as "True"/"False" for Kivy compatibility
                if (typeof val === 'boolean') return val ? "True" : "False";
                return String(val);
            });
            txRows.push(row);
        });

        const settingsRows = [["Key", "Value"]];
        const settingsToSync: any = { ...state };
        delete settingsToSync.transactions;
        // delete settingsToSync.cloud_sheet_url;

        Object.entries(settingsToSync).forEach(([key, value]) => {
            if (typeof value === 'object') {
                settingsRows.push([key, JSON.stringify(value)]);
            } else if (typeof value === 'boolean') {
                settingsRows.push([key, value ? "True" : "False"]);
            } else {
                settingsRows.push([key, String(value)]);
            }
        });

        await updateWorksheet(spreadsheetId, "Transactions", txRows);
                // Try to push to existing worksheet if it exists with a different name
        let settingsTitle = "Settings";
        try {
            const hasSettingsJson = await getWorksheetData(spreadsheetId, "settings.json");
            if (hasSettingsJson) settingsTitle = "settings.json";
        } catch { /* ignore */ }
        
        await updateWorksheet(spreadsheetId, settingsTitle, settingsRows);

        return true;
    } catch (error) {
        console.error("Error pushing to sheet:", error);
        return false;
    }
};

export const pullFromSheet = async (url: string): Promise<Partial<FinanceState> | null> => {
    const spreadsheetId = getSpreadsheetId(url);
    if (!spreadsheetId) return null;
    if (!accessToken) return null;

    try {
        const transactionsData = await getWorksheetData(spreadsheetId, "Transactions");
                let settingsData = await getWorksheetData(spreadsheetId, "Settings");
        if (!settingsData) {
            settingsData = await getWorksheetData(spreadsheetId, "settings.json");
        }

        if (!transactionsData && !settingsData) {
            console.error("Could not find Transactions or Settings worksheets");
            return null;
        }

        const newState: Partial<FinanceState> = {};

        if (transactionsData && transactionsData.length > 0) {
            const header = transactionsData[0];
            const rows = transactionsData.slice(1);
            newState.transactions = rows.map((row: any[]) => {
                const tx: any = {};
                header.forEach((col: string, i: number) => {
                    let val = row[i] || "";
                    const valLower = String(val).toLowerCase();
                    
                    if (valLower === 'true' || valLower === '1' || valLower === 'yes') {
                        val = true;
                    } else if (valLower === 'false' || valLower === '0' || valLower === 'no') {
                        val = false;
                    } else if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                        try { val = JSON.parse(val); } catch { /* ignore */ }
                    } else if (col === 'amount' || (typeof val === 'string' && val.match(/^\d+\.?\d*$/))) {
                        const num = parseFloat(val);
                        if (!isNaN(num)) val = num;
                    }
                    
                    tx[col] = val;
                });
                return tx as Transaction;
            });
        }

        if (settingsData && settingsData.length > 0) {
            settingsData.slice(1).forEach((row: any[]) => {
                if (row.length >= 2) {
                    const key = row[0];
                    let val = row[1];
                    const valLower = String(val).toLowerCase();

                    if (valLower === 'true' || valLower === '1' || valLower === 'yes') {
                        val = true;
                    } else if (valLower === 'false' || valLower === '0' || valLower === 'no') {
                        val = false;
                    } else if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                        try { val = JSON.parse(val); } catch { /* ignore */ }
                    } else if (typeof val === 'string' && val.match(/^\d+\.?\d*$/)) {
                        const num = parseFloat(val);
                        if (!isNaN(num)) val = num;
                    }

                    (newState as any)[key] = val;
                }
            });
        }

        return newState;
    } catch (error) {
        console.error("Error pulling from sheet:", error);
        return null;
    }
};

async function updateWorksheet(spreadsheetId: string, title: string, rows: any[][]) {
    const clearResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${title}!A1:Z:clear`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!clearResponse.ok) {
        const error = await clearResponse.json();
        if (error.error?.status === 'INVALID_ARGUMENT' || error.error?.code === 404) {
            console.warn(`Worksheet ${title} might not exist. Attempting to create...`);
            const createResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requests: [{ addSheet: { properties: { title } } }]
                })
            });
            if (!createResponse.ok) {
                const createError = await createResponse.json();
                throw new Error(`Failed to create worksheet ${title}: ${JSON.stringify(createError)}`);
            }
        } else {
            throw new Error(`Failed to clear worksheet ${title}: ${JSON.stringify(error)}`);
        }
    }

    const updateResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${title}!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: rows })
    });

    if (!updateResponse.ok) {
        const error = await updateResponse.json();
        throw new Error(`Failed to update worksheet ${title}: ${JSON.stringify(error)}`);
    }
}

async function getWorksheetData(spreadsheetId: string, title: string) {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${title}!A1:Z`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
        const error = await response.json();
        if (response.status === 404 || error.error?.status === 'INVALID_ARGUMENT') {
            return null;
        }
        throw new Error(`API Error ${response.status}: ${error.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.values;
}

export const initGoogleAuth = (callback: (token: string) => void) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error google is loaded via script tag
    const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
            if (response.access_token) {
                setAccessToken(response.access_token);
                callback(response.access_token);
            }
        },
    });
    return client;
};

export const getUserInfo = async (token: string) => {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return null;
    return await response.json();
};
