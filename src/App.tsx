import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import WhatToWear from './pages/WhatToWear'
import './App.scss'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/what-to-wear" element={<WhatToWear />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
