<template>
  <div class="calendar-container">
    <h2 class="title">日历</h2>
    <div class="calendar-header">
      <button @click="prevMonth" class="prev-month">上个月</button>
      <span class="month-title">{{ currentMonth }} {{ currentYear }}</span>
      <button @click="nextMonth" class="next-month">下个月</button>
    </div>
    
    <div class="calendar-grid">
      <div class="day-header" v-for="day in dayNames" :key="day">
        {{ day }}
      </div>
      
      <div 
        v-for="day in calendarDays" 
        :key="day.date"
        class="calendar-day"
        :class="{
          'current-month': day.isCurrentMonth,
          'today': day.isToday,
          'has-record': hasWeightRecord(day.date)
        }"
        @click="openWeightDialog(day)"
      >
        <div class="day-number">{{ day.day }}</div>
        <div class="weight-record" v-if="hasWeightRecord(day.date)">
          {{ weightRecords[day.date] }} kg
        </div>
      </div>
    </div>
    
    <!-- 体重输入对话框 -->
    <div class="dialog-overlay" v-if="showDialog" @click.self="closeDialog">
      <div class="weight-dialog">
        <h3>记录体重 - {{ selectedDate }}</h3>
        <input 
          type="number" 
          v-model="currentWeight" 
          placeholder="输入体重(kg)" 
          step="0.1"
          min="30"
          max="200"
        >
        <div class="dialog-buttons">
          <button @click="saveWeight">保存</button>
          <button @click="removeWeight" v-if="hasWeightRecord(selectedDate)">删除</button>
          <button @click="closeDialog">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'

interface CalendarDay {
  day: number
  date: string
  isCurrentMonth: boolean
  isToday?: boolean
}

interface WeightRecords {
  [date: string]: number
}

const currentDate = ref<Date>(new Date())
const showDialog = ref<boolean>(false)
const selectedDate = ref<string>('')
const currentWeight = ref<string>('')
const weightRecords = ref<WeightRecords>({})

// 星期名称
const dayNames: string[] = ['日', '一', '二', '三', '四', '五', '六']

// 当前年月显示
const currentMonth = computed<string>(() => {
  return currentDate.value.toLocaleString('zh-CN', { month: 'long' })
})

const currentYear = computed<number>(() => {
  return currentDate.value.getFullYear()
})

// 生成日历天数数组
const calendarDays = computed<CalendarDay[]>(() => {
  const year: number = currentDate.value.getFullYear()
  const month: number = currentDate.value.getMonth()
  
  // 当月第一天
  const firstDay: Date = new Date(year, month, 1)
  // 当月最后一天
  const lastDay: Date = new Date(year, month + 1, 0)
  // 上个月最后几天
  const prevLastDay: Date = new Date(year, month, 0)
  // 下个月前几天
  const nextFirstDay: Date = new Date(year, month + 1, 1)
  
  const days: CalendarDay[] = []
  
  // 添加上个月最后几天
  const prevDays: number = firstDay.getDay()
  for (let i = prevDays > 0 ? prevDays - 1 : 6; i >= 0; i--) {
    const day: number = prevLastDay.getDate() - i
    days.push({
      day,
      date: formatDate(new Date(year, month - 1, day)),
      isCurrentMonth: false
    })
  }
  
  // 添加当月天数
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date: Date = new Date(year, month, day)
    days.push({
      day,
      date: formatDate(date),
      isCurrentMonth: true,
      isToday: isToday(date)
    })
  }
  
  // 添加下个月前几天
  const nextDays: number = 7 - lastDay.getDay() - 1
  for (let day = 1; day <= nextDays; day++) {
    days.push({
      day,
      date: formatDate(new Date(year, month + 1, day)),
      isCurrentMonth: false
    })
  }
  
  return days
})

// 从本地存储加载数据
onMounted(() => {
  const savedRecords: string | null = localStorage.getItem('weightRecords')
  if (savedRecords) {
    weightRecords.value = JSON.parse(savedRecords) as WeightRecords
  }
})

// 判断是否是今天
const isToday = (date: Date): boolean => {
  const today: Date = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

// 格式化日期为YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year: number = date.getFullYear()
  const month: string = String(date.getMonth() + 1).padStart(2, '0')
  const day: string = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 切换月份
const prevMonth = (): void => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  )
}

const nextMonth = (): void => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  )
}

// 打开体重输入对话框
const openWeightDialog = (day: CalendarDay): void => {
  if (!day.isCurrentMonth) return
  
  selectedDate.value = day.date
  currentWeight.value = weightRecords.value[day.date]?.toString() || ''
  showDialog.value = true
}

// 关闭对话框
const closeDialog = (): void => {
  showDialog.value = false
}

// 保存体重记录
const saveWeight = (): void => {
  if (currentWeight.value) {
    const weight: number = parseFloat(currentWeight.value)
    if (!isNaN(weight)) {
      weightRecords.value[selectedDate.value] = weight
      localStorage.setItem('weightRecords', JSON.stringify(weightRecords.value))
      closeDialog()
    }
  }
}

// 删除体重记录
const removeWeight = (): void => {
  delete weightRecords.value[selectedDate.value]
  localStorage.setItem('weightRecords', JSON.stringify(weightRecords.value))
  closeDialog()
}

// 检查某天是否有体重记录
const hasWeightRecord = (date: string): boolean => {
  return date in weightRecords.value
}
</script>

<style scoped>
/* 基础样式 */
.calendar-container {
  width: 100%;
  max-width: 400px; 
  margin: 0 auto;
  padding: 10px;
  box-sizing: border-box;
}

.title {
  margin: 50px 0;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  grid-template-columns: 1fr auto 1fr; /* 三列布局 */
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  /* gap: 15px; */
}

.prev-month {
  grid-column: 1; /* 左列 */
  justify-self: start; /* 左对齐 */
}

.next-month {
  grid-column: 3; /* 右列 */
  justify-self: end; /* 右对齐 */
}

.month-title {
  font-size: 1.3rem;
  font-weight: bold;
  flex-grow: 1;
  text-align: center;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background-color: #42b983;
  color: white;
  font-size: 14px;
  min-width: 44px;
  min-height: 44px;
}

.calendar-grid {
  display: grid;
  max-width: 400px;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
}

.day-header {
  text-align: center;
  font-weight: bold;
  padding: 8px 0;
  font-size: 14px;
}

.calendar-day {
  width: 35px;  /* 固定宽度 */
  height: 35px; /* 固定高度 */
  aspect-ratio: 1/1;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 5px;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.calendar-day.current-month {
  background-color: white;
}

.calendar-day:not(.current-month) {
  background-color: #f9f9f9;
  color: #aaa;
}

.calendar-day.today {
  border: 2px solid #42b983;
}

.calendar-day.has-record {
  background-color: #e8f5e9;
}

.day-number {
  font-size: 14px;
  margin-bottom: 2px;
}

.weight-record {
  font-size: 12px;
  color: #42b983;
  font-weight: bold;
  word-break: break-all;
  text-align: center;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 15px;
  box-sizing: border-box;
}

.weight-dialog {
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  width: 100%;
  max-width: 300px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.weight-dialog h3 {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
}

.weight-dialog input {
  width: 100%;
  height: 30px;
  /* padding: 12px; */
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.dialog-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.dialog-buttons button {
  flex: 1;
  padding: 10px;
}

.dialog-buttons button:first-child {
  background-color: #42b983;
}

.dialog-buttons button:last-child {
  background-color: #f44336;
}

/* 响应式调整 */
@media (min-width: 768px) {
  body {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 20px;
    background: #f5f5f5;
  }
}
</style>
