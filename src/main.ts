import { createSSRApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'



export function createApp() {
  const app = createSSRApp(App)
  app.use(createPinia())
  app.use(ElementPlus) // 引入 Element Plus
  return {
    app,
  }
}