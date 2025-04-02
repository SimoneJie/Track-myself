import { defineStore } from 'pinia'
import { format, subDays, eachDayOfInterval, getDaysInMonth } from 'date-fns'
export interface Record {
    date: string
    weight?: number
    isPeriod?: boolean
    income?: number
    expense?: number
}

export const useTrackStore = defineStore('track', {
    state: () => {
        const storedRecords = localStorage.getItem('records')
        return {
            records: storedRecords ? JSON.parse(storedRecords) : [] as Record[],
            currentMonth: new Date().getMonth() + 1,
            currentYear: new Date().getFullYear(),
            last7DaysRecords: [],
            monthlyRecords: [],
        }
    },
    actions: {
        addRecord(record: Record) {
            const existing = this.records.find((r: Record) => r.date === record.date)
            if (existing) {
                Object.assign(existing, record)
            } else {
                this.records.push(record)
            }
            localStorage.setItem('records', JSON.stringify(this.records))
        },
        deleteRecord(date: string) {
            this.records = this.records.filter((r: Record) => r.date !== date)
            // 同步到 localStorage
            localStorage.setItem('records', JSON.stringify(this.records))
        },
        setCurrentMonth(year: number, month: number) {
            this.currentYear = year
            this.currentMonth = month
        },
        // 从localStorage加载数据
        loadFromLocalStorage() {
            const storedRecords = localStorage.getItem('records');
            if (storedRecords) {
                this.records = JSON.parse(storedRecords);
            }
        },
        // 获取指定月份的完整数据（包括没有记录的日期）
        getMonthlyWeightData(year: number, month: number) {
            const daysInMonth = getDaysInMonth(new Date(year, month - 1))
            const monthStr = month.toString().padStart(2, '0')

            return Array.from({ length: daysInMonth }, (_, i) => {
                const day = (i + 1).toString().padStart(2, '0')
                const date = `${year}-${monthStr}-${day}`
                const record = this.records.find((r: Record) => r.date === date)
                return {
                    date,
                    day: i + 1,
                    weight: record?.weight,
                    hasRecord: !!record?.weight
                }
            })
        }
    },
    getters: {
        getRecordByDate: (state) => (date: string) => {
            return state.records.find((r: Record) => r.date === date)
        },
        // 当前月份的体重数据（用于日历显示）
        currentMonthWeightRecords: (state) => {
            return state.records.filter((r: Record) => {
                const d = new Date(r.date)
                return d.getFullYear() === state.currentYear &&
                    d.getMonth() + 1 === state.currentMonth
            })
        },
    }
})