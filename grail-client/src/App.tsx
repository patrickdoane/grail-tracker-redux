import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppShell from './components/AppShell'
import ItemsPage from './features/items/ItemsPage'
import StatsPage from './features/stats/StatsPage'
import SetsRunewordsPage from './features/sets/SetsRunewordsPage'
import SettingsPage from './features/settings/SettingsPage'
import './App.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <ItemsPage />,
      },
      {
        path: 'items',
        element: <ItemsPage />,
      },
      {
        path: 'sets',
        element: <SetsRunewordsPage />,
      },
      {
        path: 'stats',
        element: <StatsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: (
          <ComingSoon
            title="Page not found"
            description="We couldn't find that view yet. Use the navigation above to get back on track."
          />
        ),
      },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App

type ComingSoonProps = {
  title: string
  description: string
}

function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="page coming-soon">
      <header className="page__header">
        <p className="page__eyebrow">Coming soon</p>
        <h1>{title}</h1>
      </header>
      <p className="page__lead">{description}</p>
    </div>
  )
}
