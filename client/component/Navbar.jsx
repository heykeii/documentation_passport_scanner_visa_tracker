import React from 'react'
import { Button } from '../src/components/ui/button'
import { useNavigate } from 'react-router-dom'

const Navbar = () => {
  const navigate = useNavigate()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">Tradewings</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#" onClick={() => navigate("/destinations")} className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">Destinations</a>
            <a href="#" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">Experiences</a>
            <a href="#" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">About</a>
            <a href="#" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/login')} variant="ghost" size="sm" className="hidden sm:flex">Sign In</Button>
            <Button onClick={() => navigate('/signup')} size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/30 transition-all">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
