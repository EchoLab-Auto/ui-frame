import { createApp } from 'vue'
import App from './App.vue'
import NeumorphismUI from '../src/index'
import '../src/styles/index.scss'

const app = createApp(App)
app.use(NeumorphismUI)
app.mount('#app')
