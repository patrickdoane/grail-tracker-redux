import { useEffect, useState } from 'react'
import './App.css'

type Item = {
  id: number
  name: string
  type: string | null
  quality: string | null
  rarity: string | null
  description: string | null
  d2Version: string | null
}

type LoadState = 'idle' | 'loading' | 'error'

function App() {
  const [items, setItems] = useState<Item[]>([])
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const fetchItems = async () => {
      setLoadState('loading')
      setErrorMessage(null)
      try {
        const response = await fetch('/api/items', { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }
        const data: Item[] = await response.json()
        setItems(data)
        setLoadState('idle')
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }
        const message = error instanceof Error ? error.message : 'Unexpected error'
        setErrorMessage(message)
        setLoadState('error')
      }
    }

    fetchItems()

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="app__eyebrow">Prototype</p>
          <h1>Holy Grail Items</h1>
        </div>
        <p className="app__lead">
          This quick list verifies that the frontend can reach the Spring Boot API. Once
          everything looks good, we can iterate on the full dashboard experience.
        </p>
      </header>

      <section aria-live="polite">
        {loadState === 'loading' && <p className="status status--loading">Loading items…</p>}
        {loadState === 'error' && (
          <div className="status status--error">
            <p>Could not load the items from the API.</p>
            {errorMessage && <p className="status__detail">{errorMessage}</p>}
            <p className="status__hint">
              Ensure the backend is running on <code>localhost:8080</code> or adjust the Vite proxy.
            </p>
          </div>
        )}

        {loadState !== 'loading' && loadState !== 'error' && items.length === 0 && (
          <p className="status">No items found yet. Try seeding the database.</p>
        )}

        {items.length > 0 && (
          <ul className="item-list">
            {items.map((item) => (
              <li key={item.id} className="item-card">
                <div className="item-card__header">
                  <h2>{item.name}</h2>
                  {item.quality && <span className="item-card__quality">{item.quality}</span>}
                </div>
                <dl className="item-card__meta">
                  {item.type && (
                    <div>
                      <dt>Type</dt>
                      <dd>{item.type}</dd>
                    </div>
                  )}
                  {item.rarity && (
                    <div>
                      <dt>Rarity</dt>
                      <dd>{item.rarity}</dd>
                    </div>
                  )}
                  {item.d2Version && (
                    <div>
                      <dt>Version</dt>
                      <dd>{item.d2Version}</dd>
                    </div>
                  )}
                </dl>
                {item.description && <p className="item-card__description">{item.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default App
