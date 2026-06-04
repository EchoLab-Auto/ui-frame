import { createApp } from 'vue'
import App from './App.vue'
import NeumorphismUI from '../src/index'
import '../src/styles/index.scss'

const app = createApp(App)

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
