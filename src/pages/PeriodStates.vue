<template>
  <div class="period-stats-container">
    <div class="header">
      <h2>{{ currentYear }}年经期统计</h2>
      <div class="year-switcher">
        <button @click="changeYear(-1)">← 上一年</button>
        <button @click="changeYear(1)">下一年 →</button>
      </div>
    </div>

    <!-- 关键统计数据 -->
    <div class="key-stats">
      <div class="stat-card">
        <span>平均周期</span>
        <strong>{{ avgCycleDays || '--' }} 天</strong>
      </div>
      <div class="stat-card">
        <span>最长周期</span>
        <strong>{{ maxCycleDays || '--' }} 天</strong>
      </div>
      <div class="stat-card">
        <span>最短周期</span>
        <strong>{{ minCycleDays || '--' }} 天</strong>
      </div>
      <div class="stat-card">
        <span>最常日期</span>
        <strong>{{ mostCommonDates.join('、') || '--' }}</strong>
      </div>
    </div>

    <!-- 单个31天的日历 -->
<div class="monthly-calendar">
  <h3>{{ currentYear }}年经期记录</h3>
  <div class="calendar-grid">
    <!-- 填充空白格子（用于对齐每月的第一天） -->

    <!-- 显示每一天 -->
    <div v-for="day in 31" :key="day" class="day">
      <div 
        class="day-number"
        :class="getDayClass(day)"
        :title="getDayTitle(day)"
      >
        {{ day }}
      </div>
    </div>
  </div>
</div>

    <!-- 周期历史记录 -->
    <div class="cycle-history">
      <h3>周期历史</h3>
      <table>
        <thead>
          <tr>
            <th>序号</th>
            <th>开始日期</th>
            <th>结束日期</th>
            <th>持续天数</th>
            <th>间隔天数</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(cycle, index) in cycleHistory" :key="cycle.startDate">
            <td>{{ index + 1 }}</td>
            <td>{{ cycle.startDate }}</td>
            <td>{{ cycle.endDate }}</td>
            <td>{{ cycle.duration }}</td>
            <td>{{ index > 0 ? cycle.interval : '--' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useTrackStore } from '@/stores/trackStore'
import { format, parseISO, getDaysInMonth as dateFnsGetDaysInMonth, isToday as dateFnsIsToday } from 'date-fns'


const trackStore = useTrackStore()
const currentYear = ref(new Date().getFullYear())

// 获取每一天的经期状态
const dayStatus = computed(() => {
  const status: Record<number, number> = {}; // 用于存储每一天的经期天数

  trackStore.records
    .filter((r: { isPeriod: boolean; date: string }) => r.isPeriod) // 筛选出经期记录
    .forEach((record: { isPeriod: boolean; date: string }) => {
      const date = new Date(record.date);
      const day = date.getDate();
      status[day] = (status[day] || 0) + 1; // 累加经期天数
    });

  return status;
});

// 获取某一天的样式类
const getDayClass = (day: number) => {
  const intensity = dayStatus.value[day] || 0; // 获取经期天数
  if (intensity === 0) return ''; // 非经期
  if (intensity >= 1 && intensity < 3) return 'period-light'; // 经期天数
  if (intensity >= 3 && intensity < 5) return 'period-medium'; // 经期天数为2
  if (intensity >= 5 ) return 'period-dark'; // 经期天数大于2
};
// 获取某一天的提示信息
const getDayTitle = (day: number) => {
  const intensity = dayStatus.value[day] || 0;
  return intensity > 0 ? `经期天数: ${intensity}` : '无经期记录';
};


// 获取所有经期记录并按日期排序
const periodRecords = computed(() => {
  return trackStore.records
    .filter((r: { isPeriod: boolean; date: string }) => r.isPeriod)
    .sort((a: { date: string }, b: { date: string }) => new Date(a.date).getTime() - new Date(b.date).getTime())
})

// 计算周期历史
const cycleHistory = computed(() => {
  const history: {
    startDate: string
    endDate: string
    duration: number
    interval?: number
  }[] = []
  
  let currentCycle: {
      startDate: string
      endDate: string
      days: string[]
  } | null | never = null
  
  periodRecords.value.forEach((record: { date: string }) => {
    const recordDate = record.date
    
    if (!currentCycle) {
      currentCycle = {
        startDate: recordDate,
        endDate: recordDate,
        days: [recordDate]
      }
      return
    }
    
    const lastDate = new Date(currentCycle.endDate)
    const currentDate = new Date(recordDate)
    const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // 如果间隔小于等于2天，视为同一周期
    if (diffDays <= 2) {
      currentCycle.endDate = recordDate
      currentCycle.days.push(recordDate)
    } else {
      // 完成当前周期，开始新周期
      history.push({
        startDate: currentCycle.startDate,
        endDate: currentCycle.endDate,
        duration: currentCycle.days.length,
        interval: diffDays
      })
      
      currentCycle = {
        startDate: recordDate,
        endDate: recordDate,
        days: [recordDate]
      }
    }
  })
  
//   // 添加最后一个周期
//   if (currentCycle) {
//     history.push({
//       startDate: currentCycle.startDate,
//       endDate: currentCycle.endDate,
//       duration: currentCycle.days.length
//     })
//   }
  
  return history
})

// 计算平均周期天数
const avgCycleDays = computed(() => {
  if (cycleHistory.value.length < 2) return null
  
  const intervals = cycleHistory.value
    .slice(1)
    .map(cycle => cycle.interval || 0)
  
  const sum = intervals.reduce((acc, val) => acc + val, 0)
  return Math.round(sum / intervals.length)
})

// 计算最长周期天数
const maxCycleDays = computed(() => {
  if (cycleHistory.value.length < 2) return null
  
  return Math.max(...cycleHistory.value
    .slice(1)
    .map(cycle => cycle.interval || 0))
})

// 计算最短周期天数
const minCycleDays = computed(() => {
  if (cycleHistory.value.length < 2) return null
  
  return Math.min(...cycleHistory.value
    .slice(1)
    .map(cycle => cycle.interval || 0))
})

// 计算最常出现的日期
const mostCommonDates = computed(() => {
  const dateCounts = dayStatus.value
  console.log(dateCounts)
  if (Object.keys(dateCounts).length === 0) return []
  
  const maxCount = Math.max(...Object.values(dateCounts))
  return Object.entries(dateCounts)
    .filter(([_, count]) => count === maxCount)
    .map(([day]) => `${day}日`)
})

// 切换年份
const changeYear = (delta: number) => {
  currentYear.value += delta
}

// 初始化加载数据
onMounted(() => {
  trackStore.loadFromLocalStorage()
})
</script>

<style scoped>
.period-stats-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.year-switcher {
  display: flex;
  gap: 10px;
}

.year-switcher button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.year-switcher button:hover {
  background: #f5f5f5;
}

.key-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
}

.stat-card {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card span {
  display: block;
  color: #666;
  font-size: 14px;
  margin-bottom: 5px;
}

.stat-card strong {
  font-size: 18px;
  font-weight: bold;
}

.monthly-calendar {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 25px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr); /* 一周七天 */
  gap: 5px;
  margin-top: 15px;
}

.month-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.month-header {
  background: #f8f8f8;
  padding: 8px;
  font-weight: bold;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.month-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  padding: 5px;
}

.day {
  text-align: center;
  font-size: 14px;
}
.day-number {
  padding: 10px;
  border-radius: 4px;
  background-color: #f5f5f5;
  transition: background-color 0.3s ease;
}
.period-light {
  background-color: #ffebee; /* 浅粉色 */
}

.period-medium {
  background-color: #f8bbd0; /* 中粉色 */
}

.period-dark {
  background-color: #f48fb1; /* 深粉色 */
}
.period-day {
  background-color: #ffebee;
  color: #d32f2f;
  font-weight: bold;
}

.today {
  border: 1px solid #4CAF50;
}

.cycle-history {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th, td {
  padding: 12px 15px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

th {
  background: #f5f5f5;
  font-weight: 500;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

@media (max-width: 768px) {
  .calendar-grid {
    grid-template-columns: 1fr;
  }
  
  .key-stats {
    grid-template-columns: 1fr 1fr;
  }
}
</style>