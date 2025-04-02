import { defineStore } from 'pinia'
import { format, subDays, eachDayOfInterval } from 'date-fns'

interface WeightRecord {
  date: string // YYYY-MM-DD
  weight: number
}

export const useWeightStore = defineStore('weight', {
  state: () => {
    const records = localStorage.getItem('weightRecords')
    return {
      records: records ? JSON.parse(records) : [] as WeightRecord[]
    }
  },
  actions: {
    addRecord(record: WeightRecord) {
      const existing = this.records.find((r: WeightRecord) => r.date === record.date) // Explicitly type 'r'
      if (existing) {
        existing.weight = record.weight
      } else {
        this.records.push(record)
      }
      // Sync to localStorage
      localStorage.setItem('weightRecords', JSON.stringify(this.records))
    },
    deleteRecord(date: string) {
      this.records = this.records.filter((r: WeightRecord) => r.date !== date) // Explicitly type 'r'
      // Sync to localStorage
      localStorage.setItem('weightRecords', JSON.stringify(this.records))
    },
    // 获取最近7天数据（包括没有记录的日期）
    getLast7DaysRecords() {
      const dates = eachDayOfInterval({
        start: subDays(new Date(), 6),
        end: new Date()
      }).map(date => format(date, 'yyyy-MM-dd'))

      return dates.map(date => {
        const record = this.records.find((r: WeightRecord) => r.date === date)
        return {
          date,
          weight: record?.weight || null
        }
      })
    },
    // 获取当月数据
    getCurrentMonthRecords(year: number, month: number) {
      const daysInMonth = new Date(year, month, 0).getDate()
      const monthStr = month.toString().padStart(2, '0')

      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = (i + 1).toString().padStart(2, '0')
        const date = `${year}-${monthStr}-${day}`
        const record = this.records.find((r: WeightRecord) => r.date === date)
        return {
          date,
          day: i + 1,
          weight: record?.weight || null
        }
      })
    }
  }
})