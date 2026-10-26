import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import NeumorphismUI from '../src/index'
import '../src/styles/index.scss'
// 演示页共用排版（卡片 / 展示+配置台 / 参数行 / 变体矩阵）
import './styles/demo.scss'

const app = createApp(App)

// Router
app.use(router)

// Global config — set default props for all components
app.use(NeumorphismUI, {
  button: {
    size: 'medium',
  },
  input: {
    size: 'medium',
  },
  select: {
    size: 'medium',
    clearable: true,
  },
  modal: {
    maskClosable: true,
  },
  toast: {
    position: 'top-right',
    maxCount: 5,
  },
  pagination: {
    showTotal: false,
  },
})

app.mount('#app')
