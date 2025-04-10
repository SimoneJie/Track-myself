<template>
  <div class="calendar-container">
   
    <!-- 三个功能按钮
    <div class="button-group">
      <el-button type="primary" @click="navigateTo('/weight-stats')">体重统计</el-button>
      <el-button type="success" @click="navigateTo('/finance-stats')">财务统计</el-button>
      <el-button type="danger" @click="navigateTo('/period-stats')">经期统计</el-button>
    </div> -->
    
  <div class="carousel-container">
    <el-carousel :interval="4000" type="card" height="100px" :autoplay = false>
      <el-carousel-item v-for="item in carouselItems" :key="item.title">
        <div class="carousel-card"  @click="navigateTo(item.route)">
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
          
        </div>
      </el-carousel-item>
    </el-carousel>
  </div>

    <!-- 日历头部 -->
    <div class="calendar-header">
      <el-button @click="prevMonth" :icon="ArrowLeft" />
      <span class="month-title">{{ currentMonth }} {{ currentYear }}</span>
      <el-button @click="nextMonth" :icon="ArrowRight" />
    </div>
    
    <!-- 日历网格 -->
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
          'period': isPeriod(day.date)
        }"
        @click="handleDayClick(day)"
      >
        <div class="day-number">{{ day.day }}</div>
        <!-- 添加粉色小圆点 -->
        <div v-if="isPeriod(day.date)" class="period-marker"></div>
        <span 
  v-if="calculateBalance(new Date(day.date)) !== 0" 
  :class="{
    'finance-marker': true,
    'positive-balance': calculateBalance(new Date(day.date)) > 0,
    'negative-balance': calculateBalance(new Date(day.date)) < 0
  }"
>
  {{ calculateBalance(new Date(day.date)) }}元
</span>
        <div class="day-content">
          <div v-if="hasRecord(day.date)" class="day-markers">
            <span v-if="getRecord(day.date)?.weight" class="weight-marker">
              {{ getRecord(day.date)?.weight }}kg
            </span>
           
            <!-- <span v-if="getRecord(day.date)?.income || getRecord(day.date)?.expense" 
                  class="finance-marker">
              ¥{{ (getRecord(day.date)?.income || 0) - (getRecord(day.date)?.expense || 0) }}
            </span> -->
          </div>
        </div>
      </div>
    </div>


    <!-- 日期详情弹窗 -->
   <div v-if="showDialog" class="dialog-overlay" @click.self="closeDialog">
  <el-card shadow="hover">
    <!-- Header 插槽 -->
    <template #header>
      <div class="card-header">
        <h3>{{ selectedDate}}</h3>
      </div>
    </template>

    <!-- Body 内容 -->
    <div class="card-body">
    <div class="dialog-section">
      <label>体重</label>
      <el-input-number v-model.number="currentWeight" style="width: 130px;"><template #suffix>kg</template></el-input-number>
    </div>

    <!-- 财务记录 -->
    <div class="dialog-section">
      <label>收支:</label>
      <el-button 
        :type="calculateBalance(new Date(selectedDate) )>= 0 ? 'success' : 'danger'" 
        @click="navigateToFinance">{{ calculateBalance(new Date(selectedDate) )}}元</el-button>
        
    </div>

    <!-- 经期记录 -->
    <div class="dialog-section">
      <label>经期:</label>
      <el-switch v-model="isPeriodDay" active-color="#e91e63" inactive-color="#ccc" />
    </div>
    </div>
    <template #footer>
      <div class="card-footer">
       <el-button type="primary" @click="saveRecord">保存</el-button>
      <el-button @click="closeDialog">取消</el-button>
      </div>
    </template>
  </el-card>
</div>
  </div>
</template>


<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { useTrackStore } from '@/stores/trackStore'
import { useFinanceStore } from '@/stores/financeStore'
import { storeToRefs } from 'pinia'
import { debounce } from 'lodash'
const trackStore = useTrackStore()
const financeStore = useFinanceStore()
const { balance, income, expense, dailyTransactions } = storeToRefs(financeStore)

onMounted(() => {
    if (trackStore.records.length === 0) {
        trackStore.loadFromLocalStorage()
    }
})
interface CalendarDay {
  day: number
  date: string
  isCurrentMonth: boolean
  isToday?: boolean
}
const carouselItems = ref([
  { title: '体重追踪', description: '查看体重变化趋势', route: '/pages/WeightStates' },
  { title: '账单追踪', description: '管理每日收支记录', route: '/pages/FinanceStates' },
  { title: '经期追踪', description: '记录和分析经期数据', route: '/pages/PeriodStates' }
])
const navigateTo = (path: string) => {
  uni.navigateTo({
    url: path
  })
}
const navigateToFinance = () => {
  uni.navigateTo({
  url: `/pages/DailyFinance?date=${selectedDate.value}`
})
  closeDialog()
}
const currentDate = ref<Date>(new Date())
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
const calculateBalance = (date: Date): number => {
  const day = date.getDate() 
  const month = date.getMonth()
  const year = date.getFullYear() 
  // console.log(year, month, day)
  const record = financeStore.getDailySummary(year, month + 1, day)
  return (record?.income + record.expense || 0)
}

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

// 切换月份 性能优化，限制事件触发频率
const prevMonth = debounce(() => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  )
}, 300)

const nextMonth = debounce(() => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  )
}, 300)

const showDialog = ref(false)
const selectedDate = ref('')
const currentWeight = ref<number | null>(null)
const isPeriodDay = ref(false)
const dailyBalance = ref(0)

const handleDayClick = (day: { date: string, isCurrentMonth: boolean }) => {
  if (!day.isCurrentMonth) return
  
  selectedDate.value = day.date
  const record = trackStore.getRecordByDate(day.date)
  currentWeight.value = record?.weight || null
  isPeriodDay.value = record?.isPeriod || false
  dailyBalance.value = (record?.income || 0) - (record?.expense || 0)
  showDialog.value = true
}

const hasRecord = (date: string) => {
  return trackStore.getRecordByDate(date) !== undefined
}

const getRecord = (date: string) => {
  return trackStore.getRecordByDate(date)
}

const isPeriod = (date: string) => {
  return trackStore.getRecordByDate(date)?.isPeriod
}

const saveRecord = () => {
  trackStore.addRecord({
    date: selectedDate.value,
    weight: currentWeight.value || undefined,
    isPeriod: isPeriodDay.value
  })
  closeDialog()
}





const closeDialog = () => {
  showDialog.value = false
}
</script>

<style scoped>
/* 基础变量 */
:root {
  --calendar-max-width: 90vw;
  --day-cell-size: min(12vw, 4rem);
  --header-font-size: clamp(1rem, 4vw, 1.5rem);
  --day-font-size: clamp(0.8rem, 3vw, 1rem);
  --button-padding: clamp(0.5rem, 2vw, 1rem);
  --calendar-bg: #fff;
  --border-color: #e0e0e0;
  --primary-color: #42b983;
  --secondary-color: #f5f5f5;
  --text-color: #333;
  --disabled-color: #ddd;
  --hover-color: #f0f0f0;
}
:deep(.is-checked .el-switch__core) {
  background-color: #e91e63;
  border-color: #e91e63;
}
h2#title {
  font-size: 2.3rem;
  text-align: center;
  margin: 0  0  2rem 0;
  color: var(--text-color);
  font-weight: 550;
  font-family: 'Times New Roman', serif;
  position: relative;
  /* padding: 0.5rem 0; */
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
  letter-spacing: 1px;
}
/* 按钮组样式 */
.button-group {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.dialog-section label {
  /* display: block; */
  margin-right: 0.5rem;
  font-size: var(--header-font-size);
  color: var(--text-color);
}
.period-marker {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 8px;
  height: 8px;
  background-color: #e91e63; /* 粉色 */
  border-radius: 50%;
  z-index: 2;
}

.button-group button {
  padding: 1rem 1rem;
  margin: auto;
  font-size: 1rem;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.button-group button:hover {
  background-color: darken(var(--primary-color), 10%);
}

/* 日历容器 - 纸张效果 */
.calendar-container {
  width: 100%;
  max-width: var(--calendar-max-width);
  margin: 0 auto;
  padding: 1.5rem;
  box-sizing: border-box;
  background-color: var(--calendar-bg);
  border-radius: 12px;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
  display: block; /* 确保父元素可见 */
  visibility: visible;
}

/* 添加日历穿孔效果 */
.calendar-container::before {
  content: "";
  position: absolute;
  top: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: 30%;
  height: 0.5rem;
  /* background-color: var(--calendar-bg); */
   background-color: rgb(210, 215, 131) !important; /* 临时改为醒目颜色测试 */
  border-bottom: 1px solid var(--border-color);
  border-radius: 0 0 50% 50%;
  z-index: 1;
}

/* 日历头部 */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  position: relative;
}

/* 月份标题装饰 */
.month-title {
  font-size: 1.5rem;
  font-weight: bold;
  flex-grow: 1;
  text-align: center;
  min-width: 60%;
  color: var(--text-color);
  position: relative;
  /* padding: 0.5rem 0; */
}

.month-title::after {
  content: "";
  position: absolute;
  bottom: -1rem;
  left: 50%;
  transform: translateX(-50%);
  width: 3rem;
  height: 3px;
  background-color: var(--primary-color);
  border-radius: 3px;
}

/* 按钮样式 */
/* button {
  padding: var(--button-padding);

  border: none;
  border-radius: 6px;
  background-color: var(--primary-color);
  color: black;
  font-size: 1.5rem;
  min-width: 3rem;
  min-height: 2.5rem;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
} */


button:hover {
  background-color: darken(#42b983, 10%);
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

button:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 日历网格 */
.calendar-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}
.custom-card {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.2rem;
  font-weight: bold;
  /* padding: 5px 5px; */
  /* background-color: #f1fc8f; */
  /* border-bottom: 1px solid #e0e0e0; */
}

.card-body {
  /* padding: 15px; */
  font-size: 1rem;
  color: #666;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  /* padding: 10px 15px; */
  /* border-top: 1px solid #e0e0e0; */
}
/* 星期标题样式 */
.day-header {
  text-align: center;
  font-weight: bold;
  /* padding: 0.5rem 0; */
  font-size: var(--day-font-size);
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px dashed var(--border-color);
}

/* 周末特殊样式 */
.day-header:first-child,
.day-header:last-child {
  color: #e74c3c;
}

/* 日期单元格 */
.calendar-day {
  aspect-ratio: 1/1;
  min-height: var(--day-cell-size);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: white;
  position: relative;
  overflow: hidden;
}

/* 当前月日期 */
.calendar-day.current-month {
  background-color: white;
  color: var(--text-color);
}

/* 非当前月日期 */
.calendar-day:not(.current-month) {
  background-color: var(--secondary-color);
  color: var(--disabled-color);
}

/* 今天日期特殊样式 */
.calendar-day.today {
  border: 2px solid var(--primary-color);
  background-color: rgba(66, 185, 131, 0.1);
}

.calendar-day.today .day-number {
  font-weight: bold;
  color: var(--primary-color);
}

/* 悬停效果 */
.calendar-day:hover {
  background-color: var(--hover-color);
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 点击效果 */
.calendar-day:active {
  transform: translateY(0);
  box-shadow: none;
}

/* 日期数字 */
.day-number {
  font-size: var(--day-font-size);
  margin-bottom: 0.1rem;
  font-weight: 500;
  z-index: 1;
}
.button-group {
  display: flex;
  gap: 10px; /* 按钮间距 */
  justify-content: flex-end; /* 整体右对齐 */
}
/* 周末日期特殊样式 */
.calendar-day:nth-child(7n + 1),
.calendar-day:nth-child(7n) {
  background-color: rgba(231, 76, 60, 0.05);
}

.calendar-day:nth-child(7n + 1):not(.current-month),
.calendar-day:nth-child(7n):not(.current-month) {
  background-color: rgba(231, 76, 60, 0.03);
}

/* 日期内容区域 */
.day-content {
  width: 100%;
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.8em;
  z-index: 1;
}

/* 大屏幕优化 */
@media (min-width: 768px) {
  :root {
    --calendar-max-width: 40rem;
    --day-cell-size: 3.5rem;
  }
  
  .calendar-grid {
    gap: 0.75rem;
  }
  
  .calendar-day {
    padding: 0.5rem;
  }
  
  .day-header {
    padding: 0.75rem 0;
  }
}

/* 小屏幕优化 */
@media (max-width: 480px) {
  .calendar-header {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .month-title {
    order: -1;
    width: 100%;
  }
  
  button {
    min-width: 2.5rem;
    min-height: 2rem;
  }
  
  .calendar-container {
    padding: 1rem;
  }
  
  .calendar-container::before {
    width: 40%;
  }
}

.day-markers {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.7rem;
}

.weight-marker {
  color: #335e8c;
  background: rgba(23, 54, 90, 0.1);
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 0.8rem;
}


.finance-marker {
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 0.8rem;
}
.positive-balance {
  color: #4CAF50; /* 绿色 */
  background: rgba(76, 175, 80, 0.1); /* 浅绿色背景 */
}

.negative-balance {
  color: #F44336; /* 红色 */
  background: rgba(244, 67, 54, 0.1); /* 浅红色背景 */
}
.period {
  background: rgba(233, 30, 99, 0.1);
  border: 1px solid rgba(233, 30, 99, 0.3);
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.day-dialog {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
}

.dialog-section {
  margin: 15px 0;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.carousel-container {
  width: 100%;
  /* max-width: 600px; */
  /* margin: 0 0; */
  height: 13vh;
}

.carousel-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  padding: 0px;
}

.carousel-card h3 {
  font-size: 1.5rem;
  color: #42b983;
  margin-bottom: 3px;
}

.carousel-card p {
  font-size: 1rem;
  color: #666;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #e91e63;
}

input:checked + .slider:before {
  transform: translateX(26px);
}
</style>