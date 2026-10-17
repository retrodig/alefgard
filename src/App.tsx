import { createHashRouter, Navigate, RouterProvider } from 'react-router'
import { Layout } from './components/Layout'
import { ComingSoon } from './pages/ComingSoon'
import { DataLayout } from './pages/Data/DataLayout'
import { EquipmentPage } from './pages/Data/EquipmentPage'
import { ItemsPage } from './pages/Data/ItemsPage'
import { LevelsPage } from './pages/Data/LevelsPage'
import { MonstersPage } from './pages/Data/MonstersPage'
import { SpellsPage } from './pages/Data/SpellsPage'
import { Home } from './pages/Home'
import { JumonPage } from './pages/Jumon/JumonPage'
import { NotFound } from './pages/NotFound'

// GitHub Pages で直リンク・リロードが確実に動くよう HashRouter を使う
const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'jumon', element: <JumonPage /> },
      { path: 'battle', element: <ComingSoon title="せんとうシミュレータ" /> },
      { path: 'world', element: <ComingSoon title="アレフガルドのせかい" /> },
      {
        path: 'data',
        element: <DataLayout />,
        children: [
          { index: true, element: <Navigate to="monsters" replace /> },
          { path: 'monsters', element: <MonstersPage /> },
          { path: 'equipment', element: <EquipmentPage /> },
          { path: 'items', element: <ItemsPage /> },
          { path: 'spells', element: <SpellsPage /> },
          { path: 'levels', element: <LevelsPage /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
