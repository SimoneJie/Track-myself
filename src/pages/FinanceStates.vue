<template>
  <div class="stats-container">
    <div class="header">
      <h2 v-if="!showYearView">{{ currentYear }}年{{ currentMonth }}月财务统计</h2>
      <h2 v-else>{{ currentYear }}年财务统计</h2>
      <div class="time-switcher">
        <button @click="changeMonth(-1, showYearView)">{{ showYearView ? '← 上年' : '← 上月' }}</button>
        <button @click="showYearView = !showYearView">
          {{ showYearView ? '返回月视图' : '查看年度统计' }}
        </button>
        <button @click="changeMonth(1, showYearView)">{{ showYearView ? '下年 →' : '下月 →' }}</button>
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
        <div ref="dailyChart" style="width: 100%; height: 400px;"></div>
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
        <div ref="monthlyChart" style="width: 100%; height: 400px;"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useFinanceStore } from '@/stores/financeStore'

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
  
const changeMonth = (delta: number, year: boolean) => {
  currentDate.value = new Date(
    currentDate.value.getFullYear() + (year ? delta : 0),
    currentDate.value.getMonth() + delta,
    1
  )
}

// 图表相关
const dailyChart = ref<HTMLDivElement | null>(null)
const monthlyChart = ref<HTMLDivElement | null>(null)
let dailyChartInstance: echarts.ECharts | null = null
let monthlyChartInstance: echarts.ECharts | null = null

const renderDailyChart = () => {
  if (!dailyChart.value) {
    console.error('Daily chart container is not ready')
    return
  }

  if (dailyChartInstance) {
    dailyChartInstance.dispose() // 销毁旧实例
    dailyChartInstance = null
  }
 
  // 创建新的实例
  dailyChartInstance = echarts.init(dailyChart.value)
  const option = {
    title: {
      text: '每日收支趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 31 }, (_, i) => `${i + 1}日`)
    },
    yAxis: {
      type: 'value',
      name: '金额 (¥)'
    },
    series: [
      {
        name: '收入',
        type: 'bar',
        data: dailyIncome, 
        itemStyle: {
          color: '#4CAF50'
        }
      },
      {
        name: '支出',
        type: 'bar',
        data: dailyExpense, 
        itemStyle: {
          color: '#F44336'
        }
      }
    ]
  }

  dailyChartInstance.setOption(option)
}

const renderMonthlyChart = () => {
  if (!monthlyChart.value) {
    return
  }

  if (monthlyChartInstance) {
    monthlyChartInstance.dispose() // 销毁旧实例
    monthlyChartInstance = null
  }
 
  // 创建新的实例
  monthlyChartInstance = echarts.init(monthlyChart.value)

  const option = {
    title: {
      text: '月度收支趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: {
      type: 'value',
      name: '金额 (¥)'
    },
    series: [
      {
        name: '月收入',
        type: 'line',
        data: yearlyData.value.monthlyData.map(m => m.income),
        itemStyle: {
          color: '#4CAF50'
        },
        areaStyle: {
          color: 'rgba(76, 175, 80, 0.1)'
        }
      },
      {
        name: '月支出',
        type: 'line',
        data: yearlyData.value.monthlyData.map(m => m.expense),
        itemStyle: {
          color: '#F44336'
        },
        areaStyle: {
          color: 'rgba(244, 67, 54, 0.1)'
        }
      },
      {
        name: '月结余',
        type: 'line',
        data: yearlyData.value.monthlyData.map(m => m.balance),
        itemStyle: {
          color: '#2196F3'
        },
        areaStyle: {
          color: 'rgba(33, 150, 243, 0.1)'
        }
      }
    ]
  }

  monthlyChartInstance.setOption(option)
}

onMounted(() => {
  nextTick(() => {
    renderDailyChart()
    if(showYearView.value){
      renderMonthlyChart()}
  })
})

watch([monthlyData, showYearView], () => {
  nextTick(() => {
    if (!showYearView.value) {
      if (dailyChart.value) {
        renderDailyChart()
      } else {
        console.error('Daily chart container is not ready after view switch')
      }
    } else {
      if (monthlyChart.value) {
        renderMonthlyChart()
      } else {
        console.error('Monthly chart container is not ready after view switch')
      }
    }
  })
}, { deep: true })
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