
import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Signup from './pages/Signup'

const App = () => {
  return (
    <Routes>
      <Route path='/' element={<Signup/>} />
    </Routes>
  )
}

export default App
