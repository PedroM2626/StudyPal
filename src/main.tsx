/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'

loadSkipLib()

createRoot(document.getElementById('root')!).render(<App />)

function loadSkipLib() {
  const events: Parameters<typeof window.onerror>[] = []
  const w = window
  const d = document
  const scripts = d.createElement('script')

  function onError(message, source, line, column, error) {
    events.push([message, source, line, column, error])
  }

  w.onerror = onError
  w.onunhandledrejection = (errorEvent) =>
    onError(
      errorEvent.reason.message,
      errorEvent.reason.source,
      errorEvent.reason.line,
      errorEvent.reason.column,
      errorEvent.reason,
    )

  d.head.appendChild(scripts)
}
