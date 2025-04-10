<template>
  <div class="finance-page">
    <h2>每日消费记录</h2>
   
    <!-- 余额展示 -->
    <div class="balance-card">
      <h4>收支情况</h4>
      <h1 :class="{'positive': balance >= 0, 'negative': balance < 0}">
        ￥{{ Math.abs(balance).toFixed(2) }}
      </h1>
    </div>
    
    <!-- 收入支出汇总 -->
    <div class="summary-cards">
      <div class="income-card">
        <span>收入</span>
        <span class="amount positive">+￥{{ income.toFixed(2) }}</span>
      </div>
      <div class="expense-card">
        <span>支出</span>
        <span class="amount negative">-￥{{ expense.toFixed(2) }}</span>
      </div>
    </div>
    
    <!-- 交易历史 -->
    <div class="history-section">
      <h3>历史记录</h3>
      <div class="transaction-list">
        <div 
          v-for="t in dailyTransactions" 
          :key="t.id"
          class="transaction-item"
          :class="t.amount > 0 ? 'income' : 'expense'"
          @click="deleteTransaction(t.id)"
        >
          <span class="text">{{ t.text }}</span>
          <span class="amount">
            {{ t.amount > 0 ? '+' : '-' }}￥{{ Math.abs(t.amount).toFixed(2) }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- 添加新交易 -->
    <div class="add-transaction">
      <h3>添加新记录</h3>
      <!-- @submit.prevent="handleSubmit" -->
      <form >
        <div > 
          <label for = "transaction-text">条目</label>
          <input
            id = "transaction-text" 
            v-model="text"
            type="text" 
            placeholder="Enter text..." 
            required
          />
        </div>
        <div>
          <label for="transaction-amount">金额</label>
          <div class="hint">(负数 - 支出,正数 - 收入)</div>
          <input
            id = "transaction-amount" 
            v-model.number="amount"
            type="number"
            step="0.01"
            placeholder="Enter amount..."
            required
          />
        </div>
        <button type="submit" @click = "handleSubmit">添加记录</button>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useFinanceStore } from '@/stores/financeStore'
import { storeToRefs } from 'pinia'
import { onLoad } from '@dcloudio/uni-app'


const financeStore = useFinanceStore()
onLoad((options = {}) => {
  const date = options.date || new Date().toISOString().split('T')[0]
  financeStore.setCurrentDate(date)
})
// 设置当前日期（从路由参数获取）


const text = ref('')
const amount = ref<number | null>(null)
const currentDate = ref(new Date())

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth() + 1)
const currentDay = computed(() => currentDate.value.getDate())

const { dailyTransactions } = storeToRefs(financeStore)

  // 从 financeStore 获取每日汇总数据
const income = computed(() => dailyTransactions.value
  .filter(t => t.amount > 0)
  .reduce((sum, t) => sum + t.amount, 0))

const expense = computed(() => dailyTransactions.value
  .filter(t => t.amount < 0)
  .reduce((sum, t) => sum + Math.abs(t.amount), 0))

const balance = computed(() => income.value - expense.value)
  
const handleSubmit = () => {
  if (!text.value.trim()) {
    alert('请输入条目名称')
    return
  }

  if (amount.value === null || isNaN(amount.value)) {
    alert('请输入有效的金额')
    return
  }
 
  financeStore.addTransaction({
    date: financeStore.currentDate,
    text: text.value,
    amount: amount.value,
    type: amount.value > 0 ? 'income' : 'expense'
  })
  
  text.value = ''
  amount.value = null
  currentDate.value = new Date(currentDate.value)
}

const deleteTransaction = (id: string) => {
  if (confirm('Delete this transaction?')) {
    financeStore.deleteTransaction(id)
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.finance-page {
  width: 100%;
  max-width: 900px; /* 或根据需求调整 */
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

/* 移除之前异常的 200% 和 150% 设置 */

@media (min-width: 768px) {
  .finance-page {
    max-width: 900px; /* 在大屏幕上增加宽度 */
  }
}

@media (min-width: 1200px) {
  .finance-page {
    max-width: 1200px; /* 在超大屏幕上进一步增加宽度 */
  }
}
h2, h3, h4 {
  color: #333;
  margin-bottom: 15px;
}

.balance-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
}

.balance-card h4 {
  margin: 0;
  font-size: 14px;
  text-transform: uppercase;
}

.balance-card h1 {
  font-size: 32px;
  margin: 10px 0 0;
}

.positive {
  color: #2ecc71;
}

.negative {
  color: #e74c3c;
}

.summary-cards {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
}

.income-card, .expense-card {
  flex: 1;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  text-align: center;
}

.income-card {
  border-right: 4px solid #2ecc71;
}

.expense-card {
  border-right: 4px solid #e74c3c;
}

.summary-cards span {
  display: block;
}

.summary-cards .amount {
  font-size: 20px;
  font-weight: bold;
}

.history-section {
  margin-bottom: 30px;
}

.transaction-list {
  border-top: 1px solid #eee;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 5px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  position: relative;
}

.transaction-item:hover {
  background: #f8f9fa;
}

.transaction-item.income .amount {
  color: #2ecc71;
}

.transaction-item.expense .amount {
  color: #e74c3c;
}

.transaction-item::after {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}

.transaction-item.income::after {
  background: #2ecc71;
}

.transaction-item.expense::after {
  background: #e74c3c;
}

.add-transaction {
  border-top: 1px solid #eee;
  padding-top: 20px;
}



.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group .hint {
  font-size: 12px;
  color: #777;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  /* 确保没有以下属性 */
  pointer-events: none;
  opacity: 1 !important;
}

button {
  width: 100%;
  padding: 10px;
  background: #9c88ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
}

button:hover {
  background: #8c7ae6;
}
</style>