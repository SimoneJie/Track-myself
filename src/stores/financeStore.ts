import { defineStore } from 'pinia'

interface Transaction {
    id: string
    date: string
    text: string
    amount: number
    type: 'income' | 'expense'
}

export const useFinanceStore = defineStore('finance', {
    state: () => {
        const state = {
            transactions: [] as Transaction[],
            currentDate: new Date().toISOString().split('T')[0] // YYYY-MM-DD
        }

        // 数据持久化 - 从 localStorage 加载数据
        if (localStorage.getItem('financeTransactions')) {
            state.transactions = JSON.parse(localStorage.getItem('financeTransactions') || '[]')
        }

        return state
    },
    actions: {
        addTransaction(transaction: Omit<Transaction, 'id'>) {
            this.transactions.push({
                id: Date.now().toString(),
                ...transaction
            })
            localStorage.setItem('financeTransactions', JSON.stringify(this.transactions))
        },
        deleteTransaction(id: string) {
            this.transactions = this.transactions.filter(t => t.id !== id)
            localStorage.setItem('financeTransactions', JSON.stringify(this.transactions))
        },
        setCurrentDate(date: string) {
            this.currentDate = date
        },
        getDailySummary(year: number, month: number, day: number) {
            const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dailyTransactions = this.transactions.filter(t => t.date === date)

            const income = dailyTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0)

            const expense = dailyTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0)

            return {
                income,
                expense,
                balance: income - expense
            }
        },
        getMonthlySummary(year: number, month: number) {
            const filtered = this.transactions.filter(t => {
                const d = new Date(t.date)
                return d.getFullYear() === year && d.getMonth() + 1 === month
            })

            return {
                income: filtered.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
                expense: filtered.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
                transactions: filtered

            }
        },

        getYearlySummary(year: number) {
            const filtered = this.transactions.filter(t => {
                return new Date(t.date).getFullYear() === year
            })

            return {
                income: filtered.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
                expense: filtered.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
                monthlyData: Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1
                    const monthly = this.getMonthlySummary(year, month)
                    return {
                        month,
                        income: monthly.income,
                        expense: monthly.expense,
                        balance: monthly.income - monthly.expense
                    }
                })
            }
        }
    },

    getters: {
        balance(): number {
            return this.transactions.reduce((sum, t) => sum + t.amount, 0)
        },
        income(): number {
            return this.transactions
                .filter(t => t.amount > 0)
                .reduce((sum, t) => sum + t.amount, 0)
        },
        expense(): number {
            return this.transactions
                .filter(t => t.amount < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0)
        },
        dailyTransactions(): Transaction[] {
            return this.transactions
                .filter(t => t.date === this.currentDate)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        }
    },


}
)