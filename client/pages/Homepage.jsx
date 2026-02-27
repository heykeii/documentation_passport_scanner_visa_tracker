
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import Navbar from '../component/Navbar'

const destinations = [
  {
    name: 'Santorini, Greece',
    image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=800&q=80',
    description: 'Whitewashed villages perched on volcanic cliffs',
    price: 'From $1,299',
    rating: '4.9',
    reviews: '2.3k'
  },
  {
    name: 'Kyoto, Japan',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    description: 'Ancient temples and zen gardens await!',
    price: 'From $1,499',
    rating: '4.8',
    reviews: '1.8k'
  },
  {
    name: 'Banff, Canada',
    image: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?auto=format&fit=crop&w=800&q=80',
    description: 'Majestic Rocky Mountain paradise',
    price: 'From $999',
    rating: '4.9',
    reviews: '2.1k'
  },
  {
    name: 'Marrakech, Morocco',
    image: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=800&q=80',
    description: 'Vibrant markets and ancient palaces',
    price: 'From $899',
    rating: '4.7',
    reviews: '1.5k'
  },
  {
    name: 'Bali, Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    description: 'Tropical beaches and sacred temples',
    price: 'From $799',
    rating: '4.8',
    reviews: '3.2k'
  },
  {
    name: 'Paris, France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    description: 'The city of lights and romance',
    price: 'From $1,599',
    rating: '4.9',
    reviews: '4.1k'
  },
]

const stats = [
  { value: '11M+', label: 'Happy Travelers' },
  { value: '150+', label: 'Countries' },
  { value: '50k+', label: 'Hotels' },
  { value: '4.9★', label: 'User Rating' },
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Travel Blogger',
    content: 'Travelly made planning my European tour effortless. Best travel platform ever!',
    avatar: 'https://i.pravatar.cc/150?img=1'
  },
  {
    name: 'Michael Chen',
    role: 'Photographer',
    content: 'Found hidden gems I never knew existed. The curated experiences are top-notch.',
    avatar: 'https://i.pravatar.cc/150?img=2'
  },
  {
    name: 'Emma Williams',
    role: 'Adventure Seeker',
    content: 'Amazing support and incredible deals. My go-to for all travel bookings!',
    avatar: 'https://i.pravatar.cc/150?img=3'
  },
]

const Homepage = () => {
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-orange-50 via-amber-50/30 to-white -z-10"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 space-y-6">
            <Badge variant="secondary" className="mb-4 px-4 py-1.5">
              ✨ Explore the World with Travelly
            </Badge>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Your Journey Starts
              <span className="block mt-2 bg-linear-to-r from-orange-500 via-orange-600 to-amber-500 bg-clip-text text-transparent">
                Right Here
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover breathtaking destinations, create unforgettable memories, and embark on adventures 
              that define your story. The world is waiting for you.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto mb-16">
            <Card className="p-6 shadow-2xl border-orange-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Destination</label>
                  <Input placeholder="Where to?" className="border-gray-200" />
                </div>
                <div className="md:col-span-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Check In</label>
                  <Input type="date" className="border-gray-200" />
                </div>
                <div className="md:col-span-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Check Out</label>
                  <Input type="date" className="border-gray-200" />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <Button className="w-full bg-linear-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/30 transition-all">
                    Search
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-white to-orange-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Trending Destinations
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Handpicked by travel experts, loved by adventurers worldwide
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations.map((dest, idx) => (
              <Card key={idx} className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-orange-100">
                <div className="relative overflow-hidden">
                  <img 
                    src={dest.image} 
                    alt={dest.name} 
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/95 text-orange-600 border-0 shadow-lg">
                      ⭐ {dest.rating}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <CardTitle className="text-xl mb-2">{dest.name}</CardTitle>
                      <CardDescription className="text-gray-600">{dest.description}</CardDescription>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-500">Starting from</span>
                      <p className="text-lg font-bold text-orange-600">{dest.price}</p>
                    </div>
                    <Button variant="outline" size="sm" className="group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600 transition-colors">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">
              View All Destinations →
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Travelly
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We make your travel dreams come true with excellence and care
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '🌍', title: 'Global Reach', desc: '150+ countries with 50,000+ verified hotels and experiences' },
              { icon: '💎', title: 'Premium Quality', desc: 'Handpicked destinations and 5-star rated accommodations' },
              { icon: '🎯', title: 'Best Prices', desc: 'Price match guarantee and exclusive member discounts' },
              { icon: '🛡️', title: 'Safe & Secure', desc: '24/7 support with secure payment and travel insurance' },
            ].map((item, idx) => (
              <Card key={idx} className="text-center p-8 hover:shadow-xl transition-shadow border-orange-100 bg-linear-to-br from-white to-orange-50/20">
                <div className="text-5xl mb-4">{item.icon}</div>
                <CardTitle className="text-lg mb-3">{item.title}</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">{item.desc}</CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-orange-50/30 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Loved by Travelers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join millions who trust Travelly for their adventures
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="p-8 hover:shadow-xl transition-shadow border-orange-100">
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name} 
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-orange-200" 
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed italic">"{testimonial.content}"</p>
                <div className="flex gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-orange-500">★</span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Explore the World?
          </h2>
          <p className="text-lg text-orange-100 mb-8">
            Subscribe to get exclusive deals, travel tips, and inspiration delivered to your inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/95 border-0 h-12 text-gray-900 placeholder:text-gray-500"
            />
            <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800 h-12 px-8 whitespace-nowrap">
              Subscribe Now
            </Button>
          </div>
          <p className="text-sm text-orange-100 mt-4">
            Join 100,000+ subscribers. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <span className="text-white font-bold">T</span>
                </div>
                <span className="text-xl font-bold text-white">Travelly</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your trusted companion for unforgettable journeys around the globe.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-500 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Follow Us</h3>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-orange-600 flex items-center justify-center transition-colors">
                  <span className="text-lg">𝕏</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-orange-600 flex items-center justify-center transition-colors">
                  <span className="text-lg">f</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-orange-600 flex items-center justify-center transition-colors">
                  <span className="text-lg">in</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-orange-600 flex items-center justify-center transition-colors">
                  <span className="text-lg">📷</span>
                </a>
              </div>
            </div>
          </div>
          
          <Separator className="bg-gray-800 my-8" />
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>© {new Date().getFullYear()} Travelly. All rights reserved.</p>
            <p>Made with ❤️ for travelers worldwide</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Homepage
