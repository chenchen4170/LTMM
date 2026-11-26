import { AppLayout } from './components/AppLayout'
import { FileListPanel } from './features/file-list'
import { FileViewerPanel } from './features/file-viewer'
import { StatsPanel } from './features/stats'

function App() {
  return (
    <AppLayout
      left={<FileListPanel />}
      center={<FileViewerPanel />}
      right={<StatsPanel />}
    />
  )
}

export default App
