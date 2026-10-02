import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const CREATOR_SDK_URL = 'https://static.zohocdn.com/creator/widgets/version/2.0/widgetsdk-min.js'

function loadCreatorSdk(): Promise<void> {
  if (window.ZOHO?.CREATOR) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = CREATOR_SDK_URL
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Zoho Creator Widget SDK V2 could not be loaded.'))
    document.head.append(script)
  })
}

async function bootstrap() {
  const root = document.getElementById('root')!
  try {
    if (import.meta.env.PROD) await loadCreatorSdk()
    const { default: App } = await import('./App')
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The editorial workspace could not start.'
    root.textContent = message
    root.className = 'bootstrap-error'
  }
}

void bootstrap()
