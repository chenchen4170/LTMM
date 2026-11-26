import { SettingsPage } from './features/settings'
import { MainPage } from './pages/MainPage'

// Electron 以 `#/settings` 打开设置窗口，与主窗口共用同一份前端代码
const isSettingsWindow = window.location.hash === '#/settings'

function App() {
  return isSettingsWindow ? <SettingsPage /> : <MainPage />
}

export default App
