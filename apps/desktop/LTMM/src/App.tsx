import { AppLayout } from './components/AppLayout'
import { FileListPanel } from './features/file-list'
import { FileViewerPanel } from './features/file-viewer'
import { SettingsPage } from './features/settings'
import { StatsPanel } from './features/stats'

// Electron 以 `#/settings` 打开设置窗口，与主窗口共用同一份前端代码
const isSettingsWindow = window.location.hash === '#/settings'

function App() {
  if (isSettingsWindow) return <SettingsPage />

  return (
    <AppLayout
      left={<FileListPanel />}
      center={<FileViewerPanel />}
      right={<StatsPanel />}
    />
  )
}

export default App
