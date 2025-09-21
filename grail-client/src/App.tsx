import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppShell from './components/AppShell'
import ItemsPage from './features/items/ItemsPage'
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
        element: (
          <ComingSoon
            title="Sets & Runewords"
            description="Track set items and runeword progress from a single hub."
          />
        ),
      },
      {
        path: 'stats',
        element: (
          <ComingSoon
            title="Stats & Insights"
            description="Visualize drop trends and collection milestones with charts and heatmaps."
          />
        ),
      },
      {
        path: 'settings',
        element: (
          <ComingSoon
            title="Settings & Data"
            description="Manage your profile, theme preferences, and import/export flows."
          />
        ),
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
