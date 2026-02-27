
import Login from '../pages/Login'
import Homepage from '../pages/Homepage'
import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Signup from '../pages/Signup'
import Destinations from '../pages/Destinations'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element = {<Homepage/>}/>
        <Route path='/login' element = {<Login/>}/>
        <Route path='/signup' element = {<Signup/>}/>
        <Route path='/destinations' element = {<Destinations/>}/>
      </Routes>
    </div>
  )
}

export default App
