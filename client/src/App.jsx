
import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

const App = () => {
  return (
    <Routes>
      <Route path='/' element={<Login/>} />
      <Route path='/dashboard' element={<Dashboard/>}/>
      <Route path='/verify-email' element={<VerifyEmail/>}/>
      <Route path='/forgot-password' element={<ForgotPassword/>}/>
      <Route path='/reset-password' element={<ResetPassword/>}/>
    </Routes>
  )
}

export default App
