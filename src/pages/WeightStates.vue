<template>
  <div class="monthly-weight-view">
    <div class="header">
      <h2>{{ currentYear }}年{{ currentMonth }}月体重统计</h2>
      <div class="month-switcher">
        <button @click="changeMonth(-1)">← 上月</button>
        <button @click="changeMonth(1)">下月 →</button>
      </div>
    </div>

    <!-- 统计摘要 -->
    <div class="summary">
      <div class="stat-card">
        <span>记录天数</span>
        <strong>{{ recordedDays }}</strong>
      </div>
      <div class="stat-card">
        <span>月平均</span>
        <strong>{{ monthlyAvg.toFixed(1) }} kg</strong>
      </div>
      <div class="stat-card">
        <span>月变化</span>
        <strong :class="changeClass">{{ monthlyChange }}</strong>
      </div>
    </div>

    <!-- 体重趋势图 -->
    <div class="chart-container">
      <div ref="weightChart" style="width: 100%; height: 350px;"></div>
    </div>

    <!-- 每日数据表格 -->
    <div class="daily-data">
      <h3>每日体重记录</h3>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>日期</th>
              <th>体重(kg)</th>
              <th>日变化</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(day, index) in monthlyData" :key="day.date">
              <td>{{ day.day }}日</td>
              <td :class="{ 'no-data': !day.hasRecord }">
                {{ day.weight?.toFixed(1) || '--' }}
              </td>
              <td :class="getDayChangeClass(index)">
                {{ getDayChange(index) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useTrackStore } from '@/stores/trackStore'
import * as echarts from 'echarts'

const trackStore = useTrackStore()
const currentDate = ref(new Date())
const weightChart = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

// 当前年月
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth() + 1)

// 获取当月数据
const monthlyData = computed(() => {
  return trackStore.getMonthlyWeightData(currentYear.value, currentMonth.value)
})

// 记录天数
const recordedDays = computed(() => {
  return monthlyData.value.filter(day => day.hasRecord).length
})

// 月平均体重
const monthlyAvg = computed(() => {
  const records = monthlyData.value.filter(day => day.hasRecord)
  if (records.length === 0) return 0
  return records.reduce((sum, day) => sum + day.weight!, 0) / records.length
})

// 月变化（月初到月末）
const monthlyChange = computed(() => {
  const records = monthlyData.value.filter(day => day.hasRecord)
  if (records.length < 2) return '--'
  
  const first = records[0].weight!
  const last = records[records.length - 1].weight!
  const change = last - first
  return `${change > 0 ? '+' : ''}${change.toFixed(1)} kg`
})

// 变化样式
const changeClass = computed(() => {
  if (monthlyChange.value === '--') return ''
  return monthlyChange.value.includes('+') ? 'increase' : 'decrease'
})

// 获取单日变化
const getDayChange = (index: number) => {
  if (index === 0 || !monthlyData.value[index].hasRecord) return '--'
  
  const prevDay = monthlyData.value[index - 1]
  if (!prevDay.hasRecord) return '--'
  
  const change = monthlyData.value[index].weight! - prevDay.weight!
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}`
}

// 获取单日变化样式
const getDayChangeClass = (index: number) => {
  const change = getDayChange(index)
  if (change === '--') return ''
  return change.includes('+') ? 'increase' : 'decrease'
}

// 切换月份
const changeMonth = (delta: number) => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + delta,
    1
  )
  trackStore.setCurrentMonth(currentYear.value, currentMonth.value)
}

// 渲染 ECharts 图表
const renderChart = () => {
  if (!weightChart.value) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(weightChart.value)

  const labels = monthlyData.value.map(day => `${day.day}日`)
  const weights = monthlyData.value.map(day => day.weight ?? null)
  const hasDataPoints = monthlyData.value.map(day => day.hasRecord)

  const option = {
    title: {
      text: '体重趋势图',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0].data
        return data ? `${params[0].axisValue}<br/>体重: ${data} kg` : `${params[0].axisValue}<br/>无记录`
      }
    },
    xAxis: {
      type: 'category',
      data: labels,
      name: '日期'
    },
    yAxis: {
      type: 'value',
      name: '体重 (kg)',
      min: 35,
      max: 100
    },
    series: [
      {
        name: '体重 (kg)',
        type: 'line',
        data: weights,
        smooth: true,
        lineStyle: {
          color: '#4CAF50'
        },
        areaStyle: {
          color: 'rgba(76, 175, 80, 0.1)'
        },
        itemStyle: {
          color: '#4CAF50'
        },
        symbolSize: (value: any, params: any) => (hasDataPoints[params.dataIndex] ? 6 : 0)
      }
    ]
  }

  chartInstance.setOption(option)
}

// 监听月份变化重新渲染图表
watch([currentYear, currentMonth], () => {
  nextTick(renderChart)
})

// 初始化
onMounted(() => {
  trackStore.loadFromLocalStorage()
  renderChart()
})
</script>

<style scoped>
.monthly-weight-view {
  max-width: 900px;
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

.month-switcher {
  display: flex;
  gap: 10px;
}

.month-switcher button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.month-switcher button:hover {
  background: #f5f5f5;
}

.summary {
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
  font-size: 20px;
  font-weight: bold;
}

.increase {
  color: #f44336;
}

.decrease {
  color: #4CAF50;
}

.chart-container {
  height: 350px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  margin-bottom: 25px;
}

.daily-data {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f5f5f5;
  font-weight: 500;
}

.no-data {
  color: #999;
  font-style: italic;
}

@media (max-width: 600px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .summary {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 250px;
  }
}
</style>