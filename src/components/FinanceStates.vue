<template>
  <div class="stats-container">
    <div class="header">
      <h2 v-if="!showYearView">{{ currentYear }}年{{ currentMonth }}月财务统计</h2>
      <h2 v-else>{{ currentYear }}年财务统计</h2>
      <div class="time-switcher">
        <button @click="changeMonth(-1, showYearView)">{{showYearView?'← 上年':'← 上月'}} </button>
        <button @click="showYearView = !showYearView">
          {{ showYearView ? '返回月视图' : '查看年度统计' }}
        </button>
        <button @click="changeMonth(1, showYearView)">{{showYearView?'下年 →':'下月 →'}}</button>
      </div>
    </div>

    <!-- 月视图 -->
    <div v-if="!showYearView" class="month-view">
      <div class="summary-cards">
        <div class="summary-card income">
          <h3>总收入</h3>
          <p>¥ {{ monthlyData.income.toLocaleString() }}</p>
        </div>
        <div class="summary-card expense">
          <h3>总支出</h3>
          <p>¥ {{ monthlyData.expense.toLocaleString() }}</p>
        </div>
        <div class="summary-card balance">
          <h3>结余</h3>
          <p>¥ {{ (monthlyData.income - monthlyData.expense).toLocaleString() }}</p>
        </div>
      </div>

      <div class="chart-container">
        <h3>每日收支趋势</h3>
        <canvas ref="dailyChart"></canvas>
      </div>
    </div>

    <!-- 年视图 -->
    <div v-else class="year-view">
      <div class="summary-cards">
        <div class="summary-card income">
          <h3>年收入</h3>
          <p>¥ {{ yearlyData.income.toLocaleString() }}</p>
        </div>
        <div class="summary-card expense">
          <h3>年支出</h3>
          <p>¥ {{ yearlyData.expense.toLocaleString() }}</p>
        </div>
        <div class="summary-card balance">
          <h3>年结余</h3>
          <p>¥ {{ (yearlyData.income - yearlyData.expense).toLocaleString() }}</p>
        </div>
      </div>

      <div class="chart-container">
        <h3>月度收支趋势</h3>
        <canvas ref="monthlyChart"></canvas>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useFinanceStore } from '@/stores/financeStore'
import { storeToRefs } from 'pinia'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const financeStore = useFinanceStore()
const currentDate = ref(new Date())
const showYearView = ref(false)

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth() + 1)

const monthlyData = computed(() => {
  return financeStore.getMonthlySummary(currentYear.value, currentMonth.value)
})

const yearlyData = computed(() => {
  return financeStore.getYearlySummary(currentYear.value)
})

const changeMonth = (delta: number, year:boolean) => {
  currentDate.value = new Date(
    currentDate.value.getFullYear() + (year ? delta : 0),
    currentDate.value.getMonth() + delta,
    1
  )
}

// 图表相关
const dailyChart = ref<HTMLCanvasElement | null>(null)
const monthlyChart = ref<HTMLCanvasElement | null>(null)
let dailyChartInstance: Chart | null = null
let monthlyChartInstance: Chart | null = null

const renderDailyChart = () => {
  if (!dailyChart.value) return
  
  // 按日分组数据
  const daysInMonth = new Date(
    currentYear.value, 
    currentMonth.value, 
    0
  ).getDate()
  
  const dailyIncome = Array(daysInMonth).fill(0)
  const dailyExpense = Array(daysInMonth).fill(0)
  
  monthlyData.value.transactions.forEach(t => {
    const day = new Date(t.date).getDate() - 1
    if (t.amount > 0) {
      dailyIncome[day] += t.amount
    } else {
      dailyExpense[day] += Math.abs(t.amount)
    }
  })
  
  if (dailyChartInstance) {
    dailyChartInstance.destroy()
  }
  
  dailyChartInstance = new Chart(dailyChart.value, {
    type: 'bar',
    data: {
      labels: Array.from({length: daysInMonth}, (_, i) => `${i + 1}日`),
      datasets: [
        {
          label: '收入',
          data: dailyIncome,
          backgroundColor: '#4CAF50',
          borderColor: '#4CAF50',
          borderWidth: 1
        },
        {
          label: '支出',
          data: dailyExpense,
          backgroundColor: '#F44336',
          borderColor: '#F44336',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '金额 (¥)'
          }
        },
        x: {
          title: {
            display: true,
            text: '日期'
          }
        }
      }
    }
  })
}

const renderMonthlyChart = () => {
  if (!monthlyChart.value) return
  
  if (monthlyChartInstance) {
    monthlyChartInstance.destroy()
  }
  
  monthlyChartInstance = new Chart(monthlyChart.value, {
    type: 'line',
    data: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      datasets: [
        {
          label: '月收入',
          data: yearlyData.value.monthlyData.map(m => m.income),
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: '月支出',
          data: yearlyData.value.monthlyData.map(m => m.expense),
          borderColor: '#F44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: '月结余',
          data: yearlyData.value.monthlyData.map(m => m.balance),
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: '金额 (¥)'
          }
        }
      }
    }
  })
}

// 监听数据变化重新渲染图表
watch([monthlyData, showYearView], () => {
  if (!showYearView.value) {
    nextTick(() => renderDailyChart())
  } else {
    nextTick(() => renderMonthlyChart())
  }
}, { deep: true })

onMounted(() => {
  renderDailyChart()
})
</script>

<style scoped>
.stats-container {
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
  gap: 10px;
}

.time-switcher {
  display: flex;
  gap: 10px;
}

.time-switcher button {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.time-switcher button:hover {
  background: #f5f5f5;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.summary-card h3 {
  margin-top: 0;
  color: #666;
}

.summary-card p {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 0;
}

.summary-card.income {
  border-top: 4px solid #4CAF50;
}

.summary-card.expense {
  border-top: 4px solid #F44336;
}

.summary-card.balance {
  border-top: 4px solid #2196F3;
}

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.chart-container h3 {
  margin-top: 0;
  text-align: center;
}

canvas {
  width: 100% !important;
  height: 400px !important;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>