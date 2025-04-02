import { defineStore } from 'pinia'
import type { Transaction, TransactionType, TransactionForm } from '@/types/finance'
interface FinanceState {
    transactions: Transaction[]
}

export const useFinanceStore = defineStore('finance', {
    state: (): FinanceState => ({
        transactions: [
        ]
    }),
    getters: {
        totalIncome(state): number {
            return state.transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0)
        },
        totalExpense(state): number {
            return state.transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0)
        },
        balance(state): number {
            return this.totalIncome - this.totalExpense
        },
        recentTransactions(state): Transaction[] {
            return [...state.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
        }
    },
    actions: {
        addTransaction(transaction: Omit<Transaction, 'id'>): void {
            this.transactions.push({
                id: Date.now(),
                ...transaction
            })
        },
        deleteTransaction(id: number): void {
            this.transactions = this.transactions.filter(t => t.id !== id)
        }
    }
})