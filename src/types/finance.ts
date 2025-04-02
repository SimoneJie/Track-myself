
// src/types/finance.ts
export type TransactionType = 'income' | 'expense'

export interface Transaction {
    id: number
    type: TransactionType
    amount: number
    category: string
    date: string
    note: string
}

export interface TransactionForm {
    type: TransactionType
    amount: number
    category: string
    date: string
    note: string
}

