import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import LocalMode from './pages/LocalMode'
import NomadMode from './pages/NomadMode'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/local" element={<LocalMode />} />
      <Route path="/nomad" element={<NomadMode />} />
    </Routes>
  )
}
